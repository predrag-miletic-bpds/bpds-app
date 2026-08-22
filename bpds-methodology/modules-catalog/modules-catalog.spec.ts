import { AREAS, MODULES, getModule, modulesByArea, modulesCatalog, prerequisiteChain } from './modules-catalog.js';

it('holds the full 26-module BPDS Master Module Map', () => {
  expect(MODULES).toHaveLength(26);
  expect(modulesCatalog.count()).toBe(26);
});

it('covers six development areas and assigns every module to one', () => {
  expect(AREAS).toHaveLength(6);
  expect(MODULES.every((m) => AREAS.includes(m.area))).toBe(true);
});

it('looks a module up by code', () => {
  expect(getModule('COD')?.name).toBe('Ball Handling — Change of Direction');
  expect(getModule('NOPE')).toBeUndefined();
});

it('groups modules by development area', () => {
  expect(modulesByArea('Game Application').map((m) => m.code)).toEqual(['TOF', 'ADV', 'SSG']);
});

it('resolves the transitive prerequisite chain in training order', () => {
  expect(prerequisiteChain('COD').map((m) => m.code)).toEqual(['BM', 'SBH', 'MBH']);
  expect(prerequisiteChain('BM')).toEqual([]);
});

it('references only modules that exist in every prerequisite list', () => {
  const codes = new Set(MODULES.map((m) => m.code));
  MODULES.forEach((m) => m.prerequisites.forEach((p) => expect(codes.has(p)).toBe(true)));
});
