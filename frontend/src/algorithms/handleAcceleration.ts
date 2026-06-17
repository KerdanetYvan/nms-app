import type { Motivation } from '../types';

const MOTIVATION_ORDER: Motivation[] = ['gentle', 'moderate', 'aggressive'];

function upgradeMotivation(current: Motivation): Motivation {
  const idx = MOTIVATION_ORDER.indexOf(current);
  return MOTIVATION_ORDER[Math.min(idx + 1, MOTIVATION_ORDER.length - 1)];
}

export type AccelerationInput = {
  currentMotivation: Motivation;
  accelerationAccepted: boolean;
};

export type AccelerationResult = {
  programChanged: boolean;
  newMotivation: Motivation;
  shortenConsolidation: boolean;
  consecutiveSuccesses: 0;
  message: string;
};

/**
 * Algo 3 — Accélération en cas de réussite critique.
 *
 * Déclenché après 2 semaines consécutives où l'utilisateur a dépassé son objectif.
 * Si accepté :
 *   - gentle | moderate → profil upgradé d'un cran (weeklyRate plus élevé)
 *   - aggressive (déjà au max) → consolidation réduite de 3 sem. à 1 sem.
 * Si refusé : programme inchangé, message neutre.
 */
export function handleAcceleration(input: AccelerationInput): AccelerationResult {
  const { currentMotivation, accelerationAccepted } = input;

  if (!accelerationAccepted) {
    return {
      programChanged: false,
      newMotivation: currentMotivation,
      shortenConsolidation: false,
      consecutiveSuccesses: 0,
      message: "Pas de problème, tu gères à ton rythme",
    };
  }

  if (currentMotivation === 'aggressive') {
    return {
      programChanged: true,
      newMotivation: 'aggressive',
      shortenConsolidation: true,
      consecutiveSuccesses: 0,
      message: "C'est parti, on accélère !",
    };
  }

  return {
    programChanged: true,
    newMotivation: upgradeMotivation(currentMotivation),
    shortenConsolidation: false,
    consecutiveSuccesses: 0,
    message: "C'est parti, on accélère !",
  };
}
