import { DRILLS } from '@predrag-miletic/bpds-methodology.drill-catalog';
import type { GeneratorContext, Practice } from './types.js';
import { composeMethodicalWeeklyPractice } from './weekly-plan-generator.js';

const ctx: GeneratorContext = {
  trainingType: 'Team',
  playerIds: ['p1', 'p2', 'p4'],
  teamId: 't1',
  ageGroup: 'U16',
  skillLevel: 'Intermediate',
  duration: 60,
  playerCount: 10,
  baskets: 2,
  courtSize: 'Full court',
  equipment: ['Basketballs', 'Cones', 'No additional equipment'],
  primaryFocus: 'Ball Mastery',
  secondaryFocus: 'Shooting',
  intensity: 'Medium',
  withDefense: true,
  competitive: false,
  smallSidedGame: false,
};

it('builds variable drill counts with methodical Ball Mastery and Stationary Ball Handling timing', () => {
  const ballMastery = DRILLS.find((drill) => drill.moduleCode === 'BM');
  const stationary = DRILLS.find((drill) => drill.moduleCode === 'SBH');
  if (!ballMastery || !stationary) throw new Error('Expected BPDS handling drills in the catalog.');

  const practice: Practice = {
    id: 'weekly-methodical-test',
    name: 'Methodical Weekly Practice',
    date: '2026-08-15',
    playerIds: ctx.playerIds,
    teamId: ctx.teamId,
    ageGroup: ctx.ageGroup,
    skillLevel: ctx.skillLevel,
    duration: ctx.duration,
    primaryFocus: ctx.primaryFocus,
    secondaryFocus: ctx.secondaryFocus,
    equipment: ctx.equipment,
    courtSize: ctx.courtSize,
    objective: 'Test methodical block timing.',
    items: [
      {
        id: 'seed-bm',
        kind: 'drill',
        drillId: ballMastery.id,
        duration: 12,
        phase: 'Individual Skill Activation',
      },
      {
        id: 'seed-sbh',
        kind: 'drill',
        drillId: stationary.id,
        duration: 12,
        phase: 'Individual Skill Activation',
      },
    ],
    status: 'Draft',
    lastOpened: '2026-08-15',
  };

  const result = composeMethodicalWeeklyPractice(practice, ctx);
  const drillItems = result.items.filter((item) => item.kind === 'drill');
  const drillIds = drillItems.flatMap((item) => item.drillId ? [item.drillId] : []);

  expect(drillItems.length).toBeGreaterThan(5);
  expect(new Set(drillIds).size).toBe(drillIds.length);
  expect(result.items.reduce((total, item) => total + item.duration, 0)).toBe(ctx.duration);

  const moduleOrder = [
    'WUP', 'BM', 'SBH', 'MBH', 'COD', 'COM', 'FIN', 'FW', 'TT', 'ATT',
    'PAS', 'SH', 'DFW', 'OBD', 'OFD', 'REB', 'OCS', 'OBM', 'OBS', 'PNR',
    'TOC', 'TOF', 'TRD', 'ADV', 'SSG',
  ];
  const moduleCodes = drillItems.flatMap((item) => {
    const moduleCode = DRILLS.find((candidate) => candidate.id === item.drillId)?.moduleCode;
    return moduleCode ? [moduleCode] : [];
  });
  const orderIndexes = moduleCodes.map((moduleCode) => moduleOrder.indexOf(moduleCode));
  expect(orderIndexes).toEqual([...orderIndexes].sort((a, b) => a - b));
  if (moduleCodes.includes('WUP')) expect(moduleCodes[0]).toBe('WUP');

  const ballMasteryPositions = moduleCodes
    .map((moduleCode, index) => moduleCode === 'BM' ? index : -1)
    .filter((index) => index >= 0);
  if (ballMasteryPositions.length) {
    const first = ballMasteryPositions[0];
    const last = ballMasteryPositions[ballMasteryPositions.length - 1];
    expect(last - first + 1).toBe(ballMasteryPositions.length);
  }

  const orderedCodes = drillItems.flatMap((item) => {
    const code = DRILLS.find((candidate) => candidate.id === item.drillId)?.code;
    return code ? [code] : [];
  });
  const lowPoundRight = orderedCodes.indexOf('SBH-L1-001');
  const lowPoundLeft = orderedCodes.indexOf('SBH-L1-002');
  const twoBallAlternating = orderedCodes.indexOf('SBH-L2-004');
  expect(lowPoundRight).toBeGreaterThanOrEqual(0);
  expect(lowPoundLeft).toBeGreaterThan(lowPoundRight);
  expect(twoBallAlternating).toBeGreaterThan(lowPoundLeft);

  drillItems.forEach((item) => {
    const drill = DRILLS.find((candidate) => candidate.id === item.drillId);
    if (drill?.moduleCode === 'BM') expect(item.duration).toBe(1);
    if (drill?.moduleCode === 'SBH') {
      expect(item.duration).toBeGreaterThanOrEqual(2);
      expect(item.duration).toBeLessThanOrEqual(3);
    }
  });
});
