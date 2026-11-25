export const MARKET_SECTORS = ["Hortifruti", "Açougue", "Mercearia", "Padaria", "Laticínios", "Outros"] as const;
export type ShoppingEntry = { name: string; quantity?: string | null; sector?: string; estimated_price?: number | null; checked?: boolean };
export const brl = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function groupShopping<T extends ShoppingEntry>(items: T[]) {
  return MARKET_SECTORS.map((sector) => ({ sector, items: items.filter((i) => (MARKET_SECTORS.includes(i.sector as typeof MARKET_SECTORS[number]) ? i.sector : "Mercearia") === sector) })).filter((group) => group.items.length);
}

export function shoppingEstimate(items: ShoppingEntry[]) {
  const pending = items.filter((i) => !i.checked);
  return { total: pending.reduce((sum, i) => sum + (i.estimated_price ?? 0), 0), missing: pending.filter((i) => i.estimated_price == null).length };
}

export function marketListText(items: ShoppingEntry[]) {
  const pending = items.filter((i) => !i.checked);
  if (!pending.length) return "Lista de compras: nenhum item pendente.";
  return `Lista de compras (preços aproximados, não cotações):\n${groupShopping(pending).map((g) => `${g.sector}: ${g.items.map((i) => `${i.name}${i.quantity ? ` (${i.quantity})` : ""}${i.estimated_price != null ? ` — cerca de ${brl(i.estimated_price)}` : ""}`).join(", ")}`).join("\n")}`;
}

export function marketNotes(notes: string | null, items: ShoppingEntry[]) {
  return [notes, marketListText(items)].filter(Boolean).join("\n\n");
}

export const SMART_SHOPPING_PROMPT = `COMPRAS INTELIGENTES: para o prato escolhido, liste TODOS os ingredientes com quantidades, inclusive água, temperos e cobertura quando usados. Marque cada um com "Já tem", "Falta" ou "A confirmar". Não trate item na lista de compras como algo disponível em casa. Pergunte se a quantidade disponível basta; nunca invente estoque a partir de ingrediente não mencionado.
Organize os faltantes por setor: ${MARKET_SECTORS.join(", ")}. Estime em reais o preço TOTAL da quantidade de cada item faltante e o total das compras. São estimativas, não preços atuais: avise que variam por cidade, loja, embalagem e data. Use null quando não conseguir estimar; nunca prometa promoções reais ou preços consultados sem fonte.
Dê dicas de economia pertinentes: comparar preço por kg/litro, marca própria, conferir promoções disponíveis na loja, produtos da estação e substituições econômicas compatíveis com a receita e restrições.
Ao usar adicionar_compras, envie só faltantes confirmados, com quantidade, setor e preco_estimado (valor total em reais para a quantidade informada). Não duplique itens já anotados; não inclua os que já tem ou os que ainda precisam de confirmação.
Ofereça agendar a ida ao mercado com criar_compromisso, categoria Mercado. Pergunte data/hora se faltarem. A lista de compras será anexada automaticamente ao compromisso. Só confirme gravações após ok: true.`;