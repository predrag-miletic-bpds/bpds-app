import type { AthleticFocus, Drill } from '@predrag-miletic/bpds-methodology.entities.methodology';
import type { PlayerDevelopmentState } from '@predrag-miletic/bpds-people.entities.people';
import {
  fitsPlayerCount,
  hasEquipment,
} from '@predrag-miletic/bpds-methodology.entities.methodology';
import {
  DRILLS,
  FOCUS_TO_MODULES,
} from '@predrag-miletic/bpds-methodology.drill-catalog';
import {
  getBPDSModuleOrder,
  getModule,
  resolvePracticeModuleCode,
} from '@predrag-miletic/bpds-methodology.modules-catalog';
import type {
  GeneratorContext,
  Practice,
  PracticeItem,
} from '@predrag-miletic/bpds-practices.entities.practice';
import {
  scoreDrillHistoryV1,
  type DrillHistoryUsage,
} from './recent-history-v1-1.js';
import {
  normalizeDrillGeneratorMetadata,
  PROGRESSION_STAGE_ORDER,
} from './generator-engine-v1.js';

/** Read-only guidance supplied only while materializing a coordinated week. */
export type WeeklyProgrammingGuidance = {
  readonly practiceNumber: number;
  readonly priorityModuleCodes: readonly string[];
  readonly preferredDrillIds: readonly string[];
  readonly moduleMinuteTargets: Readonly<Record<string, number>>;
  readonly athleticFocus?: AthleticFocus;
};

/** Optional read-only history and guidance supplied by the practice service. */
export type HistoryAwareGeneratorContext = GeneratorContext & {
  readonly recentHistory?: readonly DrillHistoryUsage[];
  readonly referenceDate?: string;
  readonly playerDevelopmentStates?: readonly PlayerDevelopmentState[];
  readonly weeklyProgramming?: WeeklyProgrammingGuidance;
};
import type { Phase } from '@predrag-miletic/bpds-storage.entities.shared-types';

/** The BPDS methodological progression, in order. */
export const PHASE_ORDER: Phase[] = [
  'Warm-Up and Movement Preparation',
  'Individual Skill Activation',
  'Technical Skill Development',
  'Skill Application',
  'Decision Making',
  'Game Application',
  'Competitive Play',
  'Cool Down',
];

/** Share of total practice time allocated to each methodological phase. */
const PHASE_WEIGHT: Record<Phase, number> = {
  'Warm-Up and Movement Preparation': 0.12,
  'Individual Skill Activation': 0.12,
  'Technical Skill Development': 0.24,
  'Skill Application': 0.2,
  'Decision Making': 0.12,
  'Game Application': 0.08,
  'Competitive Play': 0.08,
  'Cool Down': 0.04,
};

/** Target skill-level mix per coach-facing skill level. */
const LEVEL_MIX: Record<string, [number, number, number]> = {
  Beginner: [0.7, 0.25, 0.05],
  Intermediate: [0.4, 0.45, 0.15],
  Advanced: [0.18, 0.32, 0.5],
  Elite: [0.12, 0.28, 0.6],
};

/**
 * Determine the BPDS block a drill belongs to for practice generation.
 *
 * Classification is driven by the canonical module mapping, including
 * runtime-only practice overrides. Drill level does not change its block.
 */
export function drillPhase(drill: Drill): Phase {
  if (drill.moduleCode === 'WUP') return 'Warm-Up and Movement Preparation';
  if (drill.tags.includes('cool down')) return 'Cool Down';
  if (drill.moduleCode === 'SSG') return 'Competitive Play';

  return (
    getModule(resolvePracticeModuleCode(drill))?.phase ??
    'Technical Skill Development'
  );
}

/**
 * Normalizes selected items into one deterministic BPDS practice structure.
 *
 * The selected drill identities, order within a module, and durations are
 * preserved; only block and module grouping is normalized.
 *
 * @param items selected practice items.
 * @param drills catalog used to resolve runtime practice modules.
 * @returns cloned items ordered by block, then canonical module, then drill.
 */
