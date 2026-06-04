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

export type UserProfile = {
  user_id: string;
  screen_time_min: number;
  target_time_min: number;
  motivation: Motivation;
  program?: unknown;
};
