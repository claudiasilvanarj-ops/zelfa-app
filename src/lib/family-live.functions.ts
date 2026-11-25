import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, Output } from 'ai';
import { z } from 'zod';

export const describeLiveFrame = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ invitation: z.string().uuid(), image: z.string().max(600000).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: invitation } = await context.supabase.from('camera_invitations').select('owner_id').eq('id', data.invitation).single();
    const { data: allowed } = await context.supabase.rpc('camera_allowed', { invitation: data.invitation });
    if (!allowed || invitation?.owner_id !== context.userId) throw new Error('Câmera não autorizada.');
    const geminiKey = process.env['GEMINI_API_KEY']?.trim();
    const openaiKey = process.env['OPENAI_API_KEY']?.trim();
    if (!geminiKey && !openaiKey) throw new Error('Descrição indisponível.');
    const provider = geminiKey
      ? createOpenAI({ apiKey: geminiKey, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' })
      : createOpenAI({ apiKey: openaiKey! });
    const modelName = geminiKey ? (process.env['GEMINI_MODEL']?.trim() || 'gemini-3.5-flash-lite') : (process.env['OPENAI_MODEL']?.trim() || 'gpt-4o-mini');
    const result = streamText({
      model: provider.chat(modelName),
      output: Output.object({ schema: z.object({ description: z.string() }) }),
      messages: [{ role: 'user', content: [{ type: 'text', text: 'Você é ZELFA, assistente calma e carinhosa. Descreva em português brasileiro, em até 3 frases, apenas o que é claramente visível nesta imagem. Não identifique pessoas, não diagnostique saúde, sono, respiração ou segurança. Se estiver escuro ou incerto, diga que não consegue observar. Uma imagem não comprova se alguém está bem.' }, { type: 'image', image: data.image }] }],
    });
    try {
      const output = await result.output;
      if (!output?.description.trim()) throw new Error('Descrição vazia.');
      return output.description;
    } catch { throw new Error('Não foi possível descrever esta imagem. Tente novamente somente quando desejar.'); }
  });
