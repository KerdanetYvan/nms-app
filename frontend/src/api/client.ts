import { supabase } from '@/src/lib/supabase';

export type ContextInfo = { key: string; label: string };
export type ChallengeResponse = {
  context: string;
  context_label: string;
  challenge: string;
};
export type AnswerRecord = {
  id: string;
  context: string;
  context_label: string;
  challenge: string;
  answer: string;
  created_at: string;
};

export const api = {
  async getContexts(): Promise<ContextInfo[]> {
    const { data, error } = await supabase.from('contexts').select('key, label');
    if (error) throw error;
    return data;
  },

  async getChallenge(context: string, exclude?: string): Promise<ChallengeResponse> {
    const { data, error } = await supabase
      .from('challenges')
      .select('text, contexts(label)')
      .eq('context_key', context);
    if (error) throw error;

    // Exclure le défi actuel pour le shuffle, avec fallback si tous exclus
    const pool = exclude ? data.filter((c) => c.text !== exclude) : data;
    const candidates = pool.length > 0 ? pool : data;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];

    return {
      context,
      context_label: (pick.contexts as unknown as { label: string }).label,
      challenge: pick.text,
    };
  },

  async saveAnswer(payload: {
    context: string;
    challenge: string;
    answer: string;
  }): Promise<void> {
    const [{ data: { user } }, { data: ch, error: chErr }] = await Promise.all([
      supabase.auth.getUser(),
      // Retrouver l'id du défi à partir de son texte pour respecter la FK
      supabase
        .from('challenges')
        .select('id')
        .eq('context_key', payload.context)
        .eq('text', payload.challenge)
        .single(),
    ]);
    if (chErr) throw chErr;

    const { error } = await supabase.from('answers').insert({
      context_key: payload.context,
      challenge_id: ch.id,
      answer: payload.answer,
      user_id: user!.id,
    });
    if (error) throw error;
  },

  async getAnswers(): Promise<AnswerRecord[]> {
    const { data, error } = await supabase
      .from('answers')
      .select('id, context_key, answer, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return data.map((r) => ({
      id: r.id,
      context: r.context_key,
      context_label: '',
      challenge: '',
      answer: r.answer,
      created_at: r.created_at,
    }));
  },
};
