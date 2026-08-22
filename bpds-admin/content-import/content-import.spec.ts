import { importDrills, mergeDrills, validateRow } from './content-import.js';
import type { DrillRow } from './content-import.js';

const VALID: DrillRow = {
  code: 'COD-L2-101',
  name: 'Crossover Attack Series',
  moduleCode: 'COD',
  level: 2,
  objective: 'Develop a game-speed crossover that creates a driving angle.',
  whyThisDrill: 'Change of direction at speed is the foundation of creating separation in live play.',
  suitableAges: ['U14', 'U16'],
  coachingPoints: ['Low and wide on the change', 'Eyes up through the move'],
  duration: 8,
  intensity: 'High',
};

it('accepts a well-formed row and completes it with BPDS defaults', () => {
  const result = importDrills([VALID], { existingCodes: [] });
  expect(result.rejected).toHaveLength(0);
  expect(result.added).toBe(1);
  const [drill] = result.accepted;
  expect(drill.id).toBe('cod-l2-101');
  expect(drill.equipment).toEqual(['Basketballs']);
  expect(drill.suitableAges).toEqual(['U14', 'U16']);
});

it('rejects rows with an unknown module, a bad code or a bad level', () => {
  const result = importDrills([
    { ...VALID, code: 'XYZ-L2-101', moduleCode: 'XYZ' },
    { ...VALID, code: 'not-a-code' },
    { ...VALID, code: 'COD-L2-102', level: 9 },
  ], { existingCodes: [] });
  expect(result.accepted).toHaveLength(0);
  expect(result.rejected).toHaveLength(3);
  expect(result.issues.some((i) => i.field === 'moduleCode' && i.severity === 'error')).toBe(true);
});

it('flags duplicates in the batch and counts updates against the catalog', () => {
  const result = importDrills([VALID, { ...VALID }], { existingCodes: ['COD-L2-101'] });
  expect(result.updated).toBe(1);
  expect(result.rejected).toEqual(['COD-L2-101']);
  expect(result.issues.some((i) => i.message.includes('Duplicate drill code'))).toBe(true);
});

it('warns without rejecting when optional guidance is missing', () => {
  const issues = validateRow({ ...VALID, coachingPoints: [], suitableAges: [] }, 0, ['COD']);
  expect(issues.every((i) => i.severity === 'warning')).toBe(true);
  expect(issues.map((i) => i.field)).toEqual(expect.arrayContaining(['coachingPoints', 'suitableAges']));
});

it('merges imported drills into a catalog by code without mutating it', () => {
  const { accepted } = importDrills([VALID], { existingCodes: [] });
  const catalog = mergeDrills([], accepted);
  const rerun = mergeDrills(catalog, accepted);
  expect(catalog).toHaveLength(1);
  expect(rerun).toHaveLength(1);
});
