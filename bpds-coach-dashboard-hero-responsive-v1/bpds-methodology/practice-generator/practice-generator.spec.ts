import { DRILLS, getDrillByCode } from '@predrag-miletic/bpds-methodology.drill-catalog';
import type { GeneratorContext } from '@predrag-miletic/bpds-practices.entities.practice';
import { PHASE_ORDER, drillPhase, findAlternatives, generatePractice, isEligible } from './practice-generator.js';

const ctx: GeneratorContext = {
  trainingType: 'Team',
  playerIds: ['p1', 'p2', 'p4'],
  teamId: 't1',
  ageGroup: 'U16',
  skillLevel: 'Advanced',
  duration: 90,
  playerCount: 10,
  baskets: 2,
  courtSize: 'Full court',
  equipment: ['Basketballs', 'Cones', 'Contact pad', 'No additional equipment'],
  primaryFocus: 'Shooting',
  secondaryFocus: 'Decision Making',
  intensity: 'High',
  withDefense: true,
  competitive: true,
  smallSidedGame: true,
};

it('generates a practice with a methodological timeline', () => {
  const practice = generatePractice(ctx);
  expect(practice.items.length).toBeGreaterThan(0);
  expect(practice.status).toBe('Draft');
  expect(practice.objective.length).toBeGreaterThan(0);
  expect(practice.playerIds).toEqual(ctx.playerIds);
});

it('orders drills along the eight BPDS phases and never backwards', () => {
  const items = generatePractice(ctx).items.filter((i) => i.kind === 'drill');
  const indices = items.map((i) => PHASE_ORDER.indexOf(i.phase));
  expect([...indices].sort((a, b) => a - b)).toEqual(indices);
});

it('only picks drills the coach has the context to run', () => {
  generatePractice(ctx).items
    .filter((i) => i.drillId)
    .forEach((i) => {
      const drill = DRILLS.find((d) => d.id === i.drillId);
      expect(drill && isEligible(drill, ctx)).toBe(true);
    });
});

it('excludes live-defense drills when the coach disables defense', () => {
  const noDefense = generatePractice({ ...ctx, withDefense: false });
  noDefense.items.filter((i) => i.drillId).forEach((i) => {
    expect(DRILLS.find((d) => d.id === i.drillId)?.withDefense).toBe(false);
  });
});

it('respects the requested age group', () => {
  generatePractice({ ...ctx, ageGroup: 'U10' }).items.filter((i) => i.drillId).forEach((i) => {
    expect(DRILLS.find((d) => d.id === i.drillId)?.suitableAges).toContain('U10');
  });
});

it('adds a water break to longer sessions', () => {
  const practice = generatePractice(ctx);
  if (practice.items.length > 4) {
    expect(practice.items.some((i) => i.kind === 'break')).toBe(true);
  }
});

it('keeps a short session inside a tighter plan than a long one', () => {
  const short = generatePractice({ ...ctx, duration: 30 });
  const long = generatePractice({ ...ctx, duration: 120 });
  expect(short.duration).toBe(30);
  expect(long.items.length).toBeGreaterThanOrEqual(short.items.length);
});

it('places every drill in a phase resolvable from its module', () => {
  DRILLS.forEach((d) => expect(PHASE_ORDER).toContain(drillPhase(d)));
});

it('suggests alternatives with an explicit replacement reason', () => {
  const practice = generatePractice(ctx);
  const item = practice.items.find((i) => i.drillId);
  const current = DRILLS.find((d) => d.id === item?.drillId);
  if (!current) return;
  const alternatives = findAlternatives(current, practice);
  alternatives.forEach((alt) => {
    expect(alt.reason).toMatch(/^Suitable because of /);
    expect(alt.drill.id).not.toBe(current.id);
  });
});

it('never suggests a drill already used in the practice', () => {
  const practice = generatePractice(ctx);
  const item = practice.items.find((i) => i.drillId);
  const current = DRILLS.find((d) => d.id === item?.drillId);
  if (!current) return;
  const used = practice.items.map((i) => i.drillId);
  findAlternatives(current, practice).forEach((alt) => expect(used).not.toContain(alt.drill.id));
});

it('keeps COD-L3-016 eligible for an advanced U16 change-of-direction session', () => {
  const drill = getDrillByCode('COD-L3-016');
  expect(drill).toBeDefined();
  expect(isEligible(drill!, {
    ...ctx, primaryFocus: 'Change of Direction', equipment: [...ctx.equipment, ...drill!.equipment],
  })).toBe(true);
});
