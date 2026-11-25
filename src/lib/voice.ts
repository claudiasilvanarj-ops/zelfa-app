import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DEFAULT_SETTINGS, SPEEDS, type VoiceSettings } from "./voice-rules";

const SETTINGS_KEY = "zelfa-voice";
export function getVoiceSettings(): VoiceSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") }; } catch { return DEFAULT_SETTINGS; }
}
export function setVoiceSettings(s: VoiceSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  if (!s.enabled) stopSpeaking();
}

/** Strip markdown/emoji so speech sounds natural. */
function clean(text: string) {
  return text
    .replace(/[*_#>`~]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .trim();
}

// ---- Voz oficial da Quel (Kore), com cache para economizar ----
const cache = new Map<string, string>();
let current: HTMLAudioElement | null = null;
let token = 0;

function pcmToWav(pcm: Uint8Array, rate = 24000) {
  const h = new DataView(new ArrayBuffer(44));
  const w = (o: number, s: string) => [...s].forEach((c, i) => h.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); h.setUint32(4, 36 + pcm.length, true); w(8, "WAVE"); w(12, "fmt ");
  h.setUint32(16, 16, true); h.setUint16(20, 1, true); h.setUint16(22, 1, true);
  h.setUint32(24, rate, true); h.setUint32(28, rate * 2, true); h.setUint16(32, 2, true);
  h.setUint16(34, 16, true); w(36, "data"); h.setUint32(40, pcm.length, true);
  return new Blob([h.buffer, pcm as BlobPart], { type: "audio/wav" });
}

async function quelUrl(text: string): Promise<string | null> {
  const hit = cache.get(text);
  if (hit) return hit;
  const { quelSpeech } = await import("./quel-voice.functions");
  const r = await quelSpeech({ data: { text } });
  if (!r.audio) throw new Error(r.error || "A voz da Quel está indisponível agora. O texto continua disponível.");
  const bin = Uint8Array.from(atob(r.audio), (c) => c.charCodeAt(0));
  const ct = r.contentType.toLowerCase();
  const isWrapped = /wav|mpeg|mp3|ogg|webm|flac/.test(ct);
  const rate = Number(/rate=(\d+)/.exec(ct)?.[1] ?? 24000);
  const url = URL.createObjectURL(isWrapped ? new Blob([bin], { type: ct }) : pcmToWav(bin, rate));
  cache.set(text, url);
  return url;
}

export function speak(text: string, opts: { rate?: number; pitch?: number; onEnd?: () => void; onStart?: () => void } = {}) {
  if (typeof window === "undefined") return;
  stopSpeaking();
  const settings = getVoiceSettings();
  if (!settings.enabled) return;
  opts = { ...opts, rate: (opts.rate ?? 1) * SPEEDS[settings.speed] };
  const my = ++token;
  const t = clean(text);
  if (!t) return;
  const failed = (message: string) => {
    if (my !== token) return;
    current = null;
    toast.error(message, { id: "zelfa-voice-error" });
    opts.onEnd?.();
  };
  quelUrl(t)
    .then((url) => {
      if (my !== token) return;
      if (!url) return failed("A voz da Quel está indisponível agora. O texto continua disponível.");
      const a = new Audio(url);
      a.playbackRate = opts.rate ?? 1;
      a.onended = () => { if (my === token) { current = null; opts.onEnd?.(); } };
      a.onerror = () => failed("Não foi possível reproduzir a voz da Quel. Tente ouvir novamente.");
      current = a;
      a.play().then(() => { if (my === token) opts.onStart?.(); }, () => failed("O áudio não pôde começar. Toque em ouvir para tentar novamente."));
    })
    .catch((error: unknown) => failed(error instanceof Error && !/unauthorized/i.test(error.message)
      ? error.message : "A voz da Quel não está disponível. Entre na sua conta e tente novamente."));
}

export function stopSpeaking() {
  token++;
  if (current) { current.pause(); current = null; }
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

export function useSpeechInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<AnyRecognition>(null);
  const cbRef = useRef(onResult);
  cbRef.current = onResult;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    window.speechSynthesis?.getVoices();
  }, []);

  const start = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    stopSpeaking();
    const rec = new SR();
    rec.lang = "pt-BR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: AnyRecognition) => {
      const text = Array.from(e.results as ArrayLike<AnyRecognition>).map((r) => r[0].transcript).join(" ");
      if (text.trim()) cbRef.current(text.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, supported, start, stop };
}

/** Resize an image file to a compact JPEG data URL. */
export async function fileToDataUrl(file: Blob, max = 1280): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a imagem.");
  context.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

// ---- Saudação: uma vez por acesso (recarregar/abrir de novo = novo acesso) ----
let greeted = false;
const UNLOCK_KEY = "zelfa-voice-unlocked";

function greetNow() {
  if (greeted) return;
  speak("Olá! Que bom te ver! 💛 Vamos cozinhar hoje?", {
    onStart: () => {
      if (greeted) return;
      greeted = true;
      localStorage.setItem(UNLOCK_KEY, "1");
      document.documentElement.dataset["zelfaGreetings"] = String(Number(document.documentElement.dataset["zelfaGreetings"] ?? 0) + 1);
    },
  });
}

/** Chame ao abrir a tela inicial. Fala só se ainda não falou neste acesso. */
export function greetOncePerVisit() {
  if (greeted || typeof window === "undefined") return () => {};
  if (localStorage.getItem(UNLOCK_KEY)) greetNow(); // visitas seguintes: tenta tocar direto
  const onFirstTouch = () => greetNow(); // primeira visita ou áudio bloqueado: toca no primeiro toque
  window.addEventListener("pointerdown", onFirstTouch, { once: true });
  window.addEventListener("keydown", onFirstTouch, { once: true });
  return () => {
    window.removeEventListener("pointerdown", onFirstTouch);
    window.removeEventListener("keydown", onFirstTouch);
  };
}

/** Botão 🔊: fala a saudação sob demanda e conta como a saudação deste acesso. */
export function greetOnDemand() {
  greeted = false;
  greetNow();
}
