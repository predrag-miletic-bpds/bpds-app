/**
 * BPDS immutable execution snapshot V1.
 * Domain-only preparation; NOT wired to production persistence or generator.
 */
export type ExecutionItem = Readonly<{
  slotId: string;
  drillId: string;
  plannedMinutes: number;
  actualMinutes?: number;
}>;
export type ExecutionSnapshot = Readonly<{
  schemaVersion: 1;
  executionId: string;
  practiceId: string;
  completedAt: string;
  teamId?: string;
  playerIds: readonly string[];
  items: readonly ExecutionItem[];
  coachNotes: string;
  readiness: 'unassessed';
}>;
export type SnapshotPractice = {
  id: string;
  teamId?: string;
  playerIds: string[];
  items: Array<{
    id: string;
    kind: string;
    drillId?: string;
    duration: number;
    completed?: boolean;
  }>;
};
export function makeExecutionSnapshot(
  executionId: string,
  practice: SnapshotPractice,
  completedAt: string,
  coachNotes: string,
): ExecutionSnapshot {
  if (!executionId || !practice.id || !Number.isFinite(Date.parse(completedAt))) {
    throw new Error('Invalid execution identity or completion time');
  }
  const items = practice.items
    .filter(item => item.kind === 'drill' && item.completed === true)
    .map(item => {
      if (!item.drillId || !Number.isFinite(item.duration) || item.duration < 0) {
        throw new Error('Completed drill lacks valid identity or duration');
      }
      return Object.freeze({
        slotId: item.id,
        drillId: item.drillId,
        plannedMinutes: item.duration,
      });
    });
  if (!items.length) throw new Error('No verified completed drills');
  if (new Set(items.map(item => item.slotId)).size !== items.length) {
    throw new Error('Duplicate completed slot identity');
  }
  return Object.freeze({
    schemaVersion: 1 as const,
    executionId,
    practiceId: practice.id,
    completedAt,
    teamId: practice.teamId,
    playerIds: Object.freeze([...practice.playerIds]),
    items: Object.freeze(items),
    coachNotes,
    readiness: 'unassessed' as const,
  });
}
