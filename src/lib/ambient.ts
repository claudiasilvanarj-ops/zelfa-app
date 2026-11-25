/** Sons gerados no próprio aparelho (sem arquivos externos). */
export type SoundKind = "chuva" | "mar" | "lareira" | "vento";

let ctx: AudioContext | null = null;
function audio() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noiseBuffer(c: AudioContext, brown = false) {
  const len = c.sampleRate * 4;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else d[i] = w;
  }
  return buf;
}

export function playAmbient(kind: SoundKind, volume = 0.5) {
  const c = audio();
  const master = c.createGain();
  master.gain.value = volume;
  master.connect(c.destination);
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, kind !== "chuva");
  src.loop = true;
  const filter = c.createBiquadFilter();
  const stops: Array<() => void> = [];

  if (kind === "chuva") {
    filter.type = "bandpass";
    filter.frequency.value = 1400;
    filter.Q.value = 0.6;
  } else if (kind === "mar" || kind === "vento") {
    filter.type = "lowpass";
    filter.frequency.value = kind === "mar" ? 600 : 900;
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = kind === "mar" ? 0.12 : 0.07;
    lfoGain.gain.value = kind === "mar" ? 400 : 500;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    stops.push(() => lfo.stop());
  } else {
    filter.type = "lowpass";
    filter.frequency.value = 500;
    const id = window.setInterval(() => {
      const t = c.currentTime;
      const o = c.createBufferSource();
      o.buffer = noiseBuffer(c);
      const g = c.createGain();
      const hp = c.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 2500;
      g.gain.setValueAtTime(0.5 * Math.random(), t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      o.connect(hp).connect(g).connect(master);
      o.start(t);
      o.stop(t + 0.06);
    }, 180);
    stops.push(() => clearInterval(id));
  }
  src.connect(filter).connect(master);
  src.start();
  return {
    setVolume: (v: number) => (master.gain.value = v),
    stop: () => {
      stops.forEach((s) => s());
      master.gain.setTargetAtTime(0, c.currentTime, 0.3);
      setTimeout(() => {
        src.stop();
        master.disconnect();
      }, 1200);
    },
  };
}

/** Músicas instrumentais simples geradas no aparelho. */
export type Playlist = { id: string; name: string; desc: string; bpm: number; wave: OscillatorType; chords: number[][] };

const n = (semi: number) => 220 * Math.pow(2, semi / 12);
export const PLAYLISTS: Playlist[] = [
  { id: "calma", name: "Calma", desc: "Acordes lentos para relaxar", bpm: 40, wave: "sine", chords: [[0, 4, 7, 11], [5, 9, 12, 16], [-3, 0, 4, 7], [7, 11, 14, 17]] },
  { id: "relaxante", name: "Relaxante", desc: "Para descansar e ler", bpm: 50, wave: "triangle", chords: [[2, 5, 9, 12], [-2, 2, 5, 9], [0, 3, 7, 10], [-5, -1, 2, 5]] },
  { id: "alegre", name: "Alegre", desc: "Para animar as tarefas da casa", bpm: 108, wave: "triangle", chords: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]] },
  { id: "ninar", name: "Para ninar", desc: "Caixinha de música suave", bpm: 60, wave: "sine", chords: [[12, 16, 19], [17, 21, 24], [12, 16, 19], [19, 23, 26]] },
];

export function playPlaylist(p: Playlist, volume = 0.4) {
  const c = audio();
  const master = c.createGain();
  master.gain.value = volume;
  master.connect(c.destination);
  const beat = 60 / p.bpm;
  let step = 0;
  const tick = () => {
    const chord = p.chords[Math.floor(step / 4) % p.chords.length]!;
    const t = c.currentTime + 0.05;
    const notes: number[] = p.bpm > 90 ? [chord[step % chord.length]!] : step % 4 === 0 ? chord : [chord[(step * 2) % chord.length]! + 12];
    for (const s of notes) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = p.wave;
      o.frequency.value = n(s);
      const dur = p.bpm > 90 ? beat * 0.9 : beat * (step % 4 === 0 ? 4 : 1.5);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18 / notes.length + 0.04, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
    step++;
  };
  tick();
  const id = window.setInterval(tick, beat * 1000);
  return {
    setVolume: (v: number) => (master.gain.value = v),
    stop: () => {
      clearInterval(id);
      master.gain.setTargetAtTime(0, c.currentTime, 0.2);
      setTimeout(() => master.disconnect(), 1000);
    },
  };
}
