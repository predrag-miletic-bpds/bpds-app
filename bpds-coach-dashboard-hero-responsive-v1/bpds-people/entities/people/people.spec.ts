import type { Player, Team } from './people.js';
import { creditSession, playerAge, teamRoster } from './people.js';

const player = {
  id: 'p1',
  fullName: 'Luka Jovanović',
  dateOfBirth: '2009-03-14',
  stats: { completedPractices: 2, totalMinutes: 120, completedDrills: 14 },
} as Player;

it('computes a player age from the date of birth', () => {
  expect(playerAge(player, new Date('2025-03-15'))).toBe(16);
  expect(playerAge(player, new Date('2025-03-13'))).toBe(15);
});

it('returns the roster of a team', () => {
  const team = { id: 't1', playerIds: ['p1'] } as Team;
  const other = { id: 'p2' } as Player;
  expect(teamRoster(team, [player, other])).toEqual([player]);
});

it('credits a completed session to the player stats', () => {
  const updated = creditSession(player, 90, 8);
  expect(updated.stats).toEqual({ completedPractices: 3, totalMinutes: 210, completedDrills: 22 });
  expect(player.stats.completedPractices).toBe(2);
});
