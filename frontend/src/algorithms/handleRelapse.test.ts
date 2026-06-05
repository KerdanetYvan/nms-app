import { handleRelapse } from './handleRelapse';

// 14 jours d'usage réel : 7 jours à 2 h + 7 jours à 3 h → baseline = 2.5 h
const USAGE_14_DAYS = [2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3];

// ─── Déclencheur ──────────────────────────────────────────────────────────────

describe('trigger: silent_flag', () => {
  const result = handleRelapse({
    trigger: 'silent_flag',
    lastTwoWeeksUsage: USAGE_14_DAYS,
    currentMotivation: 'moderate',
    decision: { difficulty: 'dont_know' },
  });

  test('silentReset = true', () => {
    expect(result.silentReset).toBe(true);
  });

  test('message de confirmation présent', () => {
    expect(result.message).toBe('Programme ajusté, on repart de là');
  });
});

describe('trigger: consecutive_misses', () => {
  const result = handleRelapse({
    trigger: 'consecutive_misses',
    lastTwoWeeksUsage: USAGE_14_DAYS,
    currentMotivation: 'moderate',
    decision: { difficulty: 'dont_know' },
  });

  test('silentReset = false', () => {
    expect(result.silentReset).toBe(false);
  });
});

// ─── Calcul de la nouvelle baseline ──────────────────────────────────────────

describe('calcul de la baseline', () => {
  test("baseline = moyenne de l'usage sur 14 jours", () => {
    const result = handleRelapse({
      trigger: 'consecutive_misses',
      lastTwoWeeksUsage: USAGE_14_DAYS,
      currentMotivation: 'moderate',
      decision: { difficulty: 'dont_know' },
    });
    // sum = 7*2 + 7*3 = 35, avg = 35/14 = 2.5
    expect(result.newBaseline).toBe(2.5);
  });

  test('baseline arrondie à 2 décimales', () => {
    // 14 jours à 1 h, sauf un à 2 h → avg = 15/14 ≈ 1.071428...
    const usage = Array(13).fill(1).concat([2]);
    const result = handleRelapse({
      trigger: 'consecutive_misses',
      lastTwoWeeksUsage: usage,
      currentMotivation: 'gentle',
      decision: { difficulty: 'dont_know' },
    });
    expect(result.newBaseline).toBe(1.07);
  });
});

// ─── consecutiveMisses ────────────────────────────────────────────────────────

describe('consecutiveMisses', () => {
  test('toujours remis à 0 après ajustement', () => {
    const result = handleRelapse({
      trigger: 'consecutive_misses',
      lastTwoWeeksUsage: USAGE_14_DAYS,
      currentMotivation: 'aggressive',
      decision: { difficulty: 'too_difficult' },
    });
    expect(result.consecutiveMisses).toBe(0);
  });
});

// ─── Branche : lack_motivation ────────────────────────────────────────────────

describe('lack_motivation — downgrade accepté', () => {
  const result = handleRelapse({
    trigger: 'consecutive_misses',
    lastTwoWeeksUsage: USAGE_14_DAYS,
    currentMotivation: 'aggressive',
    decision: { difficulty: 'lack_motivation', profileDowngradeAccepted: true },
  });

  test('profil dégradé aggressive → moderate', () => {
    expect(result.newMotivation).toBe('moderate');
  });
  test('aucune extension de durée', () => {
    expect(result.extensionWeeks).toBe(0);
  });
  test('aucune pause', () => {
    expect(result.pauseWeeks).toBe(0);
  });
});

describe('lack_motivation — downgrade refusé', () => {
  const result = handleRelapse({
    trigger: 'consecutive_misses',
    lastTwoWeeksUsage: USAGE_14_DAYS,
    currentMotivation: 'moderate',
    decision: { difficulty: 'lack_motivation', profileDowngradeAccepted: false },
  });

  test('profil inchangé', () => {
    expect(result.newMotivation).toBe('moderate');
  });
  test('extension de durée appliquée', () => {
    expect(result.extensionWeeks).toBeGreaterThan(0);
  });
  test('aucune pause', () => {
    expect(result.pauseWeeks).toBe(0);
  });
});