export function normalizePracticeItems(
  items: readonly PracticeItem[],
  drills: readonly Drill[] = DRILLS
): PracticeItem[] {
  const drillsById = new Map(drills.map((drill) => [drill.id, drill] as const));
  const indexed = items.map((item, index) => {
    const drill =
      item.kind === 'drill' && item.drillId
        ? drillsById.get(item.drillId)
        : undefined;
    const moduleCode = drill ? resolvePracticeModuleCode(drill) : undefined;
    const module = moduleCode ? getModule(moduleCode) : undefined;
    const phase = module?.phase ?? item.phase;
    const phaseIndex = PHASE_ORDER.indexOf(phase);

    return {
      item,
      index,
      drill,
      module,
      moduleOrder: moduleCode
        ? getBPDSModuleOrder(moduleCode)
        : Number.MAX_SAFE_INTEGER,
      phaseOrder: phaseIndex === -1 ? Number.MAX_SAFE_INTEGER : phaseIndex,
    };
  });

  const normalizedDrills = indexed
    .filter((entry) => entry.drill)
    .sort(
      (left, right) =>
        left.phaseOrder - right.phaseOrder ||
        left.moduleOrder - right.moduleOrder ||
        left.index - right.index
    );

  const normalized = normalizedDrills.map(({ item, module }) => ({
    ...item,
    phase: module?.phase ?? item.phase,
  }));
  let insertedNonDrills = 0;

  for (const entry of indexed) {
    if (entry.drill) continue;

    const precedingDrills = indexed
      .slice(0, entry.index)
      .filter((candidate) => candidate.drill).length;
    const insertionIndex = Math.min(
      precedingDrills + insertedNonDrills,
      normalized.length
    );
    const adjacentPhase =
      normalized[insertionIndex - 1]?.phase ??
      normalized[insertionIndex]?.phase ??
      entry.item.phase;

    normalized.splice(insertionIndex, 0, {
      ...entry.item,
      phase: adjacentPhase,
    });
    insertedNonDrills += 1;
  }

  return normalized;
}/**
 * Adds the scheduled water break at a module boundary so selected drills
 * within the same module remain contiguous in the generated structure.
 */
function insertWaterBreakAtModuleBoundary(items: PracticeItem[]): void {
  const drillsById = new Map(DRILLS.map((drill) => [drill.id, drill] as const));
  const moduleCodeAt = (item: PracticeItem): string | undefined => {
    if (item.kind !== 'drill' || !item.drillId) return undefined;
    const drill = drillsById.get(item.drillId);
    return drill ? resolvePracticeModuleCode(drill) : undefined;
  };

  const midpoint = Math.floor(items.length / 2);
  let breakIndex = items.length;

  for (let offset = 0; offset < items.length; offset += 1) {
    const after = midpoint + offset;
    if (
      after > 0 &&
      after < items.length &&
      moduleCodeAt(items[after - 1]) !== moduleCodeAt(items[after])
    ) {
      breakIndex = after;
      break;
    }

    const before = midpoint - offset;
    if (
      before > 0 &&
      before < items.length &&
      moduleCodeAt(items[before - 1]) !== moduleCodeAt(items[before])
    ) {
      breakIndex = before;
      break;
    }
  }

  const phase = items[breakIndex]?.phase ?? items[breakIndex - 1]?.phase;
  if (!phase) return;

  items.splice(breakIndex, 0, {
    id: 'item-break',
    kind: 'break',
    label: 'Water Break',
    duration: 3,
    phase,
  });
}

export function isEligible(drill: Drill, ctx: GeneratorContext): boolean {
  if (drill.generator?.generatorActive === false) return false;
  if (!drill.published) return false;
  if (!drill.suitableAges.includes(ctx.ageGroup)) return false;
  if (!fitsPlayerCount(drill, ctx.playerCount)) return false;
  if (drill.courtArea.length && !drill.courtArea.includes(ctx.courtSize))
    return false;
  if (!hasEquipment(drill, ctx.equipment)) return false;
  if (!ctx.withDefense && drill.withDefense) return false;
  return true;
}

const PHASE6A2_AGES = new Set(['U8', 'U10', 'U12']);
const PHASE6A2_FOCUSES = new Set<AthleticFocus>([
  'Speed / Acceleration',
  'Agility / Balance / Deceleration',
  'Reaction / Coordination',
]);

