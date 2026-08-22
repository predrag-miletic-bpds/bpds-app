import type { ActiveRole, AgeGroup, PlayerSkillLevel, SubscriptionTier } from '@predrag-miletic/bpds-storage.entities.shared-types';

/** Aggregated training totals kept on a player profile. */
export type PlayerStats = {
  /** How many practices the player has completed. */
  completedPractices: number;
  /** Total minutes trained. */
  totalMinutes: number;
  /** Total drills completed across all sessions. */
  completedDrills: number;
};

/** A player profile owned by a coach. */
export type Player = {
  /** Stable player id. */
  id: string;
  /** Full name of the player. */
  fullName: string;
  /** ISO date of birth. */
  dateOfBirth: string;
  /** Age group the player trains in. */
  ageGroup: AgeGroup;
  /** Height in centimetres. */
  height: number;
  /** Weight in kilograms. */
  weight: number;
  /** Playing position. */
  position: string;
  /** Dominant hand. */
  dominantHand: 'Right' | 'Left';
  /** Club the player belongs to. */
  club: string;
  /** Optional team the player is assigned to. */
  teamId?: string;
  /** Coach-facing skill level. */
  skillLevel: PlayerSkillLevel;
  /** How often the player trains. */
  trainingFrequency: string;
  /** Free-form coach notes. */
  notes: string[];
  /** Whether the player is currently active. */
  active: boolean;
  /** Avatar colour used in the UI. */
  photoColor: string;
  /** Aggregated training totals. */
  stats: PlayerStats;
};

/** An optional grouping of players. */
export type Team = {
  /** Stable team id. */
  id: string;
  /** Team name. */
  name: string;
  /** Club the team belongs to. */
  club: string;
  /** Age group the team competes in. */
  ageGroup: AgeGroup;
  /** Coach-facing skill level of the team. */
  skillLevel: PlayerSkillLevel;
  /** Name of the coach responsible for the team. */
  coach: string;
  /** Ids of the players in the team. */
  playerIds: string[];
  /** Free-form coach notes about the team. */
  notes: string[];
};

/** The signed-in coach account. */
export type Coach = {
  /** Stable coach id. */
  id: string;
  /** Coach full name. */
  name: string;
  /** Contact email. */
  email: string;
  /** Active role — Coach or Admin. */
  role: ActiveRole;
  /** Club the coach works at. */
  club: string;
  /** Current subscription tier. */
  subscription: SubscriptionTier;
};

/**
 * Computes a player's age in whole years from their date of birth.
 * @param player the player profile.
 * @param on optional reference date, defaults to now.
 * @returns the age in years.
 */
export function playerAge(player: Player, on: Date = new Date()): number {
  const dob = new Date(player.dateOfBirth);
  let age = on.getFullYear() - dob.getFullYear();
  const monthDiff = on.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && on.getDate() < dob.getDate())) age -= 1;
  return age;
}

/**
 * Returns the players belonging to a team.
 * @param team the team.
 * @param players all known players.
 */
export function teamRoster(team: Team, players: Player[]): Player[] {
  return players.filter((p) => team.playerIds.includes(p.id));
}

/**
 * Adds completed-session totals onto a player's stats.
 * @param player the player to credit.
 * @param minutes minutes trained in the session.
 * @param drills drills completed in the session.
 * @returns a new player object with updated stats.
 */
export function creditSession(player: Player, minutes: number, drills: number): Player {
  return {
    ...player,
    stats: {
      completedPractices: player.stats.completedPractices + 1,
      totalMinutes: player.stats.totalMinutes + minutes,
      completedDrills: player.stats.completedDrills + drills,
    },
  };
}
