import { createMemoryDriver, createRepository } from '@predrag-miletic/bpds-storage.repository';
import type { Player, Team } from '@predrag-miletic/bpds-people.entities.people';
import { createPeopleService, DEMO_COACH } from './people-service.js';

function service(players: Player[] = [], teams: Team[] = []) {
  const driver = createMemoryDriver();
  return createPeopleService({
    players: createRepository<Player>(driver, 'players', players),
    teams: createRepository<Team>(driver, 'teams', teams),
  });
}

it('creates a player with BPDS defaults for stats and avatar', () => {
  const people = service();
  const player = people.createPlayer({
    fullName: 'Marko Jovanović',
    ageGroup: 'U14',
    height: 172,
    weight: 61,
    position: 'Guard',
    dominantHand: 'Right',
    club: 'KK Partizan Youth',
    skillLevel: 'Intermediate',
    trainingFrequency: '4x per week',
  });
  expect(player.active).toBe(true);
  expect(player.stats).toEqual({ completedPractices: 0, totalMinutes: 0, completedDrills: 0 });
  expect(player.photoColor).toBeTruthy();
  expect(people.listPlayers()).toHaveLength(1);
});

it('credits a completed session to every player who trained', () => {
  const people = service();
  const player = people.createPlayer({
    fullName: 'Ana Petrović',
    ageGroup: 'U16',
    height: 180,
    weight: 68,
    position: 'Forward',
    dominantHand: 'Left',
    club: 'KK Partizan Youth',
    skillLevel: 'Advanced',
    trainingFrequency: '5x per week',
  });
  people.creditSession([player.id], 90, 7);
  const updated = people.getPlayer(player.id);
  expect(updated?.stats.completedPractices).toBe(1);
  expect(updated?.stats.totalMinutes).toBe(90);
  expect(updated?.stats.completedDrills).toBe(7);
});

it('resolves team rosters and skips unknown player ids', () => {
  const people = service();
  const player = people.createPlayer({
    fullName: 'Luka Ilić',
    ageGroup: 'U12',
    height: 158,
    weight: 48,
    position: 'Guard',
    dominantHand: 'Right',
    club: 'KK Partizan Youth',
    skillLevel: 'Beginner',
    trainingFrequency: '3x per week',
  });
  const team = people.createTeam({
    name: 'U12 Blue',
    club: 'KK Partizan Youth',
    ageGroup: 'U12',
    skillLevel: 'Beginner',
    coach: DEMO_COACH.name,
    playerIds: [player.id],
  });
  expect(people.listTeamPlayers(team.id).map((p) => p.id)).toEqual([player.id]);
  expect(people.resolvePlayers([player.id, 'missing'])).toHaveLength(1);
});
