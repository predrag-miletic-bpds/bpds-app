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
