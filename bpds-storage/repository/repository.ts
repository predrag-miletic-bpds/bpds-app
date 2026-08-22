import type { Identifiable } from '@predrag-miletic/bpds-storage.entities.shared-types';

/**
 * A minimal key/value persistence port.
 *
 * The prototype backs this with `localStorage`, but any host — a Node
 * service, an aspect node runtime, an in-memory test double — can supply
 * its own implementation without any consumer changing.
 */
export type StorageDriver = {
  /** Read a raw string value, or `null` when the key is absent. */
  read(key: string): string | null;
  /** Write a raw string value. */
  write(key: string, value: string): void;
  /** Delete a key. */
  remove(key: string): void;
};

/**
 * An in-memory {@link StorageDriver}. Used as the fallback when no
 * persistent driver is available (server rendering, tests).
 */
export function createMemoryDriver(seed: Record<string, string> = {}): StorageDriver {
  const map = new Map<string, string>(Object.entries(seed));
  return {
    read: (key) => map.get(key) ?? null,
    write: (key, value) => { map.set(key, value); },
    remove: (key) => { map.delete(key); },
  };
}

/**
 * A `localStorage`-backed {@link StorageDriver}. Falls back to an in-memory
 * driver when `window` is unavailable or storage access is blocked.
 */
export function createBrowserDriver(): StorageDriver {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return createMemoryDriver();
    const probe = '__bpds_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return {
      read: (key) => window.localStorage.getItem(key),
      write: (key, value) => { window.localStorage.setItem(key, value); },
      remove: (key) => { window.localStorage.removeItem(key); },
    };
  } catch {
    return createMemoryDriver();
  }
}

/** A typed collection of records addressed by `id`. */
export type Repository<T extends Identifiable> = {
  /** Every record in insertion order. */
  list(): T[];
  /** A single record by id, or `undefined`. */
  get(id: string): T | undefined;
  /** Insert a record at the front of the collection. */
  add(record: T): T;
  /** Replace an existing record with the same id. Adds it when absent. */
  update(record: T): T;
  /** Insert or replace, depending on whether the id already exists. */
  upsert(record: T): T;
  /** Delete a record by id. */
  remove(id: string): void;
  /** Replace the entire collection. */
  replaceAll(records: T[]): T[];
};

/**
 * Creates a {@link Repository} over a {@link StorageDriver}.
 *
 * Reads are lazy and always go through the driver, so two repositories
 * created over the same driver and key stay consistent.
 *
 * @param driver where records are persisted.
 * @param key the storage key this collection lives under.
 * @param initial records written on first use when the key is absent.
 */
export function createRepository<T extends Identifiable>(
  driver: StorageDriver,
  key: string,
  initial: T[] = [],
): Repository<T> {
  const load = (): T[] => {
    const raw = driver.read(key);
    if (raw === null) {
      driver.write(key, JSON.stringify(initial));
      return [...initial];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [...initial];
    } catch {
      return [...initial];
    }
  };

  const save = (records: T[]): T[] => {
    driver.write(key, JSON.stringify(records));
    return records;
  };

  return {
    list: () => load(),
    get: (id) => load().find((r) => r.id === id),
    add: (record) => {
      save([record, ...load().filter((r) => r.id !== record.id)]);
      return record;
    },
    update: (record) => {
      const records = load();
      const exists = records.some((r) => r.id === record.id);
      save(exists ? records.map((r) => (r.id === record.id ? record : r)) : [record, ...records]);
      return record;
    },
    upsert: (record) => {
      const records = load();
      const exists = records.some((r) => r.id === record.id);
      save(exists ? records.map((r) => (r.id === record.id ? record : r)) : [record, ...records]);
      return record;
    },
    remove: (id) => { save(load().filter((r) => r.id !== id)); },
    replaceAll: (records) => save([...records]),
  };
}
