import { generateProgram } from './generateProgram';

// moderate 3h → 1.5h
// weeklyRate=0.5, totalReduction=1.5, phase1Reduction=0.25
// phase2Weeks = max(4, ceil((1.5 - 0.25) / 0.5)) = max(4, 3) = 4
// totalWeeks = 2 + 4 + 3 = 9
describe('moderate 3h → 1.5h', () => {
  const program = generateProgram(3, 1.5, 'moderate');

  test('totalWeeks = 9', () => {
    expect(program.totalWeeks).toBe(9);
  });

  test('première milestone à 2.75h', () => {
    expect(program.milestones[0].targetDailyHours).toBe(2.75);
  });

  test('dernière milestone à 1.5h', () => {
    expect(program.milestones[program.totalWeeks - 1].targetDailyHours).toBe(1.5);
  });
});

// aggressive 2h → 1.9h — cas limite
// phase1Reduction=0.5 >= totalReduction=0.1 → atterrissage direct
// totalWeeks = 1 + 4 = 5, pas de phase reduction_main
describe('aggressive 2h → 1.9h (cas limite)', () => {
  const program = generateProgram(2, 1.9, 'aggressive');

  test('totalWeeks = 5', () => {
    expect(program.totalWeeks).toBe(5);
  });

  test('aucune phase reduction_main', () => {
    expect(program.milestones.some(m => m.phase === 'reduction_main')).toBe(false);
  });
});

// gentle 9h → 1h — courbe non linéaire
// La sigmoid démarre très bas (n=1, progress=0, x=-5) et change lentement,
// donc la réduction hebdomadaire n'est pas constante.
describe('gentle 9h → 1h (non-linéarité)', () => {
  const program = generateProgram(9, 1, 'gentle');

  test('milestone[1] et milestone[2] ont des reductionFromPrevious différents', () => {
    expect(program.milestones[1].reductionFromPrevious).not.toBe(
      program.milestones[2].reductionFromPrevious
    );
  });
});

// targetScreenTime = 0 — aucune milestone ne doit descendre sous 0
describe('targetScreenTime = 0', () => {
  const program = generateProgram(3, 0, 'moderate');

  test('aucune milestone sous 0', () => {
    const min = Math.min(...program.milestones.map(m => m.targetDailyHours));
    expect(min).toBeGreaterThanOrEqual(0);
  });
});
