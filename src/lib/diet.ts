/** Regras rígidas de restrições alimentares da ZELFA (compartilhadas por app, IA e testes). */

export const RESTRICTIONS = [
  { key: "vegano", label: "Vegano", emoji: "🌱" },
  { key: "gluten", label: "Sem glúten", emoji: "🥖" },
  { key: "lactose", label: "Sem lactose", emoji: "🥛" },
  { key: "amendoim", label: "Amendoim", emoji: "🥜" },
  { key: "frutos_mar", label: "Frutos do mar", emoji: "🦐" },
  { key: "ovo", label: "Ovo", emoji: "🥚" },
  { key: "soja", label: "Soja", emoji: "🫘" },
] as const;
export type RestrictionKey = (typeof RESTRICTIONS)[number]["key"] | "vegetariano" | "pescetariano";

/** Preferência alimentar do perfil (pergunta da primeira entrada). */
export const PREFERENCES = [
  { key: "tudo", emoji: "🍗", label: "Como de tudo" },
  { key: "vegetariano", emoji: "🥗", label: "Sou vegetariano(a)" },
  { key: "vegano", emoji: "🌱", label: "Sou vegano(a)" },
  { key: "pescetariano", emoji: "🐟", label: "Como peixe, mas não como carne" },
  { key: "escrever", emoji: "✏️", label: "Prefiro escrever minhas restrições" },
] as const;
export type PreferenceKey = (typeof PREFERENCES)[number]["key"];
export const PREFERENCE_QUESTION = "Antes de começarmos, me conta: você tem alguma preferência alimentar? 💛";

/** Filtro rápido da conversa (não muda o perfil). */
export const QUICK_FILTERS = [
  { key: "vegetariano", label: "🥗 Vegetarianas" },
  { key: "vegano", label: "🌱 Veganas" },
  { key: "todas", label: "🍗 Todas" },
] as const;

const LABEL: Record<string, string> = { vegetariano: "Vegetariano", pescetariano: "Pescetariano" };
const labelOf = (k: string) => RESTRICTIONS.find((x) => x.key === k)?.label ?? LABEL[k] ?? k;

/** Junta restrições marcadas + preferência do perfil + filtro rápido em uma lista única de chaves. */
export function effectiveRestrictions(restrictions: string[], preference?: string | null, filter?: string | null) {
  const out = new Set(restrictions);
  for (const k of [preference, filter]) if (k === "vegetariano" || k === "vegano" || k === "pescetariano") out.add(k);
  if (out.has("vegano")) { out.delete("vegetariano"); out.delete("pescetariano"); }
  if (out.has("vegetariano")) out.delete("pescetariano");
  return [...out];
}

/** Selo de tipo de cada receita, pelo que ela leva. */
export function recipeTypeBadge(ingredients: string[]) {
  if (!ingredients.length) return null;
  if (isAllowed(ingredients, ["vegano"])) return "🌱 Vegana";
  if (isAllowed(ingredients, ["vegetariano"])) return "🥗 Vegetariana";
  if (isAllowed(ingredients, ["pescetariano"])) return "🐟 Pescetariana";
  return "🍗 Tradicional";
}

const ANIMAL = ["carne", "frango", "peixe", "atum", "sardinha", "bacalhau", "camarão", "camarao", "lula", "polvo", "marisco", "mexilhão", "ovo", "ovos", "gema", "clara", "leite", "queijo", "manteiga", "iogurte", "creme de leite", "requeijão", "requeijao", "nata", "mel", "gelatina", "colágeno", "colageno", "bacon", "presunto", "linguiça", "linguica", "salsicha", "banha", "carne moída", "patinho", "porco", "peru", "leite condensado", "whey", "ghee"];

const MEAT = ["carne", "frango", "galinha", "peito de frango", "coxa", "sobrecoxa", "bacon", "presunto", "linguiça", "linguica", "salsicha", "banha", "carne moída", "patinho", "alcatra", "picanha", "costela", "maminha", "acém", "acem", "músculo", "musculo", "fígado", "figado", "porco", "lombo", "pernil", "peru", "calabresa", "salame", "mortadela", "charque", "carne seca", "estrogonofe de carne", "gelatina", "colágeno", "colageno", "caldo de carne", "caldo de galinha"];
const SEA = ["peixe", "atum", "sardinha", "bacalhau", "salmão", "salmao", "tilápia", "tilapia", "merluza", "camarão", "camarao", "lula", "polvo", "marisco", "mexilhão", "ostra", "lagosta", "siri", "caranguejo", "caldo de peixe"];