function phase6A2Focus(ctx: HistoryAwareGeneratorContext): AthleticFocus | undefined {
  const requested = ctx.athleticFocus ?? ctx.weeklyProgramming?.athleticFocus;
  return requested && PHASE6A2_FOCUSES.has(requested) ? requested : undefined;
}

function phase6A2MovementPreparationCandidates(ctx: HistoryAwareGeneratorContext): Drill[] {
  const focus = phase6A2Focus(ctx);
  if (!focus || !PHASE6A2_AGES.has(ctx.ageGroup)) return [];
  return DRILLS.filter((drill) => {
    if (drill.moduleCode !== 'WUP' || drill.category !== 'Movement Preparation') return false;
    if (!drill.published || !drill.suitableAges.includes(ctx.ageGroup)) return false;
    if (!fitsPlayerCount(drill, ctx.playerCount)) return false;
    if (drill.courtArea.length && !drill.courtArea.includes(ctx.courtSize)) return false;
    if (!hasEquipment(drill, ctx.equipment)) return false;
    if (!ctx.withDefense && drill.withDefense) return false;
    return normalizeDrillGeneratorMetadata(drill).athleticFocus === focus;
  });
}
/**
 * Resolves the most specific explicit state that exactly matches a drill.
 *
 * Phase 2B1 supports only exact target codes. Drill state takes precedence
 * over module state, which takes precedence over skill-family state.
 */
function matchingDevelopmentState(
  drill: Drill,
  ctx: HistoryAwareGeneratorContext
): PlayerDevelopmentState | undefined {
  if (ctx.playerIds.length !== 1) return undefined;

  const playerId = ctx.playerIds[0];
  const states = (ctx.playerDevelopmentStates ?? []).filter(
    (state) => state.playerId === playerId
  );
  const drillState = states.find(
    (state) => state.targetType === 'DRILL' && state.targetCode === drill.id
  );
  if (drillState) return drillState;

  const moduleCode = resolvePracticeModuleCode(drill);
  const moduleState = states.find(
    (state) =>
      state.targetType === 'MODULE' && state.targetCode === moduleCode
  );
  if (moduleState) return moduleState;

  const skillFamily = normalizeDrillGeneratorMetadata(drill).skillFamily;
  if (!skillFamily) return undefined;
  return states.find(
    (state) =>
      state.targetType === 'SKILL_FAMILY' &&
      state.targetCode === skillFamily
  );
}

/** NOT_READY is the only Phase 2B1 selection guard. Other states stay eligible. */
export function isDevelopmentStateEligible(
  drill: Drill,
  ctx: HistoryAwareGeneratorContext
): boolean {
  return matchingDevelopmentState(drill, ctx)?.status !== 'NOT_READY';
}

/**
 * Phase 3A preference for one-player generation only.
 *
 * Explicit target status is primary. For a mastered DRILL target, the next
 * available stage in the same existing BPDS skill-family path is preferred,
 * while the mastered drill remains eligible for review.
 */
export function skillFamilyProgressionPreferenceV1(
  drill: Drill,
  ctx: HistoryAwareGeneratorContext,
  eligiblePool: readonly Drill[] = DRILLS
): number {
  if (ctx.playerIds.length !== 1 || !(ctx.playerDevelopmentStates?.length)) {
    return 0;
  }

  const explicitState = matchingDevelopmentState(drill, ctx);
  let preference =
    explicitState?.status === 'NEEDS_CORRECTION'
      ? 60
      : explicitState?.status === 'DEVELOPING'
        ? 42
        : explicitState?.status === 'READY'
          ? 30
          : explicitState?.status === 'MASTERED'
            ? 2
            : 0;

  const playerId = ctx.playerIds[0];
  const candidateMetadata = normalizeDrillGeneratorMetadata(drill);
  const candidateStageIndex = PROGRESSION_STAGE_ORDER.indexOf(
    candidateMetadata.progressionStage
  );
  const masteredDrillStates = (ctx.playerDevelopmentStates ?? []).filter(
    (state) =>
      state.playerId === playerId &&
      state.targetType === 'DRILL' &&
      state.status === 'MASTERED'
  );

  masteredDrillStates.forEach((state) => {
    const masteredDrill = DRILLS.find((candidate) => candidate.id === state.targetCode);
    if (!masteredDrill) return;
    const masteredMetadata = normalizeDrillGeneratorMetadata(masteredDrill);
    if (masteredMetadata.skillFamily !== candidateMetadata.skillFamily) return;

    const masteredStageIndex = PROGRESSION_STAGE_ORDER.indexOf(
      masteredMetadata.progressionStage
    );
    const nextStageIndex = eligiblePool
      .filter(
        (candidate) =>
          normalizeDrillGeneratorMetadata(candidate).skillFamily ===
          candidateMetadata.skillFamily
      )
      .map((candidate) =>
        PROGRESSION_STAGE_ORDER.indexOf(
          normalizeDrillGeneratorMetadata(candidate).progressionStage
        )
      )
      .filter((index) => index > masteredStageIndex)
      .sort((a, b) => a - b)[0];

    if (
      nextStageIndex !== undefined &&
      candidateStageIndex === nextStageIndex
    ) {
      preference = Math.max(preference, 34);
    }
  });

  return preference;
}

