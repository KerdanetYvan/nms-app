import { generateProgram } from './generateProgram';

// moderate 3h → 1.5h
// weeklyRate=0.5, introReduction=0.25, totalReduction=1.5
// reductionWeeks = max(4, ceil((1.5 - 0.25) / 0.5)) = max(4, 3) = 4
// totalWeeks = 1 + 4 + 3 = 8
describe('moderate 3h → 1.5h', () => {
  const program = generateProgram(3, 1.5, 'moderate');

  test('totalWeeks = 8', () => {
    expect(program.totalWeeks).toBe(8);
  });

  test('première milestone à 2.75h', () => {
    expect(program.milestones[0].targetDailyHours).toBe(2.75);
  });

  test('dernière milestone à 1.5h', () => {
    expect(program.milestones[program.totalWeeks - 1].targetDailyHours).toBe(1.5);
  });

  test('phase intro = 1 seule semaine', () => {
    expect(program.milestones.filter(m => m.phase === 'intro').length).toBe(1);
  });

  test('chaque semaine de réduction a un quota différent de la précédente', () => {
    const reduction = program.milestones.filter(m => m.phase === 'reduction_main');
    const duplicates = reduction.filter((m, i) =>
      i > 0 && m.targetDailyHours === reduction[i - 1].targetDailyHours
    );
    expect(duplicates.length).toBe(0);
  });
});

// aggressive 2h → 1.9h — cas limite
// introReduction=0.5 >= totalReduction=0.1 → atterrissage direct
// totalWeeks = 1 + 3 = 4, pas de phase reduction_main
describe('aggressive 2h → 1.9h (cas limite)', () => {
  const program = generateProgram(2, 1.9, 'aggressive');

  test('totalWeeks = 4', () => {
    expect(program.totalWeeks).toBe(4);
  });

  test('aucune phase reduction_main', () => {
    expect(program.milestones.some(m => m.phase === 'reduction_main')).toBe(false);
  });
});

// gentle 9h → 1h — courbe non linéaire
// La sigmoid démarre très bas (progress faible) et change lentement,
// donc la réduction hebdomadaire n'est pas constante.
describe('gentle 9h → 1h (non-linéarité)', () => {
  const program = generateProgram(9, 1, 'gentle');

  test('milestones[1] et milestones[2] ont des reductionFromPrevious différents', () => {
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
