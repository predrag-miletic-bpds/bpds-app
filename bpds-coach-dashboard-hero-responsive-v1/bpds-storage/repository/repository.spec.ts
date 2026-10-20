import { createMemoryDriver, createRepository } from './repository.js';

type Row = { id: string; name: string };

function repo(initial: Row[] = []) {
  return createRepository<Row>(createMemoryDriver(), 'rows', initial);
}

it('seeds the initial records on first read', () => {
  expect(repo([{ id: 'a', name: 'A' }]).list()).toHaveLength(1);
});

it('adds records to the front of the collection', () => {
  const r = repo([{ id: 'a', name: 'A' }]);
  r.add({ id: 'b', name: 'B' });
  expect(r.list().map((x) => x.id)).toEqual(['b', 'a']);
});

it('updates an existing record in place', () => {
  const r = repo([{ id: 'a', name: 'A' }]);
  r.update({ id: 'a', name: 'Renamed' });
  expect(r.get('a')?.name).toBe('Renamed');
  expect(r.list()).toHaveLength(1);
});

it('removes a record by id', () => {
  const r = repo([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]);
  r.remove('a');
  expect(r.list().map((x) => x.id)).toEqual(['b']);
});

it('falls back to the initial records when the stored value is corrupt', () => {
  const driver = createMemoryDriver({ rows: 'not json' });
  expect(createRepository<Row>(driver, 'rows', [{ id: 'a', name: 'A' }]).list()).toHaveLength(1);
});