function compareProgressionPreference(
  a: Drill,
  b: Drill,
  ctx: HistoryAwareGeneratorContext,
  eligiblePool: readonly Drill[]
): number {
  return (
    skillFamilyProgressionPreferenceV1(b, ctx, eligiblePool) -
    skillFamilyProgressionPreferenceV1(a, ctx, eligiblePool)
  );
}

/** Score how well a drill matches the coach's focus and context. Higher is better. */
function score(
  drill: Drill,
  ctx: HistoryAwareGeneratorContext,
  targetLevel: number
): number {
  let s = 0;
  const primaryModules = FOCUS_TO_MODULES[ctx.primaryFocus] ?? [];
  const secondaryModules = FOCUS_TO_MODULES[ctx.secondaryFocus] ?? [];
  if (primaryModules.includes(drill.moduleCode)) s += 40;
  if (secondaryModules.includes(drill.moduleCode)) s += 18;
  s -= Math.abs(drill.level - targetLevel) * 12;
  if (drill.intensity === ctx.intensity) s += 6;
  if (ctx.trainingType === 'Individual' && drill.grouping === 'Individual')
    s += 8;
  if (ctx.trainingType === 'Team' && drill.grouping !== 'Individual') s += 8;
  if (drill.bpdsOriginal) s += 2;
  const weeklyModuleIndex =
    ctx.weeklyProgramming?.priorityModuleCodes.indexOf(
      resolvePracticeModuleCode(drill)
    ) ?? -1;
  if (weeklyModuleIndex >= 0) {
    s += Math.max(8, 22 - weeklyModuleIndex * 2);
  }
  if (ctx.weeklyProgramming?.preferredDrillIds.includes(drill.id)) s += 12;
  const historyScore = scoreDrillHistoryV1(
    drill.id,
    [...(ctx.recentHistory ?? [])],
    { referenceDate: ctx.referenceDate ?? new Date().toISOString().slice(0, 10) },
  );
  s -=
    historyScore.recentExactDrillPenalty +
    historyScore.consecutiveWeekPenalty -
    historyScore.repeatReasonAdjustment;
  return s;
}

/** Pick the target BPDS level for a phase given the coach's skill mix. */
function targetLevelForPhase(phase: Phase, skillLevel: string): number {
  const mix = LEVEL_MIX[skillLevel] ?? LEVEL_MIX.Intermediate;
  const idx = PHASE_ORDER.indexOf(phase);
  const early = idx <= 2;
  const late = idx >= 5;
  if (early) return mix[0] > 0.35 ? 1 : 2;
  if (late) return mix[2] > 0.3 ? 3 : 2;
  return mix[2] > 0.45 ? 3 : 2;
}

/** Ensure prerequisite drills already appear earlier in the plan when available. */
function respectsPrerequisites(
  drill: Drill,
  chosen: Drill[],
  ctx: HistoryAwareGeneratorContext
): boolean {
  if (!drill.prerequisiteDrills.length) return true;
  // A prerequisite is satisfied if it is already in the plan, or the player level
  // is high enough that the prerequisite skill is assumed mastered.
  if (ctx.skillLevel === 'Advanced' || ctx.skillLevel === 'Elite') return true;
  return drill.prerequisiteDrills.some((prerequisiteId) => {
    if (chosen.some((candidate) => candidate.id === prerequisiteId)) return true;
    const prerequisite = DRILLS.find((candidate) => candidate.id === prerequisiteId);
    return (
      prerequisite !== undefined &&
      matchingDevelopmentState(prerequisite, ctx)?.status === 'MASTERED'
    );
  });
}

