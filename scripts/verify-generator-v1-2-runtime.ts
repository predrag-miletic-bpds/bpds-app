import assert from 'node:assert/strict';
import { DRILLS } from '@predrag-miletic/bpds-methodology.drill-catalog';
import { generatePractice } from '../bpds-coach-dashboard-hero-responsive-v1/bpds-methodology/practice-generator/practice-generator';

const equipment = [...new Set(DRILLS.flatMap((drill) => drill.equipment))];
const context = (duration: number) => ({
  trainingType: 'Team' as const,
  playerIds: ['runtime-test-player'],
  ageGroup: 'U12' as const,
  skillLevel: 'Intermediate' as const,
  duration,
  playerCount: 4,
  baskets: 1,
  courtSize: 'Half court',
  equipment,
  primaryFocus: 'Ball Handling',
  secondaryFocus: 'Shooting',
  intensity: 'Medium' as const,
  withDefense: true,
  competitive: true,
  smallSidedGame: true,
});

for (const duration of [75, 90]) {
  const practice = generatePractice(context(duration));
  assert.equal(practice.items.reduce((total, item) => total + item.duration, 0), duration);
  const drills = practice.items.filter((item) => item.kind === 'drill');
  assert.equal(new Set(drills.map((item) => item.drillId)).size, drills.length);
  assert.ok(drills.some((item) => item.drillId === 'wup-001'));
  assert.ok(drills.some((item) => item.drillId?.startsWith('wup-ath-')));
  assert.ok(drills.some((item) => item.drillId?.startsWith('bm-')));
  assert.ok(drills.filter((item) => item.drillId?.startsWith('bm-')).length <= 4);
  assert.equal(drills.some((item) => item.drillId?.startsWith('dfw-')), false);
  assert.equal(practice.items.at(-1)?.phase, 'Competitive Play');
  assert.equal(practice.items.at(-1)?.drillId, duration === 75 ? 'ssg-l3-005' : 'ssg-l3-005');
  assert.ok(practice.items.filter((item) => item.label === 'Water Break').every((item) => item.duration === 4));
  assert.equal(practice.items.filter((item) => item.label === 'Water Break').length, duration === 75 ? 3 : 4);
  assert.ok(practice.items.filter((item) => item.label?.includes('buffer')).every((item) => item.duration <= 4));
  const bodyWrap = drills.find((item) => item.drillId === 'bm-l1-001');
  assert.ok(bodyWrap?.coachPrescription, 'BM-L1-001 keeps its locked age prescription');
  const mainDrills = drills.filter((item) => !['wup-001', 'bm-l1-001'].includes(item.drillId ?? '') && !item.drillId?.startsWith('wup-ath-') && !item.drillId?.startsWith('ssg-'));
  const breaks = practice.items.filter((item) => item.label === 'Water Break');
  const secondBreakIndex = practice.items.indexOf(breaks[1]);
  const mainBeforeSecondBreak = practice.items.slice(0, secondBreakIndex).filter((item) => item.kind === 'drill' && mainDrills.some((main) => main.drillId === item.drillId)).length;
  assert.equal(mainBeforeSecondBreak, 5, 'Break 2 is between exercises 2 and 3 of Main block 2');
  console.log(duration + 'm runtime schedule:', practice.items.map((item) => item.kind === 'drill' ? item.drillId + ':' + item.duration : item.label + ':' + item.duration).join(' | '));
}
console.log('PASS V1.2 runtime regression scenarios');
