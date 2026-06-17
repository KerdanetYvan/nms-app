import { supabase } from '@/src/lib/supabase';
import type { AnswerRecord, ChallengeResponse, ContextInfo, Motivation, Profile, UserProfile, WeekCheckin } from '@/src/types';

type CheckinPayload = {
  user_id: string;
  week_number: number;
  week_start_date: string;
  target_daily_minutes: number;
  phase: string;
  reduction_from_previous_min: number;
};

export type { AnswerRecord, ChallengeResponse, ContextInfo, Motivation, Profile, UserProfile, WeekCheckin };

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

  async getProfile(): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data as Profile | null;
  },

  async updateProfile(fields: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('profiles')
      .update(fields)
      .eq('id', user!.id);
    if (error) throw error;
  },

  async getUserProfile(): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, screen_time_min, target_time_min, motivation, reason, apps, scroll_moments, started_at, status, pause_until, consecutive_misses')
      .maybeSingle();
    if (error) throw error;
    return data as UserProfile | null;
  },

  async saveUserProfile(profile: Omit<UserProfile, 'status' | 'pause_until' | 'consecutive_misses' | 'program'> & { started_at: string }): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .upsert(profile, { onConflict: 'user_id' });
    if (error) throw error;
  },

  async applyAdjustment(payload: {
    newMotivation: Motivation;
    newScreenTimeMin: number;
    program: object;
    checkins: CheckinPayload[];
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const { error: profileErr } = await supabase
      .from('user_profiles')
      .update({
        motivation: payload.newMotivation,
        screen_time_min: payload.newScreenTimeMin,
        program: payload.program,
      })
      .eq('user_id', user!.id);
    if (profileErr) throw profileErr;

    const { error: checkinsErr } = await supabase
      .from('weekly_checkins')
      .upsert(payload.checkins, { onConflict: 'user_id,week_number' });
    if (checkinsErr) throw checkinsErr;
  },

  async saveProgram(program: object): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('user_profiles')
      .update({ program: JSON.parse(JSON.stringify(program)) })
      .eq('user_id', user!.id);
    if (error) throw error;
  },

  async getWeeklyCheckins(): Promise<WeekCheckin[]> {
    const { data, error } = await supabase
      .from('weekly_checkins')
      .select('*')
      .order('week_number', { ascending: true });
    if (error) throw error;
    return (data ?? []) as WeekCheckin[];
  },

  async updateWeeklyCheckin(
    id: string,
    fields: Partial<Pick<WeekCheckin, 'screen_time_reported_minutes' | 'goal_met' | 'challenge_completed'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('weekly_checkins')
      .update(fields)
      .eq('id', id);
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
