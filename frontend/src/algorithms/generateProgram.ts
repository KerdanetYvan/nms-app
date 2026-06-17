import type { Motivation, Phase } from '../types';

export type { Phase };

const WEEKLY_RATES: Record<Motivation, number> = {
  aggressive: 1.0,
  moderate:   0.5,
  gentle:     0.25,
};

export type WeekMilestone = {
  week: number;
  startDate: Date;
  targetDailyHours: number;
  phase: Phase;
  reductionFromPrevious: number;
};

export type Program = {
  totalWeeks: number;
  milestones: WeekMilestone[];
};

// Sigmoid normalisée scale=6 : maps [0,1] → [0,1] avec une courbe en S modérée.
// Scale 6 (vs 10) réduit le pic de réduction hebdo de ~2.5× à ~1.85× le rythme moyen.
function normalized_sigmoid(t: number): number {
  const raw = (x: number) => 1 / (1 + Math.exp(-x));
  const lo = raw(-3);
  const hi = raw(3);
  return (raw(t * 6 - 3) - lo) / (hi - lo);
}

export function generateProgram(
  currentScreenTime: number,
  targetScreenTime: number,
  motivation: Motivation,
  startDate = new Date()
): Program {
  const weeklyRate     = WEEKLY_RATES[motivation];
  const totalReduction = currentScreenTime - targetScreenTime;

  // Réduction de la semaine d'intro = demi-rythme (résistance maximale en S1)
  const introReduction = weeklyRate * 0.5;

  const milestones: WeekMilestone[] = [];
  let prevTarget = currentScreenTime;

  const push = (week: number, rawTarget: number, phase: Phase): void => {
    const targetDailyHours = Math.max(rawTarget, targetScreenTime);
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
    milestones.push({
      week,
      startDate: weekStart,
      targetDailyHours,
      phase,
      reductionFromPrevious: prevTarget - targetDailyHours,
    });
    prevTarget = targetDailyHours;
  };

  // Phase intro — 1 seule semaine de démarrage en douceur
  push(1, currentScreenTime - introReduction, 'intro');

  if (introReduction >= totalReduction) {
    // Cas limite : objectif quasi-atteint dès S1 → consolidation directe
    for (let w = 2; w <= 4; w++) {
      push(w, targetScreenTime, 'consolidation');
    }
  } else {
    // Phase réduction — courbe sigmoid (Lally 2010 : résistance décroissante)
    // min 4 semaines pour garantir une courbe sans pic trop abrupts
    const reductionWeeks = Math.max(4, Math.ceil((totalReduction - introReduction) / weeklyRate));

    for (let n = 1; n <= reductionWeeks; n++) {
      const progress   = n / reductionWeeks;
      const cumulative = introReduction + (totalReduction - introReduction) * normalized_sigmoid(progress);
      push(1 + n, currentScreenTime - cumulative, 'reduction_main');
    }

    // Phase consolidation — 3 semaines (Lally : ≥18 jours pour ancrer l'habitude)
    const lastReductionWeek = 1 + reductionWeeks;
    for (let w = lastReductionWeek + 1; w <= lastReductionWeek + 3; w++) {
      push(w, targetScreenTime, 'consolidation');
    }
  }

  return { totalWeeks: milestones.length, milestones };
}
