import { describe, expect, it } from "vitest";
import { WELCOME_SUBJECT, buildWelcomeEmail } from "@/lib/welcome-email";

const decode = (raw: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(raw.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));

/** Decodifica o assunto RFC 2047 (=?UTF-8?B?...?=) para conferir o texto real. */
const decodeSubject = (mail: string) => {
  const m = mail.match(/Subject: =\?UTF-8\?B\?([A-Za-z0-9+/=]+)\?=/);
  return m?.[1] ? new TextDecoder().decode(Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0))) : "";
};

describe("e-mail de boas-vindas", () => {
  it("vai para o e-mail da cliente com assunto de boas-vindas", () => {
    const mail = decode(buildWelcomeEmail("cliente@exemplo.com"));
    expect(mail).toContain("To: cliente@exemplo.com");
    expect(decodeSubject(mail)).toBe(WELCOME_SUBJECT);
    expect(WELCOME_SUBJECT).toContain("ZELFA");
  });

  it("aponta para o app zelfa.app e para o suporte por e-mail", () => {
    const mail = decode(buildWelcomeEmail("cliente@exemplo.com"));
    expect(mail).toContain("https://zelfa.app");
    expect(mail).toContain("zelfaapp@gmail.com");
  });

  it("usa linguagem neutra, sem tratamento de gênero", () => {
    const mail = decode(buildWelcomeEmail("cliente@exemplo.com")).toLowerCase();
    for (const banned of ["querida", "querido", "bem-vinda", "amiga", "juntas"]) {
      expect(mail).not.toContain(banned);
    }
  });

  it("é HTML em base64url válido", () => {
    const raw = buildWelcomeEmail("cliente@exemplo.com");
    expect(raw).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decode(raw)).toContain('Content-Type: text/html; charset="UTF-8"');
  });
});
