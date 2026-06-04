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
