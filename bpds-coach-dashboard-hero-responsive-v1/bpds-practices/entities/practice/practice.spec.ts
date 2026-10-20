import type { Practice } from './practice.js';
import { drillCount, phaseBreakdown, practiceDuration, toHistoryEntry } from './practice.js';

const practice = {
  id: 'pr-1',
  name: 'Shooting Under Pressure',
  date: '2025-01-10',
  playerIds: ['p1', 'p2'],
  teamId: 't1',
  primaryFocus: 'Shooting',
  duration: 35,
  items: [
    { id: 'i1', kind: 'drill', drillId: 'wup-l1-001', duration: 10, phase: 'Warm-Up and Movement Preparation' },
    { id: 'i2', kind: 'drill', drillId: 'sh-l2-009', duration: 20, phase: 'Technical Skill Development' },
    { id: 'i3', kind: 'break', label: 'Water break', duration: 5, phase: 'Cool Down' },
  ],
} as Practice;

it('sums the total planned duration including breaks', () => {
  expect(practiceDuration(practice)).toBe(35);
});

it('counts only drills, not breaks', () => {
  expect(drillCount(practice)).toBe(2);
});

it('breaks the timeline down by methodological phase', () => {
  expect(phaseBreakdown(practice)['Technical Skill Development']).toBe(20);
});

it('builds a history entry from a completed practice', () => {
  const entry = toHistoryEntry(practice, 'Great focus', 2, 'h-1', '2025-01-10');
  expect(entry).toMatchObject({
    id: 'h-1', practiceName: 'Shooting Under Pressure', duration: 35, completedDrills: 2, totalDrills: 2, notes: 'Great focus',
  });
});