/**
 * Generate a methodologically correct BPDS practice from a coach training context.
 * Fills each phase of the BPDS progression in order, respecting age, level,
 * equipment, court, player count and prerequisite relationships.
 */
export function generatePractice(ctx: HistoryAwareGeneratorContext): Practice {
  const pool = DRILLS.filter((d) => isEligible(d, ctx)).filter((d) =>
    isDevelopmentStateEligible(d, ctx)
  );
  const phase6A2WupPool = phase6A2MovementPreparationCandidates(ctx).filter((d) =>
    isDevelopmentStateEligible(d, ctx)
  );
  const chosen: Drill[] = [];
  const items: PracticeItem[] = [];
  const selectedModuleMinutes = (moduleCode: string): number =>
    items.reduce((total, item) => {
      if (!item.drillId) return total;
      const selected = DRILLS.find((candidate) => candidate.id === item.drillId);
      return selected && resolvePracticeModuleCode(selected) === moduleCode
        ? total + item.duration
        : total;
    }, 0);
  const withinWeeklyModuleTarget = (drill: Drill): boolean => {
    const moduleCode = resolvePracticeModuleCode(drill);
    const target = ctx.weeklyProgramming?.moduleMinuteTargets[moduleCode];
    return target === undefined || selectedModuleMinutes(moduleCode) < target;
  };

  const phases = PHASE_ORDER.filter((p) => {
    if (p === 'Competitive Play') return ctx.competitive || ctx.smallSidedGame;
    if (p === 'Game Application') return ctx.duration >= 60;
    if (p === 'Decision Making') return ctx.duration >= 45;
    return true;
  });

  phases.forEach((phase) => {
    const budget = Math.round(ctx.duration * PHASE_WEIGHT[phase]);
    if (budget < 3) return;
    const targetLevel = targetLevelForPhase(phase, ctx.skillLevel);
    const phasePool = phase === 'Warm-Up and Movement Preparation'
      ? Array.from(new Map([...pool, ...phase6A2WupPool].map((drill) => [drill.id, drill])).values())
      : pool;
    const candidates = phasePool
      .filter((d) => drillPhase(d) === phase)
      .filter((d) => !chosen.some((c) => c.id === d.id))
      .filter((d) => respectsPrerequisites(d, chosen, ctx))
      .sort((a, b) => {
        const requestedFocus = phase6A2Focus(ctx);
        if (phase === 'Warm-Up and Movement Preparation' && requestedFocus) {
          const aExact = normalizeDrillGeneratorMetadata(a).athleticFocus === requestedFocus;
          const bExact = normalizeDrillGeneratorMetadata(b).athleticFocus === requestedFocus;
          if (aExact !== bExact) return aExact ? -1 : 1;
        }
        const progressionDelta = compareProgressionPreference(a, b, ctx, pool);
        return progressionDelta !== 0
          ? progressionDelta
          : score(b, ctx, targetLevel) - score(a, ctx, targetLevel);
      });

    let spent = 0;
    candidates.forEach((d) => {
      if (spent >= budget || !withinWeeklyModuleTarget(d)) return;
      const remaining = budget - spent;
      if (remaining < 3) return;
      const dur = Math.min(d.duration, Math.max(4, remaining));
      chosen.push(d);
      items.push({
        id: `item-${items.length + 1}`,
        kind: 'drill',
        drillId: d.id,
        duration: dur,
        phase,
      });
      spent += dur;
    });
  });

  // Keep phase allocation as the first pass. Spend only unused time afterward
  // without changing the selected drills' configured durations or final order.
  const primaryFocusModules =
    ctx.primaryFocus === 'Ball Handling'
      ? ['SBH', 'MBH', 'COD', 'BM']
      : ctx.primaryFocus === 'Change of Direction'
        ? ['SBH', 'MBH', 'COD']
        : FOCUS_TO_MODULES[ctx.primaryFocus] ?? [];
  const secondaryFocusModules = FOCUS_TO_MODULES[ctx.secondaryFocus] ?? [];
  const redistributionPriority = (drill: Drill): number => {
    const primaryIndex = primaryFocusModules.indexOf(drill.moduleCode);
    const weeklyIndex =
      ctx.weeklyProgramming?.priorityModuleCodes.indexOf(
        resolvePracticeModuleCode(drill)
      ) ?? -1;
    if (primaryIndex >= 0) {
      return weeklyIndex >= 0 ? weeklyIndex : 100 + primaryIndex;
    }
    const secondaryIndex = secondaryFocusModules.indexOf(drill.moduleCode);
    if (secondaryIndex >= 0) {
      return 1_000 + (weeklyIndex >= 0 ? weeklyIndex : 100 + secondaryIndex);
    }
    return 2_000 + (weeklyIndex >= 0 ? weeklyIndex : 100);
  };
  const redistributionCandidates = pool
    .filter((drill) => !(phase6A2WupPool.length > 0 && drillPhase(drill) === "Warm-Up and Movement Preparation"))
    .filter((drill) => !chosen.some((current) => current.id === drill.id))
    .sort((a, b) => {
      const aPrerequisitesReady = respectsPrerequisites(a, chosen, ctx);
      const bPrerequisitesReady = respectsPrerequisites(b, chosen, ctx);
      if (aPrerequisitesReady !== bPrerequisitesReady) {
        return aPrerequisitesReady ? -1 : 1;
      }
      const progressionDelta = compareProgressionPreference(a, b, ctx, pool);
      if (progressionDelta !== 0) return progressionDelta;
      const priorityDelta = redistributionPriority(a) - redistributionPriority(b);
      if (priorityDelta !== 0) return priorityDelta;
      const targetA = targetLevelForPhase(drillPhase(a), ctx.skillLevel);
      const targetB = targetLevelForPhase(drillPhase(b), ctx.skillLevel);
      const scoreDelta = score(b, ctx, targetB) - score(a, ctx, targetA);
      return scoreDelta !== 0 ? scoreDelta : a.id.localeCompare(b.id);
    });
  let remainingMinutes = ctx.duration - items.reduce((total, item) => total + item.duration, 0);
  redistributionCandidates.forEach((drill) => {
    if (remainingMinutes <= 5 || drill.duration > remainingMinutes || !respectsPrerequisites(drill, chosen, ctx) || !withinWeeklyModuleTarget(drill)) return;
    chosen.push(drill);
    items.push({ id: 'item-' + (items.length + 1), kind: 'drill', drillId: drill.id, duration: drill.duration, phase: drillPhase(drill) });
    remainingMinutes -= drill.duration;
  });

  // Weekly module targets guide allocation, but a readiness-blocked target can
  // leave its reserved minutes unusable. Fill only that residual budget from
  // the same deterministic, state-eligible candidate order.
  if (ctx.weeklyProgramming && remainingMinutes > 5) {
    redistributionCandidates.forEach((drill) => {
      if (
        remainingMinutes <= 5 ||
        drill.duration > remainingMinutes ||
        chosen.some((current) => current.id === drill.id) ||
        !respectsPrerequisites(drill, chosen, ctx)
      ) return;
      chosen.push(drill);
      items.push({ id: 'item-' + (items.length + 1), kind: 'drill', drillId: drill.id, duration: drill.duration, phase: drillPhase(drill) });
      remainingMinutes -= drill.duration;
    });
  }

  const normalizedItems = normalizePracticeItems(items);

  if (ctx.duration >= 60 && normalizedItems.length > 4) {
    insertWaterBreakAtModuleBoundary(normalizedItems);
  }

  // Reconcile the final rendered duration once, without changing any drill dose.
  // A break may make an otherwise within-budget selection overrun the requested time.
  const plannedMinutes = () => normalizedItems.reduce((total, item) => total + item.duration, 0);
  const currentMinutes = plannedMinutes();
  if (currentMinutes > ctx.duration) {
    const currentDifference = currentMinutes - ctx.duration;
    const trimIndex = normalizedItems.map((item, index) => ({ item, index })).reverse().find(({ item }) => {
      if (item.kind !== 'drill' || item.phase === 'Warm-Up and Movement Preparation') return false;
      const drill = DRILLS.find((candidate) => candidate.id === item.drillId);
      if (drill === undefined || primaryFocusModules.includes(drill.moduleCode)) return false;
      return Math.abs(ctx.duration - (currentMinutes - item.duration)) < currentDifference;
    });
    if (trimIndex) normalizedItems.splice(trimIndex.index, 1);
  }

  const focusLabel =
    ctx.primaryFocus === 'Complete Player Development'
      ? 'Complete Development'
      : ctx.primaryFocus;

  return {
    id: `gen-${Date.now()}`,
    name: `${ctx.ageGroup} ${ctx.skillLevel} ${focusLabel} Practice`,
    date: new Date().toISOString().slice(0, 10),
    playerIds: ctx.playerIds,
    teamId: ctx.teamId,
    ageGroup: ctx.ageGroup,
    skillLevel: ctx.skillLevel,
    duration: ctx.duration,
    primaryFocus: ctx.primaryFocus,
    secondaryFocus: ctx.secondaryFocus,
    equipment: ctx.equipment,
    courtSize: ctx.courtSize,
    objective: buildObjective(ctx),
    items: normalizedItems,
    status: 'Draft',
    lastOpened: new Date().toISOString().slice(0, 10),
  };
}

