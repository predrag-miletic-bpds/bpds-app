import type { Repository, StorageDriver } from '@predrag-miletic/bpds-storage.repository';
import { createBrowserDriver, createRepository } from '@predrag-miletic/bpds-storage.repository';

/**
 * Storage keys used by BPDS.
 *
 * Each collection lives under its own key so that a problem with one
 * collection can never take the others down with it.
 */
export const STORAGE_KEYS = {
  /** Schema version of the persisted BPDS state. */
  version: 'bpds.schema.version',
  /** Player profiles. */
  players: 'bpds.players',
  /** Teams. */
  teams: 'bpds.teams',
  /** Saved practices. */
  practices: 'bpds.practices',
  /** Completed session history, including coach notes. */
  history: 'bpds.history',
  /** Recently viewed drill ids. */
  recentDrills: 'bpds.recentDrills',
} as const;

/** The record collections BPDS persists. */
export const COLLECTION_KEYS = [
  STORAGE_KEYS.players,
  STORAGE_KEYS.teams,
  STORAGE_KEYS.practices,
  STORAGE_KEYS.history,
] as const;

/** Current BPDS persisted-state schema version. */
export const SCHEMA_VERSION = 1;

/** A record that can live in a BPDS collection. */
export type StoredRecord = { id: string };

/**
 * Read/write access handed to a {@link Migration}.
 *
 * A migration only ever transforms what is already stored — it never has
 * access to the seed, so it cannot accidentally replace coach data with
 * demo data.
 */
export type MigrationContext = {
  /** All BPDS storage keys. */
  keys: typeof STORAGE_KEYS;
  /** Parse a collection, or `undefined` when it is absent or unreadable. */
  read<T>(key: string): T[] | undefined;
  /** Write a collection back. */
  write<T>(key: string, records: T[]): void;
  /** Read a raw string value. */
  readRaw(key: string): string | null;
  /** Write a raw string value. */
  writeRaw(key: string, value: string): void;
};

/**
 * One explicit, non-destructive schema upgrade step.
 *
 * Migrations are registered rather than hard-coded so later schema versions
 * can be added without touching {@link openBpdsStorage}. A migration must
 * preserve every existing record — it may add fields, rename them, or derive
 * new ones, but never drop or reset a collection.
 */
export type Migration = {
  /** Schema version this step upgrades from. */
  from: number;
  /** Schema version this step produces. */
  to: number;
  /** Human-readable summary, surfaced in {@link BpdsStorage.migrationsRun}. */
  description: string;
  /** Performs the upgrade against stored data. */
  run(ctx: MigrationContext): void;
};

/**
 * The BPDS migration registry.
 *
 * Empty at schema version 1 — the first release has nothing to upgrade from.
 * Add a step here (or pass extra steps to {@link openBpdsStorage}) whenever
 * {@link SCHEMA_VERSION} is raised.
 */
export const BPDS_MIGRATIONS: Migration[] = [];

/**
 * Fills in fields that are missing from stored records.
 *
 * Used to bring records written by an older build up to the current shape
 * without discarding anything the coach already has.
 *
 * @param records the stored records.
 * @param defaults default value per field name.
 * @returns the records with missing fields filled in.
 */
export function applyDefaults<T extends StoredRecord>(records: T[], defaults: Record<string, unknown>): T[] {
  const fields = Object.keys(defaults);
  if (fields.length === 0) return records;
  return records.map((record) => {
    const missing = fields.filter((field) => (record as Record<string, unknown>)[field] === undefined);
    if (missing.length === 0) return record;
    const patch: Record<string, unknown> = {};
    missing.forEach((field) => { patch[field] = defaults[field]; });
    return { ...record, ...patch };
  });
}

/** Everything BPDS seeds on a fresh install, grouped as one payload. */
export type BpdsSeed<P, T, PR, H> = {
  /** Player profiles seeded when no player collection exists. */
  players: P[];
  /** Teams seeded when no team collection exists. */
  teams: T[];
  /** Practices seeded when no practice collection exists. */
  practices: PR[];
  /** History entries seeded when no history collection exists. */
  history: H[];
  /** Recently viewed drill ids seeded when absent. */
  recentDrills: string[];
};

/** Optional per-collection field defaults applied when opening storage. */
export type BpdsDefaults = {
  /** Defaults for player records. */
  players?: Record<string, unknown>;
  /** Defaults for team records. */
  teams?: Record<string, unknown>;
  /** Defaults for practice records. */
  practices?: Record<string, unknown>;
  /** Defaults for history records. */
  history?: Record<string, unknown>;
};

