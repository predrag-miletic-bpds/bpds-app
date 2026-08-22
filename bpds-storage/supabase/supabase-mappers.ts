import type { HistoryEntry, Practice } from '@predrag-miletic/bpds-practices.entities.practice';
import type { Player as PeoplePlayer, Team as PeopleTeam } from '@predrag-miletic/bpds-people.entities.people';
import type { HistoryRow, Json, PlayerRow, PracticeRow, TeamRow } from './supabase-schema.js';

const now = () => new Date().toISOString();

export function playerToRow(player: PeoplePlayer, coachId: string): PlayerRow {
  const timestamp = now();
  return { coach_id: coachId, id: player.id, full_name: player.fullName, date_of_birth: player.dateOfBirth,
    age_group: player.ageGroup, height_cm: player.height, weight_kg: player.weight, position: player.position,
    dominant_hand: player.dominantHand, club: player.club, skill_level: player.skillLevel,
    training_frequency: player.trainingFrequency, team_id: player.teamId ?? null, photo_color: player.photoColor,
    notes: player.notes as Json, stats: player.stats as unknown as Json, active: player.active,
    created_at: timestamp, updated_at: timestamp };
}

export function rowToPlayer(row: PlayerRow): PeoplePlayer {
  return { id: row.id, fullName: row.full_name, dateOfBirth: row.date_of_birth ?? '', ageGroup: (row.age_group ?? 'U16') as PeoplePlayer['ageGroup'],
    height: row.height_cm ?? 0, weight: row.weight_kg ?? 0, position: row.position ?? '', dominantHand: (row.dominant_hand ?? 'Right') as PeoplePlayer['dominantHand'],
    club: row.club ?? '', teamId: row.team_id ?? undefined, skillLevel: (row.skill_level ?? 'Intermediate') as PeoplePlayer['skillLevel'],
    trainingFrequency: row.training_frequency ?? '', notes: row.notes as string[], active: row.active,
    photoColor: row.photo_color ?? '#e2571f', stats: row.stats as unknown as PeoplePlayer['stats'] };
}

export function teamToRow(team: PeopleTeam, coachId: string): TeamRow {
  const timestamp = now();
  return { coach_id: coachId, id: team.id, name: team.name, club: team.club, age_group: team.ageGroup,
    skill_level: team.skillLevel, coach_name: team.coach, player_ids: team.playerIds, notes: team.notes as Json,
    created_at: timestamp, updated_at: timestamp };
}

export function rowToTeam(row: TeamRow): PeopleTeam {
  return { id: row.id, name: row.name, club: row.club ?? '', ageGroup: (row.age_group ?? 'U16') as PeopleTeam['ageGroup'],
    skillLevel: (row.skill_level ?? 'Intermediate') as PeopleTeam['skillLevel'], coach: row.coach_name ?? '', playerIds: row.player_ids,
    notes: row.notes as string[] };
}

type PracticeContext = Pick<Practice, 'date' | 'duration' | 'secondaryFocus' | 'equipment' | 'courtSize' | 'objective' | 'lastOpened' | 'notes'>;
export function practiceToRow(practice: Practice, coachId: string): PracticeRow {
  const timestamp = now();
  const context: PracticeContext = { date: practice.date, duration: practice.duration, secondaryFocus: practice.secondaryFocus,
    equipment: practice.equipment, courtSize: practice.courtSize, objective: practice.objective,
    lastOpened: practice.lastOpened, notes: practice.notes };
  return { coach_id: coachId, id: practice.id, name: practice.name, status: practice.status, age_group: practice.ageGroup,
    skill_level: practice.skillLevel, primary_focus: practice.primaryFocus, team_id: practice.teamId ?? null,
    player_ids: practice.playerIds, items: practice.items as unknown as Json, context: context as unknown as Json,
    created_at: timestamp, updated_at: timestamp };
}

export function rowToPractice(row: PracticeRow): Practice {
  const context = row.context as unknown as PracticeContext;
  return { id: row.id, name: row.name, date: context.date, playerIds: row.player_ids, teamId: row.team_id ?? undefined,
    ageGroup: (row.age_group ?? 'U16') as Practice['ageGroup'], skillLevel: (row.skill_level ?? 'Intermediate') as Practice['skillLevel'],
    duration: context.duration, primaryFocus: row.primary_focus ?? '', secondaryFocus: context.secondaryFocus,
    equipment: context.equipment, courtSize: context.courtSize, objective: context.objective,
    items: row.items as unknown as Practice['items'], status: row.status as Practice['status'],
    lastOpened: context.lastOpened, notes: context.notes };
}

export function historyToRow(entry: HistoryEntry, coachId: string, practiceId?: string): HistoryRow {
  const timestamp = now();
  return { coach_id: coachId, id: entry.id, practice_id: practiceId ?? null, session_date: entry.date,
    practice_name: entry.practiceName, player_ids: entry.playerIds, team_id: entry.teamId ?? null,
    duration_minutes: entry.duration, focus: entry.focus, completed_drills: entry.completedDrills,
    total_drills: entry.totalDrills, notes: entry.notes, created_at: timestamp, updated_at: timestamp };
}

export function rowToHistory(row: HistoryRow): HistoryEntry {
  return { id: row.id, date: row.session_date, practiceName: row.practice_name, playerIds: row.player_ids,
    teamId: row.team_id ?? undefined, duration: row.duration_minutes, focus: row.focus ?? '',
    completedDrills: row.completed_drills, totalDrills: row.total_drills, notes: row.notes };
}