/** Write the methodological objective sentence for a generated practice. */
function buildObjective(ctx: GeneratorContext): string {
  return `Progress ${ctx.ageGroup} ${ctx.skillLevel.toLowerCase()} players from controlled technical execution of ${ctx.primaryFocus.toLowerCase()} through applied ${ctx.secondaryFocus.toLowerCase()} into game-speed decision making${ctx.competitive ? ' and live competition' : ''}.`;
}

/** A suggested replacement drill with the reason it fits. */
export type Alternative = { drill: Drill; reason: string };

/**
 * Find alternative drills that can replace a drill at a given position
 * without breaking the methodological structure of the practice.
 */
export function findAlternatives(
  current: Drill,
  practice: Practice
): Alternative[] {
  const phase = drillPhase(current);
  const usedIds = practice.items.map((i) => i.drillId);
  return DRILLS.filter(
    (d) => d.id !== current.id && !usedIds.includes(d.id) && d.published && d.generator?.generatorActive !== false
  )
    .filter((d) => d.suitableAges.includes(practice.ageGroup))
    .filter((d) => drillPhase(d) === phase)
    .filter((d) => Math.abs(d.level - current.level) <= 1)
    .filter((d) =>
      d.equipment.every(
        (e) => e === 'No additional equipment' || practice.equipment.includes(e)
      )
    )
    .filter(
      (d) => !d.courtArea.length || d.courtArea.includes(practice.courtSize)
    )
    .slice(0, 6)
    .map((d) => ({
      drill: d,
      reason: buildReason(d, current, phase),
    }));
}

