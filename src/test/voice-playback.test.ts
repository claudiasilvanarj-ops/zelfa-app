import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { speech, notify, robot, play, rates } = vi.hoisted(() => ({
  speech: vi.fn(), notify: vi.fn(), robot: vi.fn(), play: vi.fn(), rates: [] as number[],
}));
vi.mock("@/lib/quel-voice.functions", () => ({ quelSpeech: speech }));
vi.mock("sonner", () => ({ toast: { error: notify } }));
import { speak, stopSpeaking } from "@/lib/voice";

describe("voz oficial sem substituição robótica", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rates.length = 0;
    localStorage.clear();
    vi.stubGlobal("speechSynthesis", { speak: robot, cancel: vi.fn() });
    vi.stubGlobal("Audio", class {
      playbackRate = 1;
      onended = null;
      onerror = null;
      play() { rates.push(this.playbackRate); return play(); }
      pause = vi.fn();
    });
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:quel-test") });
    stopSpeaking();
  });
  afterEach(() => { stopSpeaking(); vi.unstubAllGlobals(); });

  it("não usa a voz do aparelho quando faltam créditos", async () => {
    speech.mockResolvedValue({ audio: null, contentType: "", error: "Créditos de IA indisponíveis." });
    speak("Olá, vamos cozinhar?");
    await vi.waitFor(() => expect(notify).toHaveBeenCalledWith("Créditos de IA indisponíveis.", expect.any(Object)));
    expect(robot).not.toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();
  });

  it("não substitui a Quel quando o navegador bloqueia o áudio", async () => {
    speech.mockResolvedValue({ audio: "AAAA", contentType: "audio/wav", error: "" });
    play.mockRejectedValue(new Error("NotAllowedError"));
    speak("Teste de reprodução bloqueada.");
    await vi.waitFor(() => expect(notify).toHaveBeenCalledWith(expect.stringContaining("Toque em ouvir"), expect.any(Object)));
    expect(robot).not.toHaveBeenCalled();
  });

  it("reproduz o áudio oficial e mantém a velocidade escolhida", async () => {
    speech.mockResolvedValue({ audio: "AAAA", contentType: "audio/wav", error: "" });
    play.mockResolvedValue(undefined);
    localStorage.setItem("zelfa-voice", JSON.stringify({ enabled: true, speed: "lenta" }));
    const started = vi.fn();
    speak("Teste da voz oficial.", { onStart: started });
    await vi.waitFor(() => expect(started).toHaveBeenCalledOnce());
    expect(play).toHaveBeenCalledOnce();
    expect(rates).toEqual([0.85]);
    expect(robot).not.toHaveBeenCalled();
  });
});