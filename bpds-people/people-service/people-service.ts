import type { Coach, Player, Team } from '@predrag-miletic/bpds-people.entities.people';
import { creditSession, playerAge, teamRoster } from '@predrag-miletic/bpds-people.entities.people';
import type { Repository } from '@predrag-miletic/bpds-storage.repository';
import { createId, today } from '@predrag-miletic/bpds-storage.entities.shared-types';
import type { AgeGroup, PlayerSkillLevel } from '@predrag-miletic/bpds-storage.entities.shared-types';

/** Fields a coach fills in when creating a player profile. */
export type NewPlayerInput = {
  /** Full name of the player. */
  fullName: string;
  /** ISO date of birth. */
  dateOfBirth?: string;
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
  /** Coach-facing skill level. */
  skillLevel: PlayerSkillLevel;
  /** How often the player trains. */
  trainingFrequency: string;
  /** Optional team assignment. */
  teamId?: string;
  /** Avatar colour. */
  photoColor?: string;
};

/** Fields a coach fills in when creating a team. */
export type NewTeamInput = {
  /** Team name. */
  name: string;
  /** Club the team belongs to. */
  club: string;
  /** Age group the team competes in. */
  ageGroup: AgeGroup;
  /** Coach-facing skill level. */
  skillLevel: PlayerSkillLevel;
  /** Name of the responsible coach. */
  coach: string;
  /** Ids of the players in the team. */
  playerIds?: string[];
};

/** The repositories the people service reads and writes. */
export type PeopleStores = {
  /** Player repository. */
  players: Repository<Player>;
  /** Team repository. */
  teams: Repository<Team>;
};

/** The people domain API used by the app. */
export type PeopleService = ReturnType<typeof createPeopleService>;

/** Palette used to give new players a distinct avatar colour. */
const AVATAR_COLORS = ['#e2571f', '#2563eb', '#1f9d63', '#7c3aed', '#d98a06', '#db2777', '#0891b2', '#65a30d'];

/**
 * Creates the BPDS people service over the storage boundary.
 *
 * All player and team reads and writes go through this service, so the app
 * never touches persistence directly and the same API can later be served by
 * a backend without any page changing.
 *
 * @param stores the player and team repositories.
 * @returns the people domain API.
 */
export function createPeopleService(stores: PeopleStores) {
  const { players, teams } = stores;

  return {
    /** Every player profile. */
    listPlayers: (): Player[] => players.list(),

    /** One player by id. */
    getPlayer: (id: string): Player | undefined => players.get(id),

    /** Only players currently marked active. */
    listActivePlayers: (): Player[] => players.list().filter((p) => p.active),

    /** Players belonging to a team. */
    listTeamPlayers: (teamId: string): Player[] => {
      const team = teams.get(teamId);
      return team ? teamRoster(team, players.list()) : [];
    },

    /** Resolve a set of player ids to profiles, skipping unknown ids. */
    resolvePlayers: (ids: string[]): Player[] => {
      const all = players.list();
      return ids.map((id) => all.find((p) => p.id === id)).filter((p): p is Player => Boolean(p));
    },

    /**
     * Creates a player profile with BPDS defaults for stats and avatar.
     * @param input the fields the coach filled in.
     */
    createPlayer: (input: NewPlayerInput): Player => {
      const count = players.list().length;
      const player: Player = {
        id: createId('p'),
        fullName: input.fullName,
        dateOfBirth: input.dateOfBirth ?? today(),
        ageGroup: input.ageGroup,
        height: input.height,
        weight: input.weight,
        position: input.position,
        dominantHand: input.dominantHand,
        club: input.club,
        teamId: input.teamId,
        skillLevel: input.skillLevel,
        trainingFrequency: input.trainingFrequency,
        notes: [],
        active: true,
        photoColor: input.photoColor ?? AVATAR_COLORS[count % AVATAR_COLORS.length],
        stats: { completedPractices: 0, totalMinutes: 0, completedDrills: 0 },
      };
      return players.add(player);
    },

    /** Replace a player profile. */
    updatePlayer: (player: Player): Player => players.update(player),

    /** Delete a player profile. */
    removePlayer: (id: string): void => players.remove(id),

    /** Append a coach note to a player profile. */
    addPlayerNote: (id: string, note: string): Player | undefined => {
      const player = players.get(id);
      if (!player || !note.trim()) return player;
      return players.update({ ...player, notes: [note, ...player.notes] });
    },

    /** The player's age in whole years. */
    ageOf: (player: Player): number => playerAge(player),

    /** Every team. */
    listTeams: (): Team[] => teams.list(),

    /** One team by id. */
    getTeam: (id: string): Team | undefined => teams.get(id),

    /**
     * Creates a team.
     * @param input the fields the coach filled in.
     */
    createTeam: (input: NewTeamInput): Team => teams.add({
      id: createId('t'),
      name: input.name,
      club: input.club,
      ageGroup: input.ageGroup,
      skillLevel: input.skillLevel,
      coach: input.coach,
      playerIds: input.playerIds ?? [],
      notes: [],
    }),

    /** Replace a team. */
    updateTeam: (team: Team): Team => teams.update(team),

    /** Delete a team. */
    removeTeam: (id: string): void => teams.remove(id),

    /**
     * Credits a completed session to every player who trained.
     *
     * Called when the coach finishes a session in Practice Mode, so player
     * totals on the profile pages stay in step with training history.
     *
     * @param playerIds the players who trained.
     * @param minutes minutes trained.
     * @param drills drills completed.
     * @returns the updated player profiles.
     */
    creditSession: (playerIds: string[], minutes: number, drills: number): Player[] => players
      .list()
      .filter((p) => playerIds.includes(p.id))
      .map((p) => players.update(creditSession(p, minutes, drills))),
  };
}

/**
 * The demo coach account.
 *
 * Authentication is out of scope for this phase — the prototype signs this
 * coach in directly.
 */
export const DEMO_COACH: Coach = {
  id: 'c1',
  name: 'Predrag Miletić',
  email: 'coach@bpds.app',
  role: 'Coach',
  club: 'KK Partizan Youth',
  subscription: 'Free Preview',
};