/** Explain why an alternative drill is a valid replacement. */
function buildReason(alt: Drill, current: Drill, phase: Phase): string {
  const parts: string[] = [];
  parts.push(`same ${phase.toLowerCase()} phase`);
  if (alt.moduleCode === current.moduleCode) parts.push('same module');
  else
    parts.push(
      `related module ${getModule(alt.moduleCode)?.name ?? alt.moduleCode}`
    );
  if (alt.level === current.level) parts.push(`same Level ${alt.level}`);
  else parts.push(`Level ${alt.level} instead of ${current.level}`);
  if (Math.abs(alt.duration - current.duration) <= 3)
    parts.push('similar duration');
  if (alt.intensity === current.intensity)
    parts.push(`${alt.intensity.toLowerCase()} intensity match`);
  return `Suitable because of ${parts.join(', ')}.`;
}

/**
 * The BPDS practice generation service.
 *
 * Pages depend on this surface rather than on the functions directly, so the
 * generator can later move behind an aspect or a remote service without any
 * page changing.
 */
export const practiceGenerator = {
  /** Build a methodologically correct practice from a coach training context. */
  generate: generatePractice,
  /** Suggested replacements for a drill, each with the reason it fits. */
  alternatives: findAlternatives,
  /** The methodological phase a drill belongs to. */
  phaseOf: drillPhase,
  /** The eight BPDS phases in methodological order. */
  phases: (): Phase[] => PHASE_ORDER,
  /** Whether a drill is usable in a given training context. */
  isEligible,
};
