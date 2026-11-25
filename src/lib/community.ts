/** Canal de comunidade da ZELFA no Instagram (regras compartilhadas por telas e testes). */
export const INSTAGRAM_HANDLE = "@universozelfa";
export const INSTAGRAM_PROFILE = "https://www.instagram.com/universozelfa/";
export const DIRECT_LINK = "https://ig.me/m/universozelfa";
export const HASHTAG = "#ZelfaChef";
export const SHARE_INVITE = "Prontinho! Que tal mostrar seu prato para a gente? 💛";
export const SHARE_TIP = "Tire uma foto do seu prato pronto e envie para a gente! Vamos repostar os melhores nos stories 💛";
export const CAPTION = "Fiz esse prato com a ZELFA, minha chef de cozinha virtual! 🍳💛 #ZelfaChef @universozelfa";
export const BADGE = "⭐ Chef da Comunidade";
const BADGE_KEY = "zelfa-chef-comunidade";

/** Resposta de celebração ao fim da receita, onde aparece o convite. */
export function isCelebration(text: string) {
  return /prontinho!|prontinho, querida|você é demais|voce e demais/i.test(text);
}

export function hasBadge() {
  try { return localStorage.getItem(BADGE_KEY) === "1"; } catch { return false; }
}
/** Quem abre o Direct para enviar a foto ganha o selo. */
export function grantBadge() {
  try { localStorage.setItem(BADGE_KEY, "1"); window.dispatchEvent(new Event("zelfa-badge")); } catch { /* sem armazenamento */ }
}
