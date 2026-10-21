/* Run: node --test scripts/test-execution-snapshot-v1.cjs */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../bpds-coach-dashboard-hero-responsive-v1/bpds/bpds-prototype/store/execution-snapshot-v1.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const mod = { exports: {} };
vm.runInNewContext(js, { module: mod, exports: mod.exports, Date, Set, Object, Error, Number }, { filename: 'execution-snapshot-v1.js' });
const { makeExecutionSnapshot } = mod.exports;
const base = () => ({ id: 'p1', teamId: 't1', playerIds: ['a'], items: [
  { id: 'i1', kind: 'drill', drillId: 'bm-001', duration: 2, completed: true },
  { id: 'i2', kind: 'drill', drillId: 'bm-002', duration: 3, completed: false },
  { id: 'i3', kind: 'break', duration: 1, completed: true },
] });
const run = (p = base(), id = 'e1') => makeExecutionSnapshot(id, p, '2026-10-21T12:00:00Z', 'coach notes');
test('records only verified drill execution', () => { const x = run(); assert.equal(x.items.length, 1); assert.equal(x.items[0].drillId, 'bm-001'); });
test('does not infer skill mastery', () => assert.equal(run().readiness, 'unassessed'));
test('keeps immutable independent snapshot', () => { const p = base(); const x = run(p); p.items[0].drillId = 'changed'; p.playerIds.push('b'); assert.equal(x.items[0].drillId, 'bm-001'); assert.equal(x.playerIds.length, 1); assert.equal(Object.isFrozen(x), true); });
test('rejects empty execution', () => { const p = base(); p.items[0].completed = false; assert.throws(() => run(p)); });
test('rejects missing canonical drill identity', () => { const p = base(); delete p.items[0].drillId; assert.throws(() => run(p)); });
test('rejects duplicate slot identities', () => { const p = base(); p.items.push({ ...p.items[0] }); assert.throws(() => run(p)); });
test('rejects invalid timestamp', () => assert.throws(() => makeExecutionSnapshot('e1', base(), 'bad', '')));
test('rejects invalid duration', () => { const p = base(); p.items[0].duration = -1; assert.throws(() => run(p)); });
