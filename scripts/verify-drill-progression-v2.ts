import assert from 'node:assert/strict';
import { DRILLS } from '../bpds-coach-dashboard-hero-responsive-v1/bpds-methodology/drill-catalog/drill-catalog';
import { compareDrillExecutionProgression, progressionEvidence } from '../bpds-coach-dashboard-hero-responsive-v1/bpds-methodology/practice-generator/drill-progression-matrix-v2';

const byId = new Map(DRILLS.map((d) => [d.id, d]));
const form = byId.get('sh-l1-001');
const free = byId.get('sh-ft-001');
const catchShoot = byId.get('sh-l2-003');
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

const byModule = new Map<string, typeof DRILLS>();
for (const drill of DRILLS) {
  const list = byModule.get(drill.moduleCode) ?? [];
  list.push(drill);
  byModule.set(drill.moduleCode, list);
}
for (const [moduleCode, drills] of byModule) {
  const sorted = [...drills].sort(compareDrillExecutionProgression);
  for (let i = 1; i < sorted.length; i += 1) {
    assert.ok(compareDrillExecutionProgression(sorted[i - 1], sorted[i]) <= 0,
      moduleCode + ': difficulty order must be nondecreasing');
  }
}
console.log('PASS all active modules: deterministic progressive ordering');

import { generatePractice } from '../bpds-coach-dashboard-hero-responsive-v1/bpds-methodology/practice-generator/practice-generator';
const equipment = [...new Set(DRILLS.flatMap((drill) => drill.equipment))];
const base = {
  trainingType: 'Team' as const, playerIds: ['progression-test-player'],
  ageGroup: 'U12' as const, skillLevel: 'Advanced' as const,
  playerCount: 8, baskets: 2, courtSize: 'Half court' as const,
  equipment, primaryFocus: 'Shooting', secondaryFocus: 'Decision Making',
  intensity: 'Medium' as const, withDefense: true,
  competitive: true, smallSidedGame: true,
};
for (const duration of [75, 90]) {
  const practice = generatePractice({ ...base, duration });
  assert.equal(practice.items.reduce((total, item) => total + item.duration, 0), duration);
  const actual = practice.items.filter((item) => item.kind === 'drill').map((item) => byId.get(item.drillId!)).filter((d): d is (typeof DRILLS)[number] => Boolean(d));
  assert.equal(new Set(actual.map((d) => d.id)).size, actual.length);
  for (const [moduleCode] of byModule) {
    const inModule = actual.filter((d) => d.moduleCode === moduleCode);
    for (let i = 1; i < inModule.length; i += 1) {
      assert.ok(compareDrillExecutionProgression(inModule[i - 1], inModule[i]) <= 0,
        moduleCode + ': generator reversed execution progression across blocks');
    }
  }
  const shooting = actual.filter((d) => d.moduleCode === 'SH').map((d) => d.id);
  const trio = ['sh-l1-001', 'sh-ft-001', 'sh-l2-003'].filter((id) => shooting.includes(id));
  assert.deepEqual(shooting.filter((id) => trio.includes(id)), trio);
  assert.equal(practice.items.filter((item) => item.label === 'Water Break').length, duration === 90 ? 4 : 3);
  assert.equal(practice.items.at(-1)?.phase, 'Competitive Play');
  console.log('Progression ' + duration + 'm:', practice.items.map((item) => item.drillId ?? item.label).join(' > '));
}
console.log('PASS runtime U12 Advanced Shooting / Decision Making 75m and 90m');
