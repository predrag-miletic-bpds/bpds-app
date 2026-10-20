import type { StorageDriver } from '@predrag-miletic/bpds-storage.repository';
import { createMemoryDriver } from '@predrag-miletic/bpds-storage.repository';
import type { Migration } from './storage.js';
import { SCHEMA_VERSION, STORAGE_KEYS, applyDefaults, openBpdsStorage } from './storage.js';

type Player = { id: string; fullName: string; active?: boolean };
type Team = { id: string; name: string };
type Practice = { id: string; name: string };
type History = { id: string; notes: string };

const seed = {
  players: [{ id: 'p1', fullName: 'Luka Jovanović' }] as Player[],
  teams: [{ id: 't1', name: 'U16 Blue' }] as Team[],
  practices: [{ id: 'pr1', name: 'Shooting Under Pressure' }] as Practice[],
  history: [{ id: 'h1', notes: 'Great focus' }] as History[],
  recentDrills: ['cod-l3-016'],
};

function open(driver: StorageDriver, migrations: Migration[] = [], defaults = {}) {
  return openBpdsStorage<Player, Team, Practice, History>({ seed, driver, migrations, defaults });
}

it('seeds every collection on a first run', () => {
  const storage = open(createMemoryDriver());
  expect(storage.players.list()).toHaveLength(1);
  expect(storage.practices.list()).toHaveLength(1);
  expect(storage.readRecentDrills()).toEqual(['cod-l3-016']);
  expect(storage.report.seededCollections).toHaveLength(4);
  expect(storage.report.toVersion).toBe(SCHEMA_VERSION);
});

it('preserves coach edits when storage is reopened', () => {
  const driver = createMemoryDriver();
  const first = open(driver);
  first.players.add({ id: 'p2', fullName: 'Ana Kovač' });
  first.players.update({ id: 'p1', fullName: 'Luka J. (renamed)' });
  first.practices.remove('pr1');
  first.writeRecentDrills(['sh-l2-009']);

  const second = open(driver);
  expect(second.players.list().map((p) => p.fullName)).toEqual(['Ana Kovač', 'Luka J. (renamed)']);
  expect(second.report.seededCollections).toEqual([]);
  expect(second.readRecentDrills()).toEqual(['sh-l2-009']);
});

it('never re-seeds a collection the coach deliberately emptied', () => {
  const driver = createMemoryDriver();
  open(driver).practices.remove('pr1');
  expect(open(driver).practices.list()).toEqual([]);
});

it('preserves every record across a schema version upgrade', () => {
  const driver = createMemoryDriver();
  const first = open(driver);
  first.players.add({ id: 'p2', fullName: 'Ana Kovač' });
  first.history.add({ id: 'h2', notes: 'Left hand improving' });
  // Simulate state written by an older build.
  driver.write(STORAGE_KEYS.version, '0');

  const upgraded = open(driver, [{
    from: 0,
    to: SCHEMA_VERSION,
    description: 'tag players as active',
    run: (ctx) => {
      const players = ctx.read<Player>(ctx.keys.players) ?? [];
      ctx.write(ctx.keys.players, players.map((p) => ({ ...p, active: true })));
    },
  }]);

  expect(upgraded.report.fromVersion).toBe(0);
  expect(upgraded.report.toVersion).toBe(SCHEMA_VERSION);
  expect(upgraded.report.migrationsRun).toHaveLength(1);
  expect(upgraded.players.list().map((p) => p.id)).toEqual(['p2', 'p1']);
  expect(upgraded.players.list().every((p) => p.active)).toBe(true);
  expect(upgraded.history.list().map((h) => h.id)).toEqual(['h2', 'h1']);
});

it('backfills missing fields with defaults during an upgrade', () => {
  const driver = createMemoryDriver();
  open(driver);
  driver.write(STORAGE_KEYS.version, '0');
  const upgraded = open(driver, [], { players: { active: true } });
  expect(upgraded.players.get('p1')?.active).toBe(true);
});

it('keeps data and the old version when a migration throws', () => {
  const driver = createMemoryDriver();
  open(driver).players.add({ id: 'p2', fullName: 'Ana Kovač' });
  driver.write(STORAGE_KEYS.version, '0');

  const failed = open(driver, [{
    from: 0, to: SCHEMA_VERSION, description: 'broken step', run: () => { throw new Error('migration boom'); },
  }]);

  expect(failed.report.migrationError).toBe('migration boom');
  expect(failed.report.toVersion).toBe(0);
  expect(driver.read(STORAGE_KEYS.version)).toBe('0');
  expect(failed.players.list()).toHaveLength(2);
});

it('recovers one corrupt collection without resetting the others', () => {
  const driver = createMemoryDriver();
  const first = open(driver);
  first.players.add({ id: 'p2', fullName: 'Ana Kovač' });
  first.history.add({ id: 'h2', notes: 'Left hand improving' });
  driver.write(STORAGE_KEYS.practices, '}{ not json');

  const recovered = open(driver);
  expect(recovered.report.repairedCollections).toEqual([STORAGE_KEYS.practices]);
  expect(recovered.practices.list()).toEqual(seed.practices);
  expect(recovered.players.list()).toHaveLength(2);
  expect(recovered.history.list().map((h) => h.id)).toEqual(['h2', 'h1']);
});

it('adopts unversioned data from a pre-versioning build instead of replacing it', () => {
  const driver = createMemoryDriver();
  driver.write(STORAGE_KEYS.players, JSON.stringify([{ id: 'legacy', fullName: 'Legacy Player' }]));
  const storage = open(driver);
  expect(storage.report.fromVersion).toBe(0);
  expect(storage.players.list().map((p) => p.id)).toEqual(['legacy']);
});

it('fills only the missing fields when applying defaults', () => {
  const rows = [{ id: 'a', active: false }, { id: 'b' }];
  expect(applyDefaults(rows, { active: true })).toEqual([{ id: 'a', active: false }, { id: 'b', active: true }]);
});
