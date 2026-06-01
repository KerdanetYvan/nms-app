const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

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

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export const api = {
  getContexts: () => req<ContextInfo[]>("/contexts"),
  getChallenge: (context: string, exclude?: string) =>
    req<ChallengeResponse>(
      `/challenge?context=${encodeURIComponent(context)}${
        exclude ? `&exclude=${encodeURIComponent(exclude)}` : ""
      }`,
    ),
  saveAnswer: (payload: { context: string; challenge: string; answer: string }) =>
    req<AnswerRecord>("/answers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getAnswers: () => req<AnswerRecord[]>("/answers"),
};
