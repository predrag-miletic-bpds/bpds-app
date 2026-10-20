export const RECENT_HISTORY_LAYER_VERSION = '1.1.0-step-1';

export type RepeatReason =
  | 'FOUNDATION_REPETITION'
  | 'TECHNICAL_CORRECTION'
  | 'ASSESSMENT'
  | 'WEAK_SIDE'
  | 'COACH_LOCK'
  | 'LIMITED_CANDIDATE_POOL'
  | 'METHODOLOGICAL_REVIEW';

export type DrillHistoryUsage = {
  drillId: string;
  usedAt: string;
  date?: string;
  weekId?: string;
  practiceId?: string;
  completed?: boolean;
  successful?: boolean;
  skillFamily?: string;
  repeatReason?: RepeatReason;
};

export type RecentHistoryRelationship =
  | 'SAME_PRACTICE'
  | 'PREVIOUS_PRACTICE'
  | 'SAME_WEEK'
  | 'PREVIOUS_WEEK'
  | 'TWO_WEEKS_AGO'
  | 'THREE_PLUS_WEEKS_AGO'
  | 'NEVER_USED';

export type RecentHistoryContext = {
  referenceDate: string;
  currentWeekId?: string;
  currentPracticeId?: string;
  previousPracticeId?: string;
};

export type RecentDrillHistory = {
  drillId: string;
  entries: DrillHistoryUsage[];
  lastUsedDate: string | null;
  daysSinceLastUse: number | null;
  usesLast7Days: number;
  usesLast14Days: number;
  usesLast21Days: number;
  usesLast30Days: number;
  consecutiveWeeksUsed: number;
  relationship: RecentHistoryRelationship;
  repeatReason?: RepeatReason;
};

export type ExactDrillRecencyPenalties = {
  days0To7: number;
  days8To14: number;
  days15To21: number;
  days22To30: number;
};

export type ConsecutiveWeekPenalties = {
  twoWeeks: number;
  threeWeeks: number;
  fourOrMoreWeeks: number;
};

export type RepeatReasonPenaltyMultipliers = Record<RepeatReason, number>;

export type RecentHistoryConfig = {
  primaryWindowDays: 21;
  reportingWindows: readonly [7, 14, 21, 30];
  exactDrillRecencyPenalties: ExactDrillRecencyPenalties;
  consecutiveWeekPenalties: ConsecutiveWeekPenalties;
  repeatReasonPenaltyMultipliers: RepeatReasonPenaltyMultipliers;
};

export type RecentHistoryScore = {
  history: RecentDrillHistory;
  recentExactDrillPenalty: number;
  consecutiveWeekPenalty: number;
  repeatReasonAdjustment: number;
  repeatReason?: RepeatReason;
};

export const DEFAULT_RECENT_HISTORY_CONFIG: RecentHistoryConfig = {
  primaryWindowDays: 21,
  reportingWindows: [7, 14, 21, 30],
  exactDrillRecencyPenalties: {
    days0To7: 48,
    days8To14: 32,
    days15To21: 18,
    days22To30: 8,
  },
  consecutiveWeekPenalties: {
    twoWeeks: 12,
    threeWeeks: 24,
    fourOrMoreWeeks: 40,
  },
  repeatReasonPenaltyMultipliers: {
    FOUNDATION_REPETITION: 0.45,
    TECHNICAL_CORRECTION: 0.25,
    ASSESSMENT: 0.1,
    WEAK_SIDE: 0.4,
    COACH_LOCK: 0,
    LIMITED_CANDIDATE_POOL: 0.25,
    METHODOLOGICAL_REVIEW: 0.5,
  },
};

export function resolveRecentHistoryConfigV1(
  override?: Partial<RecentHistoryConfig>,
): RecentHistoryConfig {
  return {
    ...DEFAULT_RECENT_HISTORY_CONFIG,
    ...override,
    exactDrillRecencyPenalties: {
      ...DEFAULT_RECENT_HISTORY_CONFIG.exactDrillRecencyPenalties,
      ...override?.exactDrillRecencyPenalties,
    },
    consecutiveWeekPenalties: {
      ...DEFAULT_RECENT_HISTORY_CONFIG.consecutiveWeekPenalties,
      ...override?.consecutiveWeekPenalties,
    },
    repeatReasonPenaltyMultipliers: {
      ...DEFAULT_RECENT_HISTORY_CONFIG.repeatReasonPenaltyMultipliers,
      ...override?.repeatReasonPenaltyMultipliers,
    },
  };
}

function usageDate(usage: DrillHistoryUsage): string {
  return usage.date ?? usage.usedAt;
}

function timestamp(value: string): number | null {
  const result = new Date(value).getTime();
  return Number.isFinite(result) ? result : null;
}

function daysSince(value: string, referenceDate: string): number | null {
  const used = timestamp(value);
  const reference = timestamp(referenceDate);
  if (used === null || reference === null || used > reference) return null;
  return Math.floor((reference - used) / 86_400_000);
}

function utcWeekStart(value: string): number | null {
  const parsed = timestamp(value);
  if (parsed === null) return null;
  const date = new Date(parsed);
  const day = date.getUTCDay() || 7;
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.getTime();
}

function weekOffset(value: string, referenceDate: string): number | null {
  const usedWeek = utcWeekStart(value);
  const referenceWeek = utcWeekStart(referenceDate);
  if (usedWeek === null || referenceWeek === null || usedWeek > referenceWeek) {
    return null;
  }
  return Math.floor((referenceWeek - usedWeek) / (7 * 86_400_000));
}

