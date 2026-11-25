// Cronômetro inteligente das receitas: regras puras + memória no aparelho.
import { useSyncExternalStore } from "react";

const UNIT = /(\d+(?:[.,]\d+)?|meia|uma|um|dois|duas|três|tres)\s*(horas?|h\b|minutos?|min\b|segundos?|seg\b|s\b)/gi;
const WORD: Record<string, number> = { meia: 0.5, uma: 1, um: 1, dois: 2, duas: 2, "três": 3, tres: 3 };

/** Segundos de uma etapa ("assar por 30 minutos", "1 hora e 15 minutos"); 0 se não tiver tempo. Em faixas ("20 a 25 min") usa o primeiro número. */
export function stepSeconds(text: string): number {
  const t = text.toLowerCase().replace(/(\d+)\s*(?:a|-|ou)\s*\d+\s*(?=horas?|h\b|minutos?|min\b)/g, "$1 ");
  const meiaHora = /meia hora/.test(t) ? 1800 : 0;
  let total = 0;
  for (const m of t.replace(/meia hora/g, "").matchAll(UNIT)) {
    const raw = m[1] ?? "0";
    const n = WORD[raw] ?? Number(raw.replace(",", "."));
    const u = (m[2] ?? "s")[0];
    total += n * (u === "h" ? 3600 : u === "m" ? 60 : 1);
  }
  return Math.round(total + meiaHora);
}

export type AlertKind = "metade" | "quase" | "fim" | "pergunta";
export const FOLLOW_UP_SECONDS = 600;

/** Segundos decorridos em que cada aviso dispara. */
export function alertPlan(total: number): { kind: AlertKind; at: number }[] {
  const plan: { kind: AlertKind; at: number }[] = [{ kind: "metade", at: Math.floor(total / 2) }];
  const before = total > 600 ? 300 : 60;
  if (total - before > total / 2) plan.push({ kind: "quase", at: total - before });
  plan.push({ kind: "fim", at: total }, { kind: "pergunta", at: total + FOLLOW_UP_SECONDS });
  return plan;
}