/** Options accepted by {@link openBpdsStorage}. */
export type OpenStorageOptions<P, T, PR, H> = {
  /** Demo data written only into collections that do not exist yet. */
  seed: BpdsSeed<P, T, PR, H>;
  /** Where to persist. Defaults to `localStorage` with an in-memory fallback. */
  driver?: StorageDriver;
  /** Extra migration steps, appended to {@link BPDS_MIGRATIONS}. */
  migrations?: Migration[];
  /** Fields to backfill on records written by older builds. */
  defaults?: BpdsDefaults;
};

/** A report of what happened while opening storage. */
export type StorageReport = {
  /** Schema version found on disk before opening. */
  fromVersion: number;
  /** Schema version after opening. Unchanged when a migration failed. */
  toVersion: number;
  /** Collections that were absent and therefore seeded. */
  seededCollections: string[];
  /** Collections whose stored value was unreadable and was rebuilt from seed. */
  repairedCollections: string[];
  /** Descriptions of the migration steps that ran, in order. */
  migrationsRun: string[];
  /** The error message when a migration failed, leaving the version untouched. */
  migrationError?: string;
};

/** The set of BPDS repositories, all backed by one driver. */
export type BpdsStorage<P extends StoredRecord, T extends StoredRecord, PR extends StoredRecord, H extends StoredRecord> = {
  /** Player repository. */
  players: Repository<P>;
  /** Team repository. */
  teams: Repository<T>;
  /** Practice repository. */
  practices: Repository<PR>;
  /** History repository, including coach notes. */
  history: Repository<H>;
  /** Read the recently viewed drill ids. */
  readRecentDrills(): string[];
  /** Persist the recently viewed drill ids. */
  writeRecentDrills(ids: string[]): void;
  /** What happened while opening. */
  report: StorageReport;
  /** Wipe every BPDS key so the next open re-seeds from scratch. */
  reset(): void;
};

/** Parse a stored collection, returning `undefined` when absent or unreadable. */
function parseCollection<T>(driver: StorageDriver, key: string): T[] | undefined {
  const raw = driver.read(key);
  if (raw === null) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : undefined;
  } catch {
    return undefined;
  }
}

/** Resolve the ordered migration path between two schema versions. */
function migrationPath(migrations: Migration[], from: number, to: number): Migration[] {
  const path: Migration[] = [];
  let current = from;
  while (current < to) {
    const step = migrations.find((m) => m.from === current && m.to > current);
    if (!step) break;
    path.push(step);
    current = step.to;
  }
  return path;
}

/**
 * Opens BPDS storage without ever destroying coach data.
 *
 * The rules, in order:
 *
 * 1. **Seed per collection, not globally.** A collection is written from the
 *    seed only when its key is absent. A coach who deleted every practice
 *    keeps an empty practice list — the demo practices do not come back.
 * 2. **Repair in isolation.** If one collection holds unreadable data it is
 *    rebuilt from the seed on its own; every other collection is untouched.
 * 3. **Migrate, never reset.** A version mismatch runs the registered
 *    {@link Migration} steps against the existing records, then backfills any
 *    missing fields from `defaults`. The stored version is advanced only after
 *    every step succeeded; if one throws, the data and the old version both
 *    stay exactly as they were so a later build can try again.
 *
 * @param options seed, driver, migration steps and field defaults.
 * @returns the BPDS repositories plus a {@link StorageReport}.
 */
export function openBpdsStorage<
  P extends StoredRecord,
  T extends StoredRecord,
  PR extends StoredRecord,
  H extends StoredRecord,