function projectedConsecutiveWeeks(
  entries: DrillHistoryUsage[],
  referenceDate: string,
): number {
  const offsets = new Set(
    entries
      .map((entry) => weekOffset(usageDate(entry), referenceDate))
      .filter((offset): offset is number => offset !== null),
  );
  if (!offsets.size) return 1;

  let consecutive = 1;
  let offset = offsets.has(0) ? 0 : 1;
  if (offsets.has(0)) consecutive = 0;
  while (offsets.has(offset)) {
    consecutive += 1;
    offset += 1;
  }
  return Math.max(1, consecutive);
}

function relationshipFor(
  entry: DrillHistoryUsage | undefined,
  context: RecentHistoryContext,
): RecentHistoryRelationship {
  if (!entry) return 'NEVER_USED';
  if (
    context.currentPracticeId &&
    entry.practiceId === context.currentPracticeId
  ) {
    return 'SAME_PRACTICE';
  }
  if (
    context.previousPracticeId &&
    entry.practiceId === context.previousPracticeId
  ) {
    return 'PREVIOUS_PRACTICE';
  }
  const offset = weekOffset(usageDate(entry), context.referenceDate);
  if (
    (context.currentWeekId && entry.weekId === context.currentWeekId) ||
    offset === 0
  ) {
    return 'SAME_WEEK';
  }
  if (offset === 1) return 'PREVIOUS_WEEK';
  if (offset === 2) return 'TWO_WEEKS_AGO';
  return 'THREE_PLUS_WEEKS_AGO';
}

export function summarizeDrillHistoryV1(
  drillId: string,
  usages: DrillHistoryUsage[],
  context: RecentHistoryContext,
  repeatReason?: RepeatReason,
): RecentDrillHistory {
  const entries = usages
    .filter((usage) => usage.drillId === drillId)
    .filter((usage) => daysSince(usageDate(usage), context.referenceDate) !== null)
    .sort((a, b) => {
      const aTime = timestamp(usageDate(a)) ?? 0;
      const bTime = timestamp(usageDate(b)) ?? 0;
      return bTime - aTime;
    });
  const latest = entries[0];
  const lastUsedDate = latest ? usageDate(latest) : null;
  const days = lastUsedDate
    ? daysSince(lastUsedDate, context.referenceDate)
    : null;
  const useCount = (windowDays: number) =>
    entries.filter((entry) => {
      const age = daysSince(usageDate(entry), context.referenceDate);
      return age !== null && age <= windowDays;
    }).length;

  return {
    drillId,
    entries,
    lastUsedDate,
    daysSinceLastUse: days,
    usesLast7Days: useCount(7),
    usesLast14Days: useCount(14),
    usesLast21Days: useCount(21),
    usesLast30Days: useCount(30),
    consecutiveWeeksUsed: projectedConsecutiveWeeks(
      entries,
      context.referenceDate,
    ),
    relationship: relationshipFor(latest, context),
    repeatReason,
  };
}

export function exactDrillRecencyPenaltyV1(
  daysSinceLastUse: number | null,
  config: RecentHistoryConfig = DEFAULT_RECENT_HISTORY_CONFIG,
): number {
  if (daysSinceLastUse === null || daysSinceLastUse > 30) return 0;
  if (daysSinceLastUse <= 7) return config.exactDrillRecencyPenalties.days0To7;
  if (daysSinceLastUse <= 14) return config.exactDrillRecencyPenalties.days8To14;
  if (daysSinceLastUse <= 21) return config.exactDrillRecencyPenalties.days15To21;
  return config.exactDrillRecencyPenalties.days22To30;
}

export function consecutiveWeekPenaltyV1(
  consecutiveWeeksUsed: number,
  config: RecentHistoryConfig = DEFAULT_RECENT_HISTORY_CONFIG,
): number {
  if (consecutiveWeeksUsed >= 4) {
    return config.consecutiveWeekPenalties.fourOrMoreWeeks;
  }
  if (consecutiveWeeksUsed === 3) {
    return config.consecutiveWeekPenalties.threeWeeks;
  }
  if (consecutiveWeeksUsed === 2) {
    return config.consecutiveWeekPenalties.twoWeeks;
  }
  return 0;
}

export function repeatReasonAdjustmentV1(
  repeatReason: RepeatReason | undefined,
  recentExactDrillPenalty: number,
  consecutiveWeekPenalty: number,
  config: RecentHistoryConfig = DEFAULT_RECENT_HISTORY_CONFIG,
): number {
  if (!repeatReason) return 0;
  const totalPenalty = recentExactDrillPenalty + consecutiveWeekPenalty;
  const multiplier = config.repeatReasonPenaltyMultipliers[repeatReason];
  return Math.round(totalPenalty * (1 - multiplier) * 100) / 100;
}

export function scoreDrillHistoryV1(
  drillId: string,
  usages: DrillHistoryUsage[],
  context: RecentHistoryContext,
  repeatReason?: RepeatReason,
  configOverride?: Partial<RecentHistoryConfig>,
): RecentHistoryScore {
  const config = resolveRecentHistoryConfigV1(configOverride);
  const history = summarizeDrillHistoryV1(
    drillId,
    usages,
    context,
    repeatReason,
  );
  const recentExactDrillPenalty = exactDrillRecencyPenaltyV1(
    history.daysSinceLastUse,
    config,
  );
  const consecutiveWeekPenalty = consecutiveWeekPenaltyV1(
    history.consecutiveWeeksUsed,
    config,
  );
  const repeatReasonAdjustment = repeatReasonAdjustmentV1(
    repeatReason,
    recentExactDrillPenalty,
    consecutiveWeekPenalty,
    config,
  );
  return {
    history,
    recentExactDrillPenalty,
    consecutiveWeekPenalty,
    repeatReasonAdjustment,
    repeatReason,
  };
}