export function alertText(kind: AlertKind, recipe: string): string {
  switch (kind) {
    case "metade": return "Metade do caminho! Tudo correndo bem 💛";
    case "quase": return "Faltam poucos minutos! Prepare o prato para servir 🍳";
    case "fim": return `⏰ Tempo concluído! Sua ${recipe} está pronta 💛`;
    case "pergunta": return `Como ficou sua ${recipe}? Já provou? 😊`;
  }
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const mm = String(m).padStart(2, "0"), ss = String(r).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// ---------- memória no aparelho ----------
export type Timer = { id: string; recipe: string; step: string; total: number; endsAt: number; pausedLeft: number | null; fired: AlertKind[]; done: boolean; early?: boolean };
const KEY = "zelfa-timers";
let timers: Timer[] = [];
let loaded = false;
const subs = new Set<() => void>();
let msgListeners = new Set<(t: Timer, kind: AlertKind) => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { timers = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { timers = []; }
}
function commit(next: Timer[]) {
  timers = next;
  localStorage.setItem(KEY, JSON.stringify(timers));
  subs.forEach((f) => f());
}
export function leftOf(t: Timer, now = Date.now()) { return t.pausedLeft ?? (t.endsAt - now) / 1000; }

export function startTimer(recipe: string, step: string, total: number) {
  load();
  if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
  primeAudio();
  commit([...timers, { id: crypto.randomUUID(), recipe, step, total, endsAt: Date.now() + total * 1000, pausedLeft: null, fired: [], done: false }]);
  ensureLoop();
}
export function togglePause(id: string) {
  commit(timers.map((t) => t.id !== id ? t : t.pausedLeft == null ? { ...t, pausedLeft: leftOf(t) } : { ...t, endsAt: Date.now() + t.pausedLeft * 1000, pausedLeft: null }));
}
export function cancelTimer(id: string) { commit(timers.filter((t) => t.id !== id)); }
export const finishTimer = cancelTimer;

/** Regra pura: muda total e tempo restante sem recomeçar; avisos ainda à frente voltam a valer. */
export function retime(t: Timer, total: number, left: number, now = Date.now()): Timer {
  const elapsed = Math.max(0, total - left);
  const plan = alertPlan(total);
  const fired = t.fired.filter((k) => (plan.find((p) => p.kind === k)?.at ?? 0) <= elapsed);
  return { ...t, total, done: false, early: false, fired, endsAt: now + left * 1000, pausedLeft: t.pausedLeft != null ? left : null };
}
function update(id: string, f: (t: Timer) => Timer) { commit(timers.map((t) => (t.id === id ? f(t) : t))); }
export function addMinutes(id: string, min: number) { update(id, (t) => retime(t, t.total + min * 60, Math.max(0, leftOf(t)) + min * 60)); }
export function setLeftMinutes(id: string, min: number) { update(id, (t) => { const left = min * 60; const elapsed = t.total - Math.max(0, leftOf(t)); return retime(t, elapsed + left, left); }); }
export function setTotalMinutes(id: string, min: number) { update(id, (t) => { const total = min * 60; const elapsed = t.total - Math.max(0, leftOf(t)); return retime(t, total, Math.max(0, total - elapsed)); }); }
/** Encerrar antes do fim: marca todos os avisos como já dados, então nada mais toca nem fala. */
export function completeNow(id: string) { update(id, (t) => ({ ...t, done: true, early: true, pausedLeft: 0, fired: ["metade", "quase", "fim", "pergunta"] })); }

export function useTimers(): Timer[] {
  return useSyncExternalStore((f) => { load(); subs.add(f); ensureLoop(); return () => subs.delete(f); }, () => (load(), timers), () => EMPTY);
}
const EMPTY: Timer[] = [];
export function onTimerAlert(f: (t: Timer, kind: AlertKind) => void) { msgListeners.add(f); return () => { msgListeners.delete(f); }; }

// ---------- relógio e avisos ----------
let loop: ReturnType<typeof setInterval> | null = null;
function ensureLoop() {
  if (loop || typeof window === "undefined") return;
  loop = setInterval(tick, 1000);
}
let lastTick = 0;
function tick() {
  const now = Date.now();
  if (!timers.length) { if (now - lastTick > 1000) subs.forEach((f) => f()); return; }
  lastTick = now;
  let changed = false;
  const next = timers.map((t) => {
    if (t.pausedLeft != null) return t;
    const elapsed = t.total - leftOf(t, now);
    const due = alertPlan(t.total).filter((a) => elapsed >= a.at && !t.fired.includes(a.kind));
    if (!due.length) return t;
    changed = true;
    // Só o aviso mais recente toca, para não acumular sons.
    fire(t, due[due.length - 1]!.kind);
    return { ...t, fired: [...t.fired, ...due.map((d) => d.kind)], done: t.done || due.some((d) => d.kind === "fim") };
  });
  if (changed) commit(next); else subs.forEach((f) => f());
}

function fire(t: Timer, kind: AlertKind) {
  const text = alertText(kind, t.recipe);
  bell(kind === "fim");
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try { new Notification("ZELFA 🍳", { body: text, tag: `${t.id}-${kind}`, icon: "/favicon.ico" }); } catch { /* celular sem suporte direto */ }
  }
  msgListeners.forEach((f) => f(t, kind));
}

let ctx: AudioContext | null = null;
function primeAudio() {
  try { ctx ??= new AudioContext(); void ctx.resume(); } catch { /* sem áudio */ }
}
/** Sino suave sintetizado (sem arquivo de áudio). */
function bell(strong: boolean) {
  try {
    ctx ??= new AudioContext();
    const notes = strong ? [880, 1320, 880] : [660];
    notes.forEach((f, i) => {
      const o = ctx!.createOscillator(), g = ctx!.createGain();
      const start = ctx!.currentTime + i * 0.45;
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 1.4);
      o.connect(g).connect(ctx!.destination); o.start(start); o.stop(start + 1.5);
    });
  } catch { /* sem áudio */ }
}
