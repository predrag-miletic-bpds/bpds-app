import type { Drill } from './methodology.js';
import { drillLevelLabel, fitsPlayerCount, hasEquipment } from './methodology.js';

const drill = {
  minPlayers: 4,
  equipment: ['Basketballs', 'Cones'],
} as Drill;

it('labels BPDS levels', () => {
  expect(drillLevelLabel(1)).toBe('Level 1 Foundation');
  expect(drillLevelLabel(3)).toBe('Level 3 Performance');
});

it('checks the player count against the drill minimum', () => {
  expect(fitsPlayerCount(drill, 4)).toBe(true);
  expect(fitsPlayerCount(drill, 2)).toBe(false);
});

it('checks equipment availability', () => {
  expect(hasEquipment(drill, ['Basketballs', 'Cones', 'Chairs'])).toBe(true);
  expect(hasEquipment(drill, ['Basketballs'])).toBe(false);
});

it('treats "No additional equipment" as always available', () => {
  const bodyweight = { minPlayers: 1, equipment: ['No additional equipment'] } as Drill;
  expect(hasEquipment(bodyweight, [])).toBe(true);
});