export const FORBIDDEN: Record<RestrictionKey, string[]> = {
  vegano: [...new Set([...ANIMAL, ...MEAT, ...SEA])],
  vegetariano: [...MEAT, ...SEA],
  pescetariano: MEAT,
  gluten: ["trigo", "farinha de trigo", "centeio", "cevada", "malte", "aveia", "semolina", "cuscuz marroquino", "pão", "macarrão", "biscoito", "farinha de rosca"],
  lactose: ["leite", "queijo", "manteiga", "iogurte", "creme de leite", "requeijão", "requeijao", "nata", "leite condensado", "whey", "ricota"],
  amendoim: ["amendoim", "paçoca", "pacoca", "pasta de amendoim"],
  frutos_mar: ["camarão", "camarao", "lula", "polvo", "marisco", "mexilhão", "ostra", "lagosta", "siri", "caranguejo"],
  ovo: ["ovo", "ovos", "gema", "clara", "maionese"],
  soja: ["soja", "tofu", "shoyu", "molho de soja", "missô", "misso", "edamame"],
};

/** Exceções vegetais que contêm palavras proibidas (ex.: "leite de coco"). */
const SAFE = ["leite de coco", "leite vegetal", "leite de aveia", "leite de amêndoas", "leite de soja", "leite de arroz", "queijo vegano", "manteiga vegana", "manteiga de cacau", "carne de soja", "carne de jaca", "manteiga de amendoim", "iogurte vegetal", "pão sem glúten", "pão de queijo", "macarrão sem glúten", "aveia sem glúten", "biscoito sem glúten", "maionese vegana", "creme de leite de coco"];

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Retorna os ingredientes que conflitam com as restrições (vazio = receita liberada). */
export function conflicts(ingredients: string[], restrictions: string[]) {
  const out: { ingredient: string; restriction: RestrictionKey }[] = [];
  for (const ing of ingredients) {
    let n = ` ${norm(ing)} `;
    for (const s of SAFE) n = n.replaceAll(norm(s), " ");
    for (const r of restrictions as RestrictionKey[]) {
      const list = FORBIDDEN[r];
      if (!list) continue;
      if (list.some((w) => new RegExp(`(^|[^a-z])${norm(w)}([^a-z]|$)`).test(n))) out.push({ ingredient: ing, restriction: r });
    }
  }
  return out;
}

export const isAllowed = (ingredients: string[], restrictions: string[]) => conflicts(ingredients, restrictions).length === 0;

export const SUBSTITUTIONS: Record<string, string> = {
  leite: "leite vegetal (coco, aveia sem glúten, amêndoas)",
  ovo: "1 colher de linhaça ou chia + 3 colheres de água",
  mel: "açúcar de coco ou xarope de agave",
  manteiga: "óleo de coco ou manteiga vegana",
  queijo: "queijo vegano ou pasta de castanha",
  "farinha de trigo": "mix de farinha de arroz, fécula de batata e polvilho",
  gelatina: "ágar-ágar",
};

export const CONFLICT_WARNING = "Atenção: esse ingrediente não é vegano. Vou sugerir uma alternativa 🌱";

export function restrictionWarning(ingredient: string, restriction: RestrictionKey) {
  if (restriction === "vegano") return CONFLICT_WARNING;
  return `Atenção: essa receita tem ${ingredient}, que você marcou como restrição.`;
}

export const BADGES: Record<RestrictionKey, string> = {
  vegano: "✅ Vegano", vegetariano: "✅ Vegetariano", pescetariano: "✅ Pescetariano", gluten: "✅ Sem glúten", lactose: "✅ Sem lactose", amendoim: "✅ Sem amendoim",
  frutos_mar: "✅ Sem frutos do mar", ovo: "✅ Sem ovo", soja: "✅ Sem soja",
};

const STOP_INGREDIENTS = /(modo de preparo|preparo|substitui|dica|rendimento|tempo|como fazer|lista de compras)/i;

/**
 * Camada 2 (exibição): confere cada receita ("### Nome" + lista "Ingredientes") antes de mostrar.
 * Receitas com ingrediente restrito são bloqueadas; as aprovadas ganham o selo de conformidade.
 */
