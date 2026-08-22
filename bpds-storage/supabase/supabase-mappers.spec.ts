import { describe, expect, it } from 'vitest';
import { playerToRow, practiceToRow, rowToPlayer, rowToPractice, rowToTeam, teamToRow } from './supabase-mappers.js';

describe('Supabase domain mappers', () => {
  it('round-trips a player without losing BPDS fields', () => {
    const player = { id: 'p1', fullName: 'Test Player', dateOfBirth: '2010-01-02', ageGroup: 'U16' as const,
      height: 180, weight: 70, position: 'Guard', dominantHand: 'Right' as const, club: 'BPDS',
      skillLevel: 'Advanced' as const, trainingFrequency: '3x', notes: ['note'], active: true,
      photoColor: '#fff', stats: { completedPractices: 2, totalMinutes: 90, completedDrills: 10 } };
    expect(rowToPlayer(playerToRow(player, 'coach-1'))).toEqual(player);
  });

  it('round-trips a team', () => {
    const team = { id: 't1', name: 'U16', club: 'BPDS', ageGroup: 'U16' as const,
      skillLevel: 'Intermediate' as const, coach: 'Coach', playerIds: ['p1'], notes: ['ready'] };
    expect(rowToTeam(teamToRow(team, 'coach-1'))).toEqual(team);
  });

  it('round-trips a practice including its JSON context', () => {
    const practice = { id: 'pr1', name: 'Shooting', date: '2026-08-11', playerIds: ['p1'], ageGroup: 'U16' as const,
      skillLevel: 'Advanced' as const, duration: 30, primaryFocus: 'Shooting', secondaryFocus: 'Footwork',
      equipment: ['Ball'], courtSize: 'Half', objective: 'Improve shooting', items: [], status: 'Draft' as const,
      lastOpened: '2026-08-11', notes: 'Test' };
    expect(rowToPractice(practiceToRow(practice, 'coach-1'))).toEqual(practice);
  });
});
