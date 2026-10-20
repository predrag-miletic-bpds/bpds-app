import { DRILLS, drillCatalog, getDrill, getDrillByCode, modulesForFocus, relatedDrills, searchDrills } from './drill-catalog.js';

it('holds the full BPDS drill database', () => {
  expect(DRILLS.length).toBeGreaterThanOrEqual(35);
  expect(drillCatalog.count()).toBe(DRILLS.length);
});

it('keeps COD-L3-016 with its full methodological record', () => {
  const drill = getDrillByCode('COD-L3-016');
  expect(drill).toBeDefined();
  expect(drill?.moduleCode).toBe('COD');
  expect(drill?.whyThisDrill.length).toBeGreaterThan(0);
  expect(drill?.coachingPoints.length).toBeGreaterThan(0);
});

it('gives every drill a unique id and a complete record', () => {
  expect(new Set(DRILLS.map((d) => d.id)).size).toBe(DRILLS.length);
  DRILLS.forEach((d) => {
    expect(d.objective.length).toBeGreaterThan(0);
    expect(d.whyThisDrill.length).toBeGreaterThan(0);
    expect(d.suitableAges.length).toBeGreaterThan(0);
  });
});

it('looks a drill up by id and by code', () => {
  const first = DRILLS[0];
  expect(getDrill(first.id)?.code).toBe(first.code);
  expect(getDrillByCode(first.code.toLowerCase())?.id).toBe(first.id);
});

it('filters by module, level and age group', () => {
  expect(searchDrills({ moduleCode: 'COD' }).every((d) => d.moduleCode === 'COD')).toBe(true);
  expect(searchDrills({ level: 1 }).every((d) => d.level === 1)).toBe(true);
  expect(searchDrills({ ageGroup: 'U8' }).every((d) => d.suitableAges.includes('U8'))).toBe(true);
});

it('filters by free text across name, code, objective and tags', () => {
  const results = searchDrills({ text: 'crossover' });
  expect(results.length).toBeGreaterThan(0);
  expect(searchDrills({ text: 'zzzz-no-such-drill' })).toEqual([]);
});

it('excludes drills the coach lacks equipment or players for', () => {
  expect(searchDrills({ equipment: [] }).every((d) => d.equipment.every((e) => e === 'No additional equipment'))).toBe(true);
  expect(searchDrills({ playerCount: 1 }).every((d) => d.minPlayers <= 1)).toBe(true);
});

it('maps a coach focus to BPDS module codes', () => {
  expect(modulesForFocus('Shooting')).toEqual(['SH']);
  expect(modulesForFocus('Unknown focus')).toEqual([]);
});

it('resolves drill links to real catalog records', () => {
  const withLinks = DRILLS.find((d) => d.prerequisiteDrills.length > 0);
  if (!withLinks) return;
  relatedDrills(withLinks).prerequisites.forEach((d) => expect(d.id).toBeTruthy());
});
