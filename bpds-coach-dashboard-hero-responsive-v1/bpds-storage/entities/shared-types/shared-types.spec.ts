import { AGE_GROUPS, PLAYER_SKILL_LEVELS, agesFrom, createId, today } from './shared-types.js';

it('exposes the full list of age groups', () => {
  expect(AGE_GROUPS).toContain('U12');
  expect(AGE_GROUPS.length).toBeGreaterThan(0);
});

it('exposes player skill levels', () => {
  expect(PLAYER_SKILL_LEVELS).toEqual(['Beginner', 'Intermediate', 'Advanced', 'Elite']);
});

it('creates prefixed ids', () => {
  expect(createId('drill')).toMatch(/^drill-/);
});

it('returns an iso date for today', () => {
  expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}/);
});

it('returns age groups from a starting point', () => {
  const ages = agesFrom('U16');
  expect(ages[0]).toBe('U16');
});