// ─── Branche : too_difficult ──────────────────────────────────────────────────

describe('too_difficult — cascade automatique', () => {
  test('aggressive → moderate', () => {
    const result = handleRelapse({
      trigger: 'consecutive_misses',
      lastTwoWeeksUsage: USAGE_14_DAYS,
      currentMotivation: 'aggressive',
      decision: { difficulty: 'too_difficult' },
    });
    expect(result.newMotivation).toBe('moderate');
  });

  test('moderate → gentle', () => {
    const result = handleRelapse({
      trigger: 'consecutive_misses',
      lastTwoWeeksUsage: USAGE_14_DAYS,
      currentMotivation: 'moderate',
      decision: { difficulty: 'too_difficult' },
    });
    expect(result.newMotivation).toBe('gentle');
  });

  test('gentle → gentle (plancher, ne descend pas plus bas)', () => {
    const result = handleRelapse({
      trigger: 'consecutive_misses',
      lastTwoWeeksUsage: USAGE_14_DAYS,
      currentMotivation: 'gentle',
      decision: { difficulty: 'too_difficult' },
    });
    expect(result.newMotivation).toBe('gentle');
  });
});

// ─── Branche : something_difficult ───────────────────────────────────────────

describe('something_difficult — pause souhaitée', () => {
  const result = handleRelapse({
    trigger: 'consecutive_misses',
    lastTwoWeeksUsage: USAGE_14_DAYS,
    currentMotivation: 'moderate',
    decision: { difficulty: 'something_difficult', pauseDesired: true, pauseWeeks: 2 },
  });

  test('pause de 2 semaines', () => {
    expect(result.pauseWeeks).toBe(2);
  });
  test('aucune extension de durée', () => {
    expect(result.extensionWeeks).toBe(0);
  });
  test('profil inchangé', () => {
    expect(result.newMotivation).toBe('moderate');
  });
});

describe('something_difficult — pas de pause', () => {
  const result = handleRelapse({
    trigger: 'consecutive_misses',
    lastTwoWeeksUsage: USAGE_14_DAYS,
    currentMotivation: 'moderate',
    decision: { difficulty: 'something_difficult', pauseDesired: false },
  });

  test('extension de durée appliquée', () => {
    expect(result.extensionWeeks).toBeGreaterThan(0);
  });
  test('aucune pause', () => {
    expect(result.pauseWeeks).toBe(0);
  });
  test('profil inchangé', () => {
    expect(result.newMotivation).toBe('moderate');
  });
});

// ─── Branche : busy_period ────────────────────────────────────────────────────

describe('busy_period', () => {
  const result = handleRelapse({
    trigger: 'consecutive_misses',
    lastTwoWeeksUsage: USAGE_14_DAYS,
    currentMotivation: 'aggressive',
    decision: { difficulty: 'busy_period' },
  });

  test('profil inchangé', () => {
    expect(result.newMotivation).toBe('aggressive');
  });
  test('extension de durée uniquement', () => {
    expect(result.extensionWeeks).toBeGreaterThan(0);
    expect(result.pauseWeeks).toBe(0);
  });
});

// ─── Branche : dont_know ─────────────────────────────────────────────────────

describe('dont_know', () => {
  const result = handleRelapse({
    trigger: 'consecutive_misses',
    lastTwoWeeksUsage: USAGE_14_DAYS,
    currentMotivation: 'gentle',
    decision: { difficulty: 'dont_know' },
  });

  test('profil inchangé', () => {
    expect(result.newMotivation).toBe('gentle');
  });
  test('extension de durée uniquement', () => {
    expect(result.extensionWeeks).toBeGreaterThan(0);
    expect(result.pauseWeeks).toBe(0);
  });
});
