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

// ─── Algo 2 : Ajustement en cas de dépassement ───────────────────────────────

/** Ce qui a déclenché la session d'ajustement */
export type RelapseTrigger =
  | 'silent_flag'        // un seul dépassement, pas de mention de régression côté UI
  | 'consecutive_misses'; // 2 semaines ratées consécutives → dialogue utilisateur

/**
 * Raison choisie par l'utilisateur + sous-décisions selon la branche.
 * Union discriminée : le champ `difficulty` sert de discriminant.
 */
export type RelapseDecision =
  | { difficulty: 'lack_motivation'; profileDowngradeAccepted: boolean }
  | { difficulty: 'too_difficult' }
  | { difficulty: 'something_difficult'; pauseDesired: false }
  | { difficulty: 'something_difficult'; pauseDesired: true; pauseWeeks: 1 | 2 }
  | { difficulty: 'busy_period' }
  | { difficulty: 'dont_know' };

/** Entrée complète de l'algo d'ajustement */
export type RelapseInput = {
  trigger: RelapseTrigger;
  /** Temps d'écran réel (en heures) pour chacun des 14 derniers jours */
  lastTwoWeeksUsage: number[];
  currentMotivation: Motivation;
  decision: RelapseDecision;
  /** Champ libre, jamais obligatoire */
  optionalFeedback?: string;
};

/**
 * Ce que produit l'algo d'ajustement.
 * newBaseline et newMotivation sont réinjectés dans generateProgram (Algo 1).
 */
export type AdjustmentResult = {
  /** Nouveau point de départ : moyenne de l'usage réel sur 14 jours */
  newBaseline: number;
  /** Profil après éventuel déclassement */
  newMotivation: Motivation;
  /** Semaines ajoutées à la durée du programme (0 = pas d'extension) */
  extensionWeeks: number;
  /** Semaines de pause avant reprise automatique (0 = pas de pause) */
  pauseWeeks: number;
  /** Toujours remis à 0 après un ajustement réussi */
  consecutiveMisses: 0;
  /** true = déclenchement silencieux, l'UI ne doit pas mentionner de régression */
  silentReset: boolean;
  /** Message de confirmation à afficher à l'utilisateur */
  message: string;
};
