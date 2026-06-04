import type { Motivation } from '../types';

const WEEKLY_RATES: Record<Motivation, number> = {
  aggressive: 1.0,
  moderate:   0.5,
  gentle:     0.25,
};

export type Phase = 'intro' | 'reduction_main' | 'consolidation';

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

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
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

  // Phase 1 — demi-rythme (gère aussi le cas limite via Math.max)
  push(1, currentScreenTime - phase1Reduction, 'intro');

  if (phase1Reduction >= totalReduction) {
    // Cas limite : on atterrit à targetScreenTime dès la semaine 1
    for (let w = 2; w <= 5; w++) {
      push(w, targetScreenTime, 'consolidation');
    }
  } else {
    // Cas normal : phase 2 sur courbe asymptotique (Lally 2010), phase 3 consolidation
    const phase2Weeks = Math.ceil((totalReduction - phase1Reduction) / weeklyRate);

    for (let n = 1; n <= phase2Weeks; n++) {
      const progress   = (n - 1) / phase2Weeks;
      const cumulative = phase1Reduction + (totalReduction - phase1Reduction) * sigmoid(progress * 10 - 5);
      push(1 + n, currentScreenTime - cumulative, 'reduction_main');
    }

    const lastReductionWeek = 1 + phase2Weeks;
    for (let w = lastReductionWeek + 1; w <= lastReductionWeek + 4; w++) {
      push(w, targetScreenTime, 'consolidation');
    }
  }

  return { totalWeeks: milestones.length, milestones };
}
