import { getSupabaseClient } from '@predrag-miletic/bpds-storage.supabase';
import type { ExecutionSnapshot } from './execution-snapshot-v1.js';

/**
 * Append-only persistence. Unique (coach_id, history_id) prevents duplicate
 * writes for the same completion event. Never upsert an immutable snapshot.
 * The caller must provide an authenticated coach and persisted history ID.
 */
export async function saveExecutionSnapshotV1(
  coachId: string,
  historyId: string,
  snapshot: ExecutionSnapshot,
): Promise<'inserted' | 'already_exists'> {
  if (!coachId || !historyId || !snapshot.executionId || !snapshot.items.length) {
    throw new Error('Incomplete execution snapshot identity');
  }
  const db = getSupabaseClient();
  const { error } = await db.from('practice_execution_snapshots').insert({
    coach_id: coachId,
    history_id: historyId,
    execution_id: snapshot.executionId,
    practice_id: snapshot.practiceId,
    completed_at: snapshot.completedAt,
    payload: snapshot,
  });
  if (!error) return 'inserted';
  // PostgreSQL unique violation: verify same immutable event before accepting.
  if (error.code === '23505') {
    const { data, error: lookupError } = await db
      .from('practice_execution_snapshots')
      .select('execution_id, practice_id')
      .eq('coach_id', coachId)
      .eq('history_id', historyId)
      .maybeSingle();
    if (!lookupError && data?.execution_id === snapshot.executionId && data.practice_id === snapshot.practiceId) {
      return 'already_exists';
    }
  }
  throw new Error('Execution snapshot could not be saved: ' + error.message);
}

/** Read-only, owner-scoped retrieval. Invalid payloads are not trusted. */
export type StoredExecutionSnapshotV1 = {
  historyId: string;
  snapshot: ExecutionSnapshot;
};
export async function loadExecutionSnapshotsV1(coachId: string): Promise<StoredExecutionSnapshotV1[]> {
  if (!coachId) return [];
  const { data, error } = await getSupabaseClient()
    .from('practice_execution_snapshots')
    .select('history_id, execution_id, practice_id, payload')
    .eq('coach_id', coachId)
    .order('completed_at', { ascending: false })
    .limit(1000);
  if (error) throw new Error('Could not load execution snapshots: ' + error.message);
  return (data ?? []).flatMap(row => {
    const p = row.payload as Partial<ExecutionSnapshot> | null;
    if (!p || p.schemaVersion !== 1 || p.readiness !== 'unassessed'
      || p.executionId !== row.execution_id || p.practiceId !== row.practice_id
      || !Array.isArray(p.items) || !p.items.length
      || !p.items.every(i => typeof i.drillId === 'string' && !!i.drillId && typeof i.slotId === 'string' && !!i.slotId)
      || typeof p.completedAt !== 'string' || !Number.isFinite(Date.parse(p.completedAt))
      || !Array.isArray(p.playerIds)) return [];
    return [{ historyId: row.history_id as string, snapshot: p as ExecutionSnapshot }];
  });
}
