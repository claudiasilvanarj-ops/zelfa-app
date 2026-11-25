import { NO_PHOTO_REPLY } from "@/lib/chef";
import { conflicts, dietPrompt, effectiveRestrictions, restrictionNames } from "@/lib/diet";
import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, generateId, isStepCount, streamText, tool, type UIMessage } from "ai";
import { CATEGORY_LABEL, RECIPE_CATEGORIES, RECIPES, DYNAMIC_RECIPE_RULES, bankCovers, categoryAnswer, suggestedNames, type RecipeCategory } from "@/lib/recipes";
import { z } from "zod";
import { getUserClient } from "@/lib/supabase-user.server";
import { BASE_PERSONA, CATEGORIES, MODES, MODE_PROMPTS, type Mode } from "@/lib/zelfa-prompts";
import { MARKET_SECTORS, marketNotes } from "@/lib/shopping";
import { HOUSEHOLD_KINDS, HOUSEHOLD_PROMPT } from "@/lib/household";
import { addHousehold, changeRoutine, householdContext, reorganizeHousehold } from "@/lib/household.server";

const TZ = "America/Sao_Paulo";
const fmt = (d: Date) =>
  d.toLocaleString("pt-BR", { timeZone: TZ, weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

async function fetchHeadlines(): Promise<string[]> {
  try {
    const res = await fetch("https://g1.globo.com/rss/g1/", { headers: { "user-agent": "Mozilla/5.0 ZELFA" } });
    if (!res.ok) return [];
    const xml = await res.text();
    const titles = [...xml.matchAll(/<item>[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/g)].map((m) => (m[1] ?? "").trim());
    return titles.slice(0, 15);
  } catch {
    return [];
  }
}

/** Keep only the last photos so long chats stay light. */
function lighten(messages: UIMessage[]): UIMessage[] {
  const keepFrom = messages.length - 4;
  return messages.slice(-30).map((m, i, arr) => {
    const idx = messages.length - arr.length + i;
    if (idx >= keepFrom) return m;
    return {
      ...m,
      parts: m.parts.map((p) => (p.type === "file" ? { type: "text" as const, text: "[foto enviada anteriormente]" } : p)),
    };
  });
}

export const Route = createFileRoute("/api/chat")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ctx = await getUserClient(request);
        if (!ctx) return new Response("Faça login para conversar com a ZELFA.", { status: 401 });
        const { supabase, user } = ctx;
        const peek = (await request.clone().json().catch(() => ({}))) as { device?: string };
        const { data: access } = await supabase.rpc("access_status", { _device: typeof peek.device === "string" && /^[0-9a-f-]{36}$/i.test(peek.device) ? peek.device : "00000000-0000-0000-0000-000000000000" });
        if (access === "other_device") return new Response("Sua conta entrou em outro aparelho.", { status: 403 });
        if (access !== "ok") return new Response("Assinatura não ativa.", { status: 402 });
        const geminiKey = process.env["GEMINI_API_KEY"]?.trim();
        const openaiKey = process.env["OPENAI_API_KEY"]?.trim();
        const apiKey = geminiKey || openaiKey;
        if (!apiKey) return new Response("Configuração de IA ausente (configure GEMINI_API_KEY no .env).", { status: 500 });

        const body = (await request.json()) as { message?: UIMessage; mode?: string; categoria?: string; filtro?: string };
        const message = body.message;
        if (!message || message.role !== "user" || !Array.isArray(message.parts)) {
          return new Response("Mensagem inválida.", { status: 400 });
        }
        if (message.parts.some((p) => p.type === "file")) {
          // Fotos foram removidas do app: responde com carinho sem enviar a imagem para a IA nem salvá-la.
          const stream = createUIMessageStream({
            execute: ({ writer }) => {
              const id = generateId();
              writer.write({ type: "text-start", id });
              writer.write({ type: "text-delta", id, delta: NO_PHOTO_REPLY });
              writer.write({ type: "text-end", id });
            },
          });
          return createUIMessageStreamResponse({ stream });
        }
        const mode: Mode = (MODES as readonly string[]).includes(body.mode ?? "") ? (body.mode as Mode) : "geral";

        const { data: rows, error: histErr } = await supabase
          .from("chat_messages")
          .select("message")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(40);
        if (histErr) return new Response("Não consegui carregar a conversa.", { status: 500 });
        const history = (rows ?? []).map((r) => r.message as unknown as UIMessage).reverse();

        const { error: saveErr } = await supabase
          .from("chat_messages")
          .insert({ user_id: user.id, message: message as never });
        if (saveErr) return new Response("Não consegui salvar sua mensagem.", { status: 500 });

        const messages = [...history, message];
        try { await reorganizeHousehold(supabase, user.id); } catch { /* The tools expose planning errors without interrupting other conversations. */ }
        const house = await householdContext(supabase, user.id);
        const now = new Date();
        const weekEnd = new Date(now.getTime() + 7 * 864e5);
        const [{ data: appts }, { data: items }, { data: profile }] = await Promise.all([
          supabase.from("appointments").select("title,category,starts_at,location,repeat_daily").gte("starts_at", new Date(now.getTime() - 864e5).toISOString()).lte("starts_at", weekEnd.toISOString()).order("starts_at"),
          supabase.from("shopping_items").select("name,quantity,sector,estimated_price").eq("checked", false),
          supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        ]);
        const { data: diet } = await supabase.from("dietary_restrictions").select("restrictions,preference,notes").eq("user_id", user.id).maybeSingle();

        const filtro = body.filtro === "vegetariano" || body.filtro === "vegano" ? body.filtro : null;
        const restrictionsNow = effectiveRestrictions(diet?.restrictions ?? [], diet?.preference, filtro);
        const textOf = (m: UIMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("\n");
        const recentAnswers = history.filter((m) => m.role === "assistant").slice(-3).map(textOf).join("\n");
        const categoria = (RECIPE_CATEGORIES as readonly string[]).includes(body.categoria ?? "") ? (body.categoria as RecipeCategory) : null;
        const categoryNote = categoria
          ? `\nPEDIDO NA CATEGORIA ${CATEGORY_LABEL[categoria]}: crie receitas somente dessa categoria, sem misturar outras, respeitando as restrições. Mostre cada receita com título "### Nome", ingredientes e modo de preparo.`
          : "";
        const userText = textOf(message);
        const mentionedOwnIngredients = /\b(tenho|só tenho|so tenho|em casa|na geladeira|com\s+[a-zà-ú])/i.test(userText);
        if (categoria && !mentionedOwnIngredients && bankCovers(categoria, restrictionsNow, userText, recentAnswers)) {
          // Pedido genérico de botão de categoria (sem ingredientes próprios): usa o banco daquela categoria.
          const answer = categoryAnswer(categoria, restrictionsNow, userText, recentAnswers);
          const stream = createUIMessageStream({
            originalMessages: messages,
            generateId,
            execute: ({ writer }) => {
              const id = generateId();
              writer.write({ type: "text-start", id });
              writer.write({ type: "text-delta", id, delta: answer });
              writer.write({ type: "text-end", id });
            },
            onEnd: async ({ responseMessage }) => {
              const { error } = await supabase.from("chat_messages").insert({ user_id: user.id, message: responseMessage as never });
              if (error) console.error("Falha ao salvar resposta da ZELFA", error);
            },
          });
          return createUIMessageStreamResponse({ stream });
        }
        const recentDishes = suggestedNames(recentAnswers).concat([...recentAnswers.matchAll(/^#{2,4}\s+(.+)$/gm)].map((m) => (m[1] ?? "").trim())).slice(-12);
        const varietyRules = `
REGRAS DE VARIEDADE E INGREDIENTES (obrigatórias):
- REGRA PRINCIPAL: se a pessoa informar ingredientes que tem em casa, crie receitas usando APENAS esses ingredientes informados (além de básicos essenciais como sal, água e óleo/azeite). NUNCA acrescente nem troque por ingredientes que ela não citou.
- Nunca repita pratos já sugeridos nas últimas 3 respostas: ${[...new Set(recentDishes)].join("; ") || "nenhum ainda"}. Mesmo com os mesmos ingredientes, traga receitas DIFERENTES.
- Quando a pessoa listar ingredientes ou pedir sugestões, entregue no mínimo 3 receitas completas (se ela pedir 1 prato específico, entregue esse prato completo).
- Doces/sobremesas nunca incluem pratos salgados; vegano nunca inclui carne, ovo, leite, queijo, manteiga ou mel.
- Se o pedido for ambíguo (sem categoria e sem ingredientes, ex.: "me dá uma receita"), pergunte antes: "Você quer algo salgado, doce, vegano ou saudável?" e não sugira receitas ainda.`;

        let extra = "";
        if (mode === "noticias") {
          const h = await fetchHeadlines();
          extra = h.length ? `\nManchetes de hoje (g1):\n- ${h.join("\n- ")}` : "\nManchetes: indisponíveis agora.";
        }

        const restrictions = restrictionsNow;
        const instructions = `${dietPrompt(restrictions, diet?.notes)}

${BASE_PERSONA}

${MODE_PROMPTS[mode]}
${dietPrompt(restrictions, diet?.notes)}
${varietyRules}
${DYNAMIC_RECIPE_RULES}${categoryNote}
${HOUSEHOLD_PROMPT}
Rotina doméstica: ${JSON.stringify(house.routine)}.
Tarefas domésticas: ${house.entries.filter((a) => a.household_task && !a.done).map((a) => `${a.id}: ${a.title} — ${fmt(new Date(a.starts_at))}, ${a.duration_minutes} minutos`).join("; ") || "nenhuma"}.
Nome da pessoa usuária: ${profile?.display_name ?? "chef"}.
Agora é ${fmt(now)} (horário de Brasília). Data ISO de hoje: ${now.toLocaleDateString("sv-SE", { timeZone: TZ })}.
Agenda dos próximos 7 dias: ${(appts ?? []).map((a) => `${fmt(new Date(a.starts_at))} — ${a.title} [${a.category}]${a.location ? " em " + a.location : ""}${a.repeat_daily ? " (todo dia)" : ""}`).join("; ") || "nenhum compromisso"}.
Lista de compras atual (não é estoque em casa): ${(items ?? []).map((i) => i.name + (i.quantity ? ` (${i.quantity})` : "") + ` [${i.sector}]`).join(", ") || "vazia"}.${extra}`;

        const provider = geminiKey
          ? createOpenAI({
              baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
              apiKey: geminiKey,
            })
          : createOpenAI({ apiKey: openaiKey! });
        const modelName = geminiKey
          ? process.env["GEMINI_MODEL"]?.trim() || "gemini-3.5-flash-lite"
          : process.env["OPENAI_MODEL"]?.trim() || "gpt-4o-mini";

        const tools = {
          planejar_casa: tool({
            description: "Distribui tarefas domésticas pela semana sem sobrecarga, estima a duração e anexa compras ao mercado.",
            inputSchema: z.object({ tarefas: z.array(z.object({ title: z.string().min(1).max(200), task_kind: z.enum(HOUSEHOLD_KINDS), duration_minutes: z.number().int().min(1).max(720), earliest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() })).min(1).max(30) }),
            execute: async ({ tarefas }) => {
              try { return { ok: true, tarefas: await addHousehold(supabase, user.id, tarefas) }; }
              catch (error) { return { ok: false, erro: error instanceof Error ? error.message : "Não consegui planejar." }; }
            },
          }),
          ajustar_rotina_casa: tool({
            description: "Salva disponibilidade e redistribui tarefas domésticas pendentes. Mantém campos não enviados.",
            inputSchema: z.object({ daily_minutes: z.number().int().min(15).max(720).optional(), start_hour: z.number().int().min(0).max(22).optional(), end_hour: z.number().int().min(1).max(23).optional(), blocked_dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional() }),
            execute: async (patch) => {
              try { return { ok: true, ajustes: await changeRoutine(supabase, user.id, patch) }; }
              catch (error) { return { ok: false, erro: error instanceof Error ? error.message : "Não consegui ajustar." }; }
            },
          }),
          atualizar_tarefa_casa: tool({
            description: "Conclui ou adia uma tarefa doméstica existente, usando o ID da agenda.",
            inputSchema: z.object({ id: z.string().uuid(), acao: z.enum(["concluir", "adiar"]), earliest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }),
            execute: async ({ id, acao, earliest }) => {
              try {
                if (acao === "adiar") { const ajustes = await reorganizeHousehold(supabase, user.id, false, earliest, id); return { ok: ajustes.length > 0, ajustes }; }
                const { data, error } = await supabase.from("appointments").update({ done: true }).eq("id", id).eq("user_id", user.id).eq("household_task", true).select("id");
                return { ok: !error && (data?.length ?? 0) > 0 };
              } catch (error) { return { ok: false, erro: error instanceof Error ? error.message : "Não consegui ajustar." }; }
            },
          }),
          criar_compromisso: tool({
            description: "Cria um compromisso ou lembrete na agenda da pessoa usuária.",
            inputSchema: z.object({
              titulo: z.string(),
              categoria: z.enum(CATEGORIES),
              inicio_iso: z.string().describe("Data e hora no formato ISO com fuso -03:00, ex: 2026-10-28T19:00:00-03:00"),
              local: z.string().nullable(),
              observacoes: z.string().nullable(),
              repetir_todo_dia: z.boolean(),
            }),
            execute: async (i) => {
              const iso = /([+-]\d{2}:?\d{2}|Z)$/.test(i.inicio_iso) ? i.inicio_iso : `${i.inicio_iso}-03:00`;
              const d = new Date(iso);
              if (isNaN(d.getTime())) return { ok: false, erro: "data inválida" };
              let notes = i.observacoes;
              if (i.categoria === "Mercado") {
                const { data: currentItems, error: listError } = await supabase.from("shopping_items").select("name,quantity,sector,estimated_price").eq("checked", false);
                if (listError) return { ok: false, erro: "Não consegui anexar a lista de compras." };
                notes = marketNotes(notes, currentItems ?? []);
              }
              const { error } = await supabase.from("appointments").insert({
                user_id: user.id,
                title: i.titulo,
                category: i.categoria,
                starts_at: d.toISOString(),
                location: i.local,
                notes,
                repeat_daily: i.repetir_todo_dia,
              });
              return error ? { ok: false, erro: error.message } : { ok: true, quando: fmt(d) };
            },
          }),
          adicionar_compras: tool({
            description: "Adiciona ingredientes faltantes com quantidade, setor e estimativa total em reais; não é cotação atual.",
            inputSchema: z.object({
              itens: z.array(z.object({ nome: z.string(), quantidade: z.string().nullable(), setor: z.enum(MARKET_SECTORS), preco_estimado: z.number().min(0).nullable() })),
            }),
            execute: async ({ itens }) => {
              const barrados = conflicts(itens.map((it) => it.nome), restrictions).map((c) => c.ingredient);
              itens = itens.filter((it) => !barrados.includes(it.nome));
              if (!itens.length) return { ok: false, erro: `Não anotei ${barrados.join(", ")}: está nas restrições da pessoa usuária.` };
              const { error } = await supabase
                .from("shopping_items")
                .insert(itens.map((it) => ({ user_id: user.id, name: it.nome, quantity: it.quantidade, sector: it.setor, estimated_price: it.preco_estimado })));
              return error ? { ok: false, erro: error.message } : { ok: true, adicionados: itens.map((x) => x.nome) };
            },
          }),
        };

        const result = streamText({
          model: provider.chat(modelName),
          system: instructions,
          messages: await convertToModelMessages(lighten([
            ...history,
            // Lembrete junto da mensagem atual (não é salvo): restrições cadastradas agora valem acima do histórico.
            { ...message, parts: [{ type: "text" as const, text: `[Restrições cadastradas agora: ${restrictionNames(restrictions)}. Siga só estas; ignore dietas pedidas em mensagens antigas.]` }, ...message.parts] },
          ])),
          tools,
          stopWhen: isStepCount(5),
          abortSignal: request.signal,
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          generateMessageId: generateId,
          onFinish: async ({ responseMessage }) => {
            if (!responseMessage.parts?.length) return;
            const { error } = await supabase
              .from("chat_messages")
              .insert({ user_id: user.id, message: responseMessage as never });
            if (error) console.error("Falha ao salvar resposta da ZELFA", error);
          },
          onError: (err) => {
            console.error(err);
            return "Ai, tive um probleminha para responder agora. Tente de novo daqui a pouquinho? 💛";
          },
        });
      },
    },
  },
});