>(options: OpenStorageOptions<P, T, PR, H>): BpdsStorage<P, T, PR, H> {
  const { seed, driver = createBrowserDriver(), migrations = [], defaults = {} } = options;
  const registry = [...BPDS_MIGRATIONS, ...migrations];

  const seedByKey: Record<string, StoredRecord[]> = {
    [STORAGE_KEYS.players]: seed.players,
    [STORAGE_KEYS.teams]: seed.teams,
    [STORAGE_KEYS.practices]: seed.practices,
    [STORAGE_KEYS.history]: seed.history,
  };
  const defaultsByKey: Record<string, Record<string, unknown> | undefined> = {
    [STORAGE_KEYS.players]: defaults.players,
    [STORAGE_KEYS.teams]: defaults.teams,
    [STORAGE_KEYS.practices]: defaults.practices,
    [STORAGE_KEYS.history]: defaults.history,
  };

  // 1. Work out which collections exist, are absent, or are unreadable.
  const seededCollections: string[] = [];
  const repairedCollections: string[] = [];
  COLLECTION_KEYS.forEach((key) => {
    const raw = driver.read(key);
    if (raw === null) {
      seededCollections.push(key);
      return;
    }
    if (parseCollection(driver, key) === undefined) repairedCollections.push(key);
  });

  // 2. Determine the stored schema version. Data present without a version
  //    key means a pre-versioning build wrote it — treat it as version 0 and
  //    migrate it forward rather than replacing it.
  const rawVersion = driver.read(STORAGE_KEYS.version);
  const parsedVersion = rawVersion === null ? NaN : Number(rawVersion);
  const hasExistingData = seededCollections.length < COLLECTION_KEYS.length;
  const fromVersion = Number.isFinite(parsedVersion)
    ? parsedVersion
    : (hasExistingData ? 0 : SCHEMA_VERSION);

  const report: StorageReport = {
    fromVersion,
    toVersion: fromVersion,
    seededCollections,
    repairedCollections,
    migrationsRun: [],
  };

  // 3. Seed absent collections and rebuild unreadable ones — eagerly, so the
  //    on-disk state matches the report and later migration steps can see
  //    every collection. Collections that already hold data, including ones a
  //    coach has edited or deliberately emptied, are left alone.
  [...seededCollections, ...repairedCollections].forEach((key) => {
    driver.write(key, JSON.stringify(seedByKey[key] ?? []));
  });

  // 4. Migrate forward. Records are preserved; the version advances last.
  if (fromVersion < SCHEMA_VERSION) {
    const ctx: MigrationContext = {
      keys: STORAGE_KEYS,
      read: <R>(key: string) => parseCollection<R>(driver, key),
      write: <R>(key: string, records: R[]) => { driver.write(key, JSON.stringify(records)); },
      readRaw: (key) => driver.read(key),
      writeRaw: (key, value) => { driver.write(key, value); },
    };
    try {
      migrationPath(registry, fromVersion, SCHEMA_VERSION).forEach((step) => {
        step.run(ctx);
        report.migrationsRun.push(`v${step.from} → v${step.to}: ${step.description}`);
      });
      // Backfill fields added since the stored records were written.
      COLLECTION_KEYS.forEach((key) => {
        const fieldDefaults = defaultsByKey[key];
        if (!fieldDefaults) return;
        const records = parseCollection<StoredRecord>(driver, key);
        if (!records) return;
        driver.write(key, JSON.stringify(applyDefaults(records, fieldDefaults)));
      });
      driver.write(STORAGE_KEYS.version, String(SCHEMA_VERSION));
      report.toVersion = SCHEMA_VERSION;
    } catch (error) {
      // Leave both the data and the stored version untouched.
      report.migrationError = error instanceof Error ? error.message : String(error);
    }
  } else if (rawVersion === null) {
    driver.write(STORAGE_KEYS.version, String(SCHEMA_VERSION));
    report.toVersion = SCHEMA_VERSION;
  }

  const readRecentDrills = (): string[] => {
    const raw = driver.read(STORAGE_KEYS.recentDrills);
    if (raw === null) {
      driver.write(STORAGE_KEYS.recentDrills, JSON.stringify(seed.recentDrills));
      return [...seed.recentDrills];
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as string[]) : [...seed.recentDrills];
    } catch {
      return [...seed.recentDrills];
    }
  };

  return {
    // createRepository writes its `initial` argument only when the key is
    // absent, so an existing (or deliberately emptied) collection is kept.
    players: createRepository<P>(driver, STORAGE_KEYS.players, seed.players),
    teams: createRepository<T>(driver, STORAGE_KEYS.teams, seed.teams),
    practices: createRepository<PR>(driver, STORAGE_KEYS.practices, seed.practices),
    history: createRepository<H>(driver, STORAGE_KEYS.history, seed.history),
    readRecentDrills,
    writeRecentDrills: (ids) => { driver.write(STORAGE_KEYS.recentDrills, JSON.stringify(ids)); },
    report,
    reset: () => { Object.values(STORAGE_KEYS).forEach((key) => driver.remove(key)); },
  };
}
