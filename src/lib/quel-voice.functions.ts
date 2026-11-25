import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Plano 1: voz gratuita do Hugging Face (português). Retorna null se indisponível. */
async function huggingFaceSpeech(text: string) {
  const token = process.env["HUGGINGFACE_API_KEY"]?.trim();
  if (!token) return null;
  try {
    const { InferenceClient } = await import("@huggingface/inference");
    const client = new InferenceClient(token);
    const blob = await client.textToSpeech({
      model: process.env["HUGGINGFACE_TTS_MODEL"] || "hexgrad/Kokoro-82M",
      inputs: text,
      parameters: { voice: "pf_dora" } as Record<string, unknown>,
    });
    return { buf: new Uint8Array(await blob.arrayBuffer()), contentType: blob.type || "audio/mpeg" };
  } catch (e) {
    console.error("huggingFaceSpeech", e);
    return null;
  }
}

/** Plano 2: voz Kore direto pela API gratuita/própria do Google Gemini. */
async function geminiSpeech(text: string) {
  const key = process.env["GEMINI_API_KEY"]?.trim();
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Fale em português do Brasil, com voz feminina jovem, tom suave, calmo, acolhedor e alegre, sem pressa e com muito carinho: ${text}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
          },
        }),
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[];
    };
    const inline = json.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inline?.data) return null;
    return { audio: inline.data, contentType: inline.mimeType || "audio/wav" };
  } catch (e) {
    console.error("geminiSpeech", e);
    return null;
  }
}

function toB64(buf: Uint8Array) {
  let s = "";
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Voz oficial da Professora Quel (independente da Lovable). */
export const quelSpeech = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { text: string }) => ({ text: String(d.text ?? "").slice(0, 1500) }))
  .handler(async ({ data }) => {
    if (!data.text.trim()) return { audio: null, contentType: "", error: "Nenhum texto para falar." };
    const hf = await huggingFaceSpeech(data.text);
    if (hf) return { audio: toB64(hf.buf), contentType: hf.contentType, error: "" };
    const gem = await geminiSpeech(data.text);
    if (gem) return { audio: gem.audio, contentType: gem.contentType, error: "" };
    return {
      audio: null,
      contentType: "",
      error: "A voz da Quel está temporariamente indisponível. O texto continua disponível.",
    };
  });