export function guardRecipes(markdown: string, restrictions: string[]) {
  const valid = restrictions.filter((r) => r in FORBIDDEN) as RestrictionKey[];
  if (!valid.length) return { markdown, blocked: 0 };
  const parts = markdown.split(/^(?=#{2,4}\s)/m);
  let blocked = 0;
  const out = parts.map((sec) => {
    const lines = sec.split("\n");
    const start = lines.findIndex((l) => /ingredientes/i.test(l) && !/^[-*•]/.test(l.trim()));
    if (!/^#{2,4}\s/.test(sec) || start < 0) return sec;
    const ings: string[] = [];
    for (const l of lines.slice(start + 1)) {
      const t = l.trim();
      if (!t) continue;
      if (/^#{1,6}\s/.test(t) || (!/^([-*•]|\d+[.)])/.test(t) && STOP_INGREDIENTS.test(t))) break;
      if (/^([-*•]|\d+[.)])/.test(t)) ings.push(t.replace(/^([-*•]|\d+[.)])\s*/, ""));
    }
    const bad = conflicts([(lines[0] ?? "").replace(/^#+\s*/, ""), ...ings], valid);
    if (bad.length) {
      blocked++;
      return `> 🚫 Receita bloqueada pela ZELFA: tinha **${[...new Set(bad.map((b) => b.ingredient))].join(", ")}**, que não combina com suas restrições.\n\n`;
    }
    return `${lines[0]}\n\n**${valid.map((r) => BADGES[r]).join(" · ")}**\n${lines.slice(1).join("\n")}`;
  });
  // Também bloqueia sugestões curtas em lista ("1. **Picadinho de carne**", "**Escondidinho**").
  const title = /^(\d+[.)]\s+)?\*\*/;
  const result: string[] = [];
  let skipping = false;
  for (const line of out.join("").split("\n")) {
    const t = line.trim();
    const isTitle = (title.test(t) && t.length < 120) || /^#{2,4}\s/.test(t);
    if (isTitle) {
      const name = t.replace(/^(\d+[.)]\s+|[-*•]\s+)/, "").replace(/\*\*/g, "").split(/[:—–-]\s/)[0] ?? "";
      if (!/✅/.test(t) && conflicts([name], valid).length) {
        blocked++;
        skipping = true;
        result.push(`> 🚫 Sugestão bloqueada pela ZELFA: "${name.trim()}" não combina com suas restrições.`);
        continue;
      }
      skipping = false;
    }
    if (!skipping) result.push(line);
  }
  return { markdown: result.join("\n"), blocked };
}

/** Instruções para a IA: filtro rígido. */
export function dietPrompt(restrictions: string[], notes?: string | null) {
  const valid = restrictions.filter((r) => r in FORBIDDEN) as RestrictionKey[];
  const current = "As restrições cadastradas AGORA valem acima do histórico: ignore restrições ou pedidos de dieta de mensagens antigas, a menos que a pessoa usuária repita na mensagem atual.";
  const written = notes?.trim() ? `\nRESTRIÇÕES ESCRITAS PELA PESSOA (respeite integralmente, ex.: sem glúten → farinhas alternativas): "${notes.trim().slice(0, 500)}".` : "";
  if (!valid.length) return `Restrições alimentares cadastradas: nenhuma. ${current} Pode sugerir carnes, leite, ovos e glúten normalmente.${written}`;
  const lines = valid.map((r) => `- ${labelOf(r)}: PROIBIDO ${FORBIDDEN[r].join(", ")}.`);
  const names = valid.map(labelOf).join(", ");
  return `PRIORIDADE MÁXIMA — FILTRO RÍGIDO DE RESTRIÇÕES (vale acima de qualquer outra regra, em texto ou voz).
A usuária cadastrou: ${names}. Isso já está carregado; aplique ANTES de pensar em qualquer receita. ${current}
${lines.join("\n")}
- Nunca sugira prato com ingrediente proibido, nem como principal nem como opcional, acompanhamento ou "se quiser".
- Se ela tiver em casa um ingrediente proibido, comece avisando com carinho, por exemplo: "Atenção: você marcou ${names}, e a carne moída não combina com isso. Mas posso sugerir pratos deliciosos com o que você tem! 🌱". Depois sugira receitas SÓ com os ingredientes permitidos.
- FORMATO OBRIGATÓRIO de cada receita: título "### Nome da receita", depois a linha "Ingredientes:" com um ingrediente por item "- ", depois "Modo de preparo:". Não coloque ingrediente proibido nessa lista, nem como opção.
- Antes de mostrar qualquer receita, confira cada ingrediente contra a lista acima. Se houver conflito, NÃO mostre a receita; troque por outra.
- Se a pessoa usuária disser que tem em casa um ingrediente proibido, avise com carinho: "${valid.includes("vegano") ? CONFLICT_WARNING : "Atenção: esse ingrediente está nas suas restrições. Vou sugerir uma alternativa"}" e sugira a substituição.
- Para cada receita, inclua uma seção "Substituições" (ex.: ${Object.entries(SUBSTITUTIONS).slice(0, 3).map(([a, b]) => `${a} → ${b}`).join("; ")}).
- Aveia só se for certificada sem glúten.${valid.includes("vegetariano") ? "\n- Vegetariano: proteínas vegetais (grão-de-bico, lentilha, tofu, cogumelos, ovos, queijos)." : ""}${valid.includes("vegano") ? "\n- Vegano: troque ovos, leite e manteiga por alternativas vegetais." : ""}${valid.includes("pescetariano") ? "\n- Pescetariano: peixes e frutos do mar liberados; carnes nunca." : ""}
- NUNCA recuse: se pedirem um prato fora da preferência (ex.: estrogonofe de carne), entregue a versão adaptada e avise com carinho, por exemplo: "Como você é vegetariano(a), preparei uma versão deliciosa com cogumelos! 🍄". Use linguagem neutra.${written}`;
}

export type Category = { key: string; emoji: string; title: string; desc: string; tile: string; starter?: string; categoria?: string; to?: "/restricoes" | "/agenda" };

export const CATEGORIES: Category[] = [
  { key: "restricoes", emoji: "⚠️", title: "Restrições e alergias", desc: "O que a família não pode comer", tile: "bg-tile-2", to: "/restricoes" },
  { key: "dia_a_dia", emoji: "🍳", title: "Dia a dia", desc: "Pratos salgados do cotidiano", tile: "bg-tile-1", categoria: "dia_a_dia", starter: "Quero receitas salgadas para o dia a dia." },
  { key: "visitas", emoji: "🎉", title: "Visitas", desc: "Do simples ao sofisticado", tile: "bg-tile-3", categoria: "visitas", starter: "Vou receber visitas! Sugira receitas do simples ao sofisticado, com acompanhamentos." },
  { key: "sobremesas", emoji: "🍰", title: "Sobremesas", desc: "Doces por tempo e dificuldade", tile: "bg-tile-4", categoria: "doces", starter: "Quero sobremesas! Sugira opções separadas por tempo de preparo e dificuldade." },
  { key: "sem_gluten", emoji: "🥖", title: "Sem glúten", desc: "Pães e bolos sem glúten", tile: "bg-tile-5", categoria: "sem_gluten", starter: "Quero receitas SEM GLÚTEN, com destaque para pães sem glúten. Nada de trigo, centeio, cevada, malte ou aveia comum." },
  { key: "saudavel", emoji: "🥗", title: "Alimentação saudável", desc: "Leve, fit e equilibrada", tile: "bg-tile-1", categoria: "saudavel", starter: "Quero receitas leves, fit e equilibradas." },
  { key: "vegano", emoji: "🌱", title: "Vegano", desc: "100% de origem vegetal", tile: "bg-tile-4", categoria: "vegano", starter: "Quero receitas 100% VEGANAS: sem carne, peixe, frutos do mar, ovo, leite, queijo, manteiga, iogurte, mel, gelatina ou qualquer derivado animal. Inclua substituições." },
  { key: "vegetariano", emoji: "🥗", title: "Vegetariano", desc: "Sem carne, frango ou peixe", tile: "bg-tile-5", starter: "Quero receitas VEGETARIANAS: sem carne, frango, peixe ou frutos do mar. Use proteínas vegetais como grão-de-bico, lentilha, tofu, cogumelos, ovos e queijos." },
  { key: "compras", emoji: "🛒", title: "Lista de compras", desc: "Com estimativa de custo", tile: "bg-tile-2", to: "/agenda" },
  { key: "cardapio", emoji: "📅", title: "Cardápio da semana / do dia", desc: "Café, almoço e jantar", tile: "bg-tile-3", starter: "Monte o cardápio de hoje e o cardápio da semana (7 dias, café, almoço e jantar)." },
];

export function restrictionNames(restrictions: string[]) {
  const names = restrictions.filter((r) => r in FORBIDDEN).map(labelOf);
  return names.length ? names.join(", ") : "nenhuma (pode usar carne, leite, ovos e glúten)";
}
