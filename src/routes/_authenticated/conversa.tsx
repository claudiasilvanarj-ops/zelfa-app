import { deviceId } from "@/lib/access";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Mic, MicOff, Send, Square, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MODES, type Mode } from "@/lib/zelfa-prompts";
import { MODE_HINTS, MODE_TITLES } from "@/lib/features";
import { speak, stopSpeaking, useSpeechInput } from "@/lib/voice";
import avatar from "@/assets/zelfa-avatar.png";
import { MusicExternalLinks } from "@/components/MusicExternalLinks";
import { essentialSpeech } from "@/lib/voice-rules";
import { QUICK_FILTERS, effectiveRestrictions, guardRecipes } from "@/lib/diet";
import { NO_PHOTO_REPLY } from "@/lib/chef";
import { splitRecipes, VISIBLE_MESSAGES } from "@/lib/recipe-cards";
import { isCelebration } from "@/lib/community";
import { ShareDish } from "@/components/ShareDish";
import { RecipeCardView } from "@/components/RecipeCardView";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/conversa")({
  staticData: { sitemap: false },
  validateSearch: z.object({
    modo: z.enum(MODES).optional(),
    iniciar: z.string().optional(),
    categoria: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Conversa com a ZELFA" },
      { name: "description", content: "Converse com a ZELFA por texto ou voz." },
      { property: "og:title", content: "Conversa com a ZELFA" },
      { property: "og:description", content: "Texto ou voz — a ZELFA responde com carinho." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async () => {
    const [{ data }, { data: diet }] = await Promise.all([
      supabase.from("chat_messages").select("message").order("created_at", { ascending: false }).limit(60),
      supabase.from("dietary_restrictions").select("restrictions,preference").maybeSingle(),
    ]);
    return { initial: (data ?? []).map((r, i) => { const m = r.message as unknown as UIMessage; return m.id ? m : { ...m, id: `antiga-${i}` }; }).reverse(), restrictions: diet?.restrictions ?? [], preference: diet?.preference ?? null };
  },
  component: ConversaPage,
});

function textOf(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ");
}

function ConversaPage() {
  const { modo, iniciar, categoria } = Route.useSearch();
  // A categoria vale só para o pedido feito pelo botão; depois a conversa segue livre.
  const categoriaRef = useRef<string | undefined>(categoria);
  const { initial, restrictions: savedRestrictions, preference } = Route.useLoaderData();
  const [filtro, setFiltro] = useState<string>("todas");
  const filtroRef = useRef(filtro);
  filtroRef.current = filtro;
  const restrictions = effectiveRestrictions(savedRestrictions, preference, filtro);
  const mode: Mode = modo ?? "geral";
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const [input, setInput] = useState("");
  const speakNext = useRef(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [transport] = useState(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: async ({ messages }) => {
          const { data } = await supabase.auth.getSession();
          return {
            headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` },
            body: { device: deviceId(), message: messages[messages.length - 1], mode: modeRef.current, filtro: filtroRef.current, categoria: (() => { const c = categoriaRef.current; categoriaRef.current = undefined; return c; })() },
          };
        },
      }),
  );

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: "zelfa",
    messages: initial,
    transport,
    onError: (e) => {
      const m = e.message || "";
      if (m.includes("402")) toast.error("Os créditos de IA acabaram. Peça para quem cuida do app recarregar.");
      else if (m.includes("429")) toast.error("Muita gente falando comigo agora. Tente em um minutinho.");
      else toast.error(m.length < 140 ? m : "Tive um probleminha. Vamos tentar de novo?");
    },
    onFinish: ({ message }) => {
      // Voz só toca quando a pessoa usuária aperta "Ouvir" na mensagem.
      void message;
      speakNext.current = false;
      textRef.current?.focus();
    },
  });
  const busy = status === "submitted" || status === "streaming";

  const send = async (text: string) => {
    if (!text.trim()) return;
    if (busy) return;
    stopSpeaking(); // uma fala por vez: novo pedido interrompe a fala atual
    await sendMessage({ text: text.trim() });
  };

  const started = useRef(false);
  useEffect(() => {
    // Adia um instante: no modo de desenvolvimento a tela monta duas vezes e o primeiro envio era cancelado.
    const t = setTimeout(() => {
    if (started.current) return;
    started.current = true;
    if (iniciar) void send(iniciar);
    textRef.current?.focus();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const mic = useSpeechInput((t) => {
    speakNext.current = true;
    void send(t);
  });

  // Sem fotos: se a pessoa colar ou arrastar uma imagem, a ZELFA responde com carinho (sem enviar a imagem).
  function refuseImage(e: { clipboardData?: DataTransfer | null; dataTransfer?: DataTransfer | null; preventDefault: () => void }) {
    const items = [...((e.clipboardData ?? e.dataTransfer)?.files ?? [])];
    if (!items.some((f) => f.type.startsWith("image/"))) return;
    e.preventDefault();
    setMessages((old) => [...old, { id: `sem-foto-${Date.now()}`, role: "assistant", parts: [{ type: "text", text: NO_PHOTO_REPLY }] }]);
  }

  async function submit() {
    const t = input;
    setInput("");
    await send(t);
    textRef.current?.focus();
  }

  const [showAll, setShowAll] = useState(false);
  const hidden = showAll ? 0 : Math.max(0, messages.length - VISIBLE_MESSAGES);

  async function clearAll() {
    stopSpeaking();
    const { error } = await supabase.from("chat_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) { toast.error("Não consegui apagar agora."); return; }
    setMessages([]);
    setShowAll(false);
    toast.success("Conversa limpa! Suas receitas salvas continuam no caderno. 💛");
  }

  const hint = MODE_HINTS[mode];
  const latestMusicRequest = [...messages].reverse().find(message => message.role === "user");

  return (
    <AppShell title={MODE_TITLES[mode]}>
      <div className="flex min-h-[calc(100vh-9rem)] flex-col">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Link to="/configuracoes" className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 font-semibold text-secondary-foreground">
            <Volume2 className="h-5 w-5" /> Voz da ZELFA
          </Link>
          <Button variant="secondary" className="h-auto rounded-full px-4 py-2 font-semibold" aria-label="Parar a fala" onClick={() => stopSpeaking()}><Square className="h-5 w-5" /> Parar a fala</Button>
          {mode !== "geral" && (
            <Link to="/conversa" search={{}} className="rounded-full border px-4 py-2 font-semibold">Conversa livre</Link>
          )}
          <Link to="/caderno" className="flex items-center gap-1 rounded-full border px-4 py-2 font-semibold">📖 Meu caderno</Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="ml-auto flex items-center gap-1 rounded-full bg-gold px-4 py-2 font-bold text-gold-foreground" aria-label="Limpar conversa">🧹 Limpar conversa</button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar a conversa?</AlertDialogTitle>
                <AlertDialogDescription className="text-lg">Suas receitas salvas continuam no caderno. Se quiser guardar alguma receita antes, toque em 💾 SALVAR.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => void clearAll()}>Sim, limpar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div role="group" aria-label="Tipo de receita" className="mb-3 flex flex-wrap gap-2">
          {QUICK_FILTERS.map((f) => (
            <button key={f.key} type="button" aria-pressed={filtro === f.key} onClick={() => setFiltro(f.key)}
              className={`rounded-full border-2 px-4 py-2 text-base font-semibold ${filtro === f.key ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="flex items-start gap-3 rounded-3xl bg-card p-5 shadow-soft">
              <img src={avatar} alt="" width={816} height={816} className="h-14 w-14" />
              <p className="text-xl"><b>Olá! Que bom te ver! 💛 Vamos cozinhar hoje? 🍳</b><br />Pode escrever ou falar no microfone 🎤 o que você tem em casa. {hint}</p>
            </div>
          )}
          {hidden > 0 && (
            <button onClick={() => setShowAll(true)} className="w-full rounded-full border px-4 py-2 font-semibold text-muted-foreground">⬆️ Ver mensagens anteriores ({hidden})</button>
          )}
          {messages.slice(hidden).map((m) => (
            <MessageBubble key={m.id} m={m} restrictions={restrictions} />
          ))}
          {status === "submitted" && (
            <div className="flex items-center gap-3">
              <img src={avatar} alt="" width={816} height={816} className="h-10 w-10" />
              <span className="animate-pulse text-lg text-muted-foreground">ZELFA está pensando com carinho...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 pb-4 pt-3 backdrop-blur">
          {mode === "canto" && <div className="mb-3"><MusicExternalLinks query={input.trim() || (latestMusicRequest ? textOf(latestMusicRequest) : "")} beforeOpen={stopSpeaking} /></div>}
          {hint && messages.length > 0 && <p className="mb-2 text-sm text-muted-foreground">{hint}</p>}
          <div className="flex items-end gap-2">
            <textarea
              ref={textRef}
              value={input}
              rows={1}
              onChange={(e) => setInput(e.target.value)}
              onPaste={refuseImage}
              onDrop={refuseImage}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit();
                }
              }}
              placeholder="Escreva para a ZELFA..."
              className="max-h-40 min-h-[3.75rem] flex-1 resize-none rounded-3xl border-2 border-input bg-card px-4 py-4 text-lg outline-none focus:border-primary"
            />
            {mic.supported && (
              <button
                onClick={mic.listening ? mic.stop : mic.start}
                aria-label={mic.listening ? "Parar de ouvir" : "Falar com a ZELFA"}
                className={`rounded-full p-4 ${mic.listening ? "animate-pulse bg-live text-live-foreground" : "bg-gold text-gold-foreground"}`}
              >
                {mic.listening ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
              </button>
            )}
            {busy ? (
              <button onClick={() => stop()} aria-label="Parar" className="rounded-full bg-muted p-4">
                <Square className="h-7 w-7" />
              </button>
            ) : (
              <button onClick={submit} aria-label="Enviar" className="rounded-full bg-primary p-4 text-primary-foreground">
                <Send className="h-7 w-7" />
              </button>
            )}
          </div>
          {mic.listening && <p className="mt-2 text-center font-bold text-live">Estou ouvindo, pode falar... 🎤</p>}
        </div>
      </div>
    </AppShell>
  );
}

function MessageBubble({ m, restrictions }: { m: UIMessage; restrictions: string[] }) {
  const isUser = m.role === "user";
  const guard = (t: string) => (isUser ? t : guardRecipes(t, restrictions).markdown);
  const text = guard(textOf(m));
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "items-start"}`}>
      {!isUser && <img src={avatar} alt="" width={816} height={816} className="h-10 w-10 shrink-0" />}
      <div className={isUser ? "max-w-[85%] rounded-3xl rounded-br-md bg-primary px-5 py-3 text-lg text-primary-foreground" : "max-w-[90%] text-lg"}>
        {m.parts.map((p, i) => {
          if (p.type === "text") {
            const prose = "prose prose-lg max-w-none text-inherit [&_*]:text-inherit";
            if (isUser) return <div key={i} className={prose}><ReactMarkdown>{p.text}</ReactMarkdown></div>;
            return (
              <div key={i}>
                {splitRecipes(guard(p.text)).map((piece, j) =>
                  piece.kind === "text" ? <div key={j} className={prose}><ReactMarkdown>{piece.markdown}</ReactMarkdown></div> : <RecipeCardView key={j} recipe={piece.recipe} />,
                )}
              </div>
            );
          }
          if (p.type === "file" && p.mediaType.startsWith("image/"))
            return <img key={i} src={p.url} alt="Foto enviada" className="my-2 max-h-64 rounded-2xl" />;
          if (isToolUIPart(p)) {
            const name = p.type.replace("tool-", "");
            const done = p.state === "output-available";
            const output = done ? p.output : undefined;
            const success = output !== null && typeof output === "object" && "ok" in output && output.ok === true;
            const label = name === "criar_compromisso" ? "Anotei na agenda" : name === "adicionar_compras" ? "Coloquei na lista de compras" : name === "planejar_casa" ? "Organizei as tarefas da casa" : "Atualizei seu planejamento";
            return (
              <div key={i} className="my-2 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-base font-semibold text-secondary-foreground">
                {name === "adicionar_compras" ? "🛒" : "📌"}
                {done ? success ? label : "Não consegui anotar este ajuste" : "Anotando..."}
              </div>
            );
          }
          return null;
        })}
        {!isUser && isCelebration(text) && <ShareDish />}
        {!isUser && text && !splitRecipes(text).some((x) => x.kind === "recipe") && (
          <button onClick={() => speak(essentialSpeech(text))} className="mt-1 flex items-center gap-1 text-sm font-semibold text-muted-foreground">
            <Volume2 className="h-4 w-4" /> Ouvir o preparo com a Quel
          </button>
        )}
      </div>
    </div>
  );
}
