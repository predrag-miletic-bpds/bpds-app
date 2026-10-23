import assert from 'node:assert/strict';
import { DRILLS } from '../bpds-coach-dashboard-hero-responsive-v1/bpds-methodology/drill-catalog/drill-catalog';
import { compareDrillExecutionProgression, progressionEvidence } from '../bpds-coach-dashboard-hero-responsive-v1/bpds-methodology/practice-generator/drill-progression-matrix-v2';

const byId = new Map(DRILLS.map((d) => [d.id, d]));
const form = DRILLS.find((d) => /form shooting.*one.hand/i.test(d.name));
const free = DRILLS.find((d) => /pressure free.throw/i.test(d.name));
const catchShoot = DRILLS.find((d) => /catch.and.shoot.*pass/i.test(d.name));
assert.ok(form && free && catchShoot, 'The approved shooting trio must exist in the active catalog');
assert.equal(form.moduleCode, free.moduleCode);
assert.equal(free.moduleCode, catchShoot.moduleCode);
const ordered = [catchShoot, free, form].sort(compareDrillExecutionProgression);
assert.deepEqual(ordered.map((d) => d.id), [form.id, free.id, catchShoot.id],
  'Coach-approved Shooting order: form, pressure FT, catch-and-shoot');
const evidence = DRILLS.map(progressionEvidence);
assert.equal(evidence.length, DRILLS.length);
assert.equal(new Set(evidence.map((x) => x.drillId)).size, DRILLS.length);
const counts = new Map<string, { total: number; review: number }>();
for (const e of evidence) {
  const row = counts.get(e.moduleCode) ?? { total: 0, review: 0 };
  row.total += 1;
  if (e.needsReview) row.review += 1;
  counts.set(e.moduleCode, row);
}
console.log('Active drill catalog audit:', JSON.stringify([...counts].sort()));
console.log('Manual review needed:', evidence.filter((e) => e.needsReview).length, '/', evidence.length);
console.log('PASS progression evidence and approved Shooting trio');
