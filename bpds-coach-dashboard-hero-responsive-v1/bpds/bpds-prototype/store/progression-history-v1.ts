/**
 * BPDS Progression History V1 — read-only, fail-closed adapter.
 *
 * No generator activation, no mutations, no inferred mastery. Only completed
 * items from an explicitly completed practice can count as exposures.
 * Historical summary rows alone do not prove which drill was executed.
 */
export type CompletedHistoryRow = {
  id: string;
  practiceId?: string;
  teamId?: string;
  playerIds?: string[];
  date: string;
  completedDrills: number;
};
export type PracticeForHistory = {
  id: string;
  teamId?: string;
  playerIds?: string[];
  items: Array<{ id: string; drillId?: string; completed?: boolean }>;
};
export type VerifiedExposure = {
  historyId: string;
  practiceId: string;
  drillId: string;
  date: string;
  teamId?: string;
  playerIds: string[];
};
export type ProgressionHistorySnapshot = {
  exposures: VerifiedExposure[];
  unresolvedHistoryIds: string[];
  distinctDrills: number;
  last21Days: VerifiedExposure[];
};
export function buildProgressionHistory(
  history: readonly CompletedHistoryRow[],
  practices: readonly PracticeForHistory[],
  now: Date = new Date(),
): ProgressionHistorySnapshot {
  const byId = new Map(practices.map(p => [p.id, p]));
  const exposures: VerifiedExposure[] = [];
  const unresolvedHistoryIds: string[] = [];
  const seen = new Set<string>();
  const cutoff = now.getTime() - 21 * 86400000;
  for (const entry of history) {
    const practice = entry.practiceId ? byId.get(entry.practiceId) : undefined;
    if (!practice || !Number.isFinite(Date.parse(entry.date))) {
      unresolvedHistoryIds.push(entry.id);
      continue;
    }
    // Legacy history may contain a 0%-complete session; never credit it.
    if (entry.completedDrills <= 0) continue;
    const executed = practice.items.filter(item => item.completed === true && typeof item.drillId === 'string' && item.drillId.length > 0);
    if (!executed.length) {
      unresolvedHistoryIds.push(entry.id);
      continue;
    }
    for (const item of executed) {
      const key = entry.id + ':' + item.id;
      if (seen.has(key)) continue;
      seen.add(key);
      exposures.push({
        historyId: entry.id, practiceId: practice.id, drillId: item.drillId!,
        date: entry.date, teamId: entry.teamId ?? practice.teamId,
        playerIds: entry.playerIds ?? practice.playerIds ?? [],
      });
    }
  }
  return {
    exposures,
    unresolvedHistoryIds,
    distinctDrills: new Set(exposures.map(e => e.drillId)).size,
    last21Days: exposures.filter(e => {
      const time = Date.parse(e.date);
      return time >= cutoff && time <= now.getTime();
    }),
  };
}
