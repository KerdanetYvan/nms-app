export type ContextInfo = {
  key: string;
  label: string;
};

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

export type Motivation = 'aggressive' | 'moderate' | 'gentle';

export type Phase = 'intro' | 'reduction_main' | 'consolidation';

export type Profile = {
  id: string;
  prenom: string | null;
  nom: string | null;
  date_naissance: string | null;
  telephone: string | null;
  created_at: string;
  updated_at: string;
};

export type UserProfile = {
  user_id: string;
  screen_time_min: number;
  target_time_min: number;
  motivation: Motivation;
  reason?: string | null;
  apps?: string[];
  scroll_moments?: string[];
  started_at?: string | null;
  status?: 'active' | 'paused' | 'completed' | 'abandoned';
  pause_until?: string | null;
  consecutive_misses?: number;
};

export type WeekCheckin = {
  id: string;
  user_id: string;
  week_number: number;
  week_start_date: string;
  target_daily_minutes: number;
  phase: Phase;
  reduction_from_previous_min: number;
  screen_time_reported_minutes: number | null;
  goal_met: boolean | null;
  challenge_completed: boolean;
  created_at: string;
  updated_at: string;
};

// ─── Algo 2 : Ajustement en cas de dépassement ───────────────────────────────

export type RelapseTrigger =
  | 'silent_flag'
  | 'consecutive_misses';

export type RelapseDecision =
  | { difficulty: 'lack_motivation'; profileDowngradeAccepted: boolean }
  | { difficulty: 'too_difficult' }
  | { difficulty: 'something_difficult'; pauseDesired: false }
  | { difficulty: 'something_difficult'; pauseDesired: true; pauseWeeks: 1 | 2 }
  | { difficulty: 'busy_period' }
  | { difficulty: 'dont_know' };

export type RelapseInput = {
  trigger: RelapseTrigger;
  lastTwoWeeksUsage: number[];
  currentMotivation: Motivation;
  decision: RelapseDecision;
  optionalFeedback?: string;
};

export type AdjustmentResult = {
  newBaseline: number;
  newMotivation: Motivation;
  extensionWeeks: number;
  pauseWeeks: number;
  consecutiveMisses: 0;
  silentReset: boolean;
  message: string;
};
