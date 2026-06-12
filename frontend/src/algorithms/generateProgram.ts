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
  const weeklyRate    = WEEKLY_RATES[motivation];
  const totalReduction  = currentScreenTime - targetScreenTime;
  const phase1Reduction = weeklyRate * 0.5;

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

  // Phase 1 — 2 semaines à demi-rythme (Lally : résistance maximale en début de programme)
  push(1, currentScreenTime - phase1Reduction, 'intro');
  push(2, currentScreenTime - phase1Reduction, 'intro');

  if (phase1Reduction >= totalReduction) {
    // Cas limite : objectif atteint dès la phase 1 → 3 semaines de consolidation
    for (let w = 3; w <= 5; w++) {
      push(w, targetScreenTime, 'consolidation');
    }
  } else {
    // Cas normal : phase 2 sur courbe asymptotique (Lally 2010), puis consolidation
    // min 4 semaines pour éviter les pics extrêmes sur les courts programmes
    const phase2Weeks = Math.max(4, Math.ceil((totalReduction - phase1Reduction) / weeklyRate));

    for (let n = 1; n <= phase2Weeks; n++) {
      // progress va de 1/N à 1 : la dernière semaine atteint exactement l'objectif
      const progress   = n / phase2Weeks;
      const cumulative = phase1Reduction + (totalReduction - phase1Reduction) * normalized_sigmoid(progress);
      push(2 + n, currentScreenTime - cumulative, 'reduction_main');
    }

    // 3 semaines de consolidation (Lally : ≥18 jours pour ancrer l'habitude)
    const lastReductionWeek = 2 + phase2Weeks;
    for (let w = lastReductionWeek + 1; w <= lastReductionWeek + 3; w++) {
      push(w, targetScreenTime, 'consolidation');
    }
  }

  return { totalWeeks: milestones.length, milestones };
}
