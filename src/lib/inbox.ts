/** Recados recebidos no zelfaapp@gmail.com (somente leitura). */
export type InboxMessage = { id: string; from: string; subject: string; date: string; snippet: string; unread: boolean };

/** Lê a resposta multipart do lote do Gmail e devolve os JSONs (lança erro em partes com falha). */
export function parseBatch(contentType: string, body: string): unknown[] {
  const m = /boundary="?([^";]+)"?/i.exec(contentType);
  if (!/multipart\/mixed/i.test(contentType) || !m) throw new Error("Resposta inesperada do Gmail");
  const out: unknown[] = [];
  const errors: string[] = [];
  for (const part of body.split(`--${m[1]}`)) {
    const code = /HTTP\/1\.1 (\d{3})/.exec(part)?.[1];
    if (!code) continue;
    const json = part.slice(part.indexOf("{"), part.lastIndexOf("}") + 1);
    if (code.startsWith("2")) out.push(JSON.parse(json));
    else errors.push(code);
  }
  if (errors.length) console.error("inbox batch part errors", errors);
  return out;
}

type Raw = { id: string; snippet?: string; labelIds?: string[]; payload?: { headers?: { name: string; value: string }[] } };
export function toInboxMessage(r: Raw): InboxMessage {
  const h = (n: string) => r.payload?.headers?.find((x) => x.name.toLowerCase() === n.toLowerCase())?.value ?? "";
  return { id: r.id, from: h("From"), subject: h("Subject") || "(sem assunto)", date: h("Date"), snippet: r.snippet ?? "", unread: !!r.labelIds?.includes("UNREAD") };
}
