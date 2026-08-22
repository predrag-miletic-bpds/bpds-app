import type { Coach, Player, Team } from '@predrag-miletic/bpds-people.entities.people';
import { createPeopleService, DEMO_COACH } from '@predrag-miletic/bpds-people.people-service';
import type { PeopleService } from '@predrag-miletic/bpds-people.people-service';
import type { HistoryEntry, Practice } from '@predrag-miletic/bpds-practices.entities.practice';
import { createPracticeService } from '@predrag-miletic/bpds-practices.practice-service';
import type { PracticeService } from '@predrag-miletic/bpds-practices.practice-service';
import type { StorageDriver } from '@predrag-miletic/bpds-storage.repository';
import { openBpdsStorage } from '@predrag-miletic/bpds-storage.storage';
import type { BpdsStorage } from '@predrag-miletic/bpds-storage.storage';
import { HISTORY, PLAYERS, PRACTICES, TEAMS } from '../data/mock.js';

/** Drill ids shown as "recently viewed" on a fresh install. */
const SEED_RECENT_DRILLS = ['cod-l3-016', 'sh-l2-009', 'fin-l2-001'];

/** Extra browser keys the prototype persists next to the BPDS collections. */
export const SESSION_KEYS = {
  /** Whether the coach is signed in. */
  session: 'bpds.session',
  /** The unsaved practice draft, so a reload does not lose generated work. */
  draft: 'bpds.draft',
} as const;

/** The BPDS storage shape used by the prototype. */
export type PrototypeStorage = BpdsStorage<Player, Team, Practice, HistoryEntry>;

/** Everything the app needs to read and write BPDS data. */
export type BpdsServices = {
  /** The persistence layer, seeded and migrated. */
  storage: PrototypeStorage;
  /** Players and teams. */
  people: PeopleService;
  /** Practices, Practice Mode and history. */
  practices: PracticeService;
  /** The signed-in coach. */
  coach: Coach;
};

/**
 * Opens BPDS storage and wires the domain services over it.
 *
 * Called once per app session. Demo data is written only into collections
 * that do not exist yet, so anything the coach created survives a reload.
 *
 * @param driver optional storage driver, used by tests to stay in memory.
 * @returns the people and practice services over persistent storage.
 */
export function createServices(driver?: StorageDriver): BpdsServices {
  const storage = openBpdsStorage<Player, Team, Practice, HistoryEntry>({
    driver,
    seed: {
      players: PLAYERS,
      teams: TEAMS,
      practices: PRACTICES,
      history: HISTORY,
      recentDrills: SEED_RECENT_DRILLS,
    },
    defaults: {
      players: { notes: [], active: true, stats: { completedPractices: 0, totalMinutes: 0, completedDrills: 0 } },
      teams: { notes: [], playerIds: [] },
      practices: { status: 'Draft', items: [] },
    },
  });

  return {
    storage,
    people: createPeopleService({ players: storage.players, teams: storage.teams }),
    practices: createPracticeService({ practices: storage.practices, history: storage.history }),
    coach: DEMO_COACH,
  };
}

/** Read a JSON value written by the prototype, or `undefined` when absent. */
export function readLocal<T>(key: string): T | undefined {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    const raw = window.localStorage.getItem(key);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

/** Write a JSON value, or clear the key when the value is `undefined`. */
export function writeLocal(key: string, value: unknown): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (value === undefined) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is unavailable — the session simply does not survive a reload.
  }
}
