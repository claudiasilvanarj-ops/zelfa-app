import { supabase } from "@/integrations/supabase/client";

/** One account = one device. A new device must ask to switch (max 2 switches per month). */
const DEVICE_KEY = "zelfa-device-id";
const FRESH_KEY = "zelfa-fresh-login";

export type AccessStatus = "ok" | "other_device" | "unpaid";
export const DAILY_ABUSE_THRESHOLD = 8;
export const MONTHLY_DEVICE_SWITCHES = 2; // mantido por compatibilidade de importação
export const SUPPORT_WHATSAPP = "https://wa.me/5521997079690?text=" + encodeURIComponent("Oi! Preciso de ajuda com meu acesso na ZELFA 💛");

export function deviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

/** Short human label for the admin panel, e.g. "Celular Android · Chrome". */
export function deviceLabel(ua = typeof navigator !== "undefined" ? navigator.userAgent : ""): string {
  const kind = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? (/Mobile/.test(ua) ? "Celular Android" : "Tablet Android")
    : /Windows/.test(ua) ? "Computador Windows" : /Mac OS/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Computador Linux" : "Aparelho";
  const browser = /Edg\//.test(ua) ? "Edge" : /SamsungBrowser/.test(ua) ? "Samsung" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "";
  return browser ? `${kind} · ${browser}` : kind;
}

/** Call right before any sign-in: this device just logged in (shows the switch screen instead of signing out). */
export function markFreshLogin() {
  sessionStorage.setItem(FRESH_KEY, "1");
}
export const isFreshLogin = () => !!sessionStorage.getItem(FRESH_KEY);
export const clearFreshLogin = () => sessionStorage.removeItem(FRESH_KEY);

export async function checkAccess(): Promise<AccessStatus> {
  const device = deviceId();
  await supabase.rpc("claim_device_first", { _device: device, _label: deviceLabel() });
  const { data, error } = await supabase.rpc("access_status", { _device: device });
  if (error) throw error;
  const s = (data as AccessStatus) ?? "unpaid";
  if (s !== "other_device") clearFreshLogin();
  return s;
}

export async function switchDevice(): Promise<"ok" | "cooldown" | "limit"> {
  const { data, error } = await supabase.rpc("switch_device", { _device: deviceId(), _label: deviceLabel() });
  if (error) throw error;
  if (data === "ok") clearFreshLogin();
  if (data === "cooldown") return "cooldown";
  return data === "ok" ? "ok" : "limit";
}
