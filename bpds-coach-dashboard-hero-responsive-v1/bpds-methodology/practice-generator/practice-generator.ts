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
import { resolveCoachPrescriptionV1 } from '../practice-prescriptions/coach-prescriptions-v1.js';

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
/**
 * V1.2 methodology generator.
 *
 * The legacy service surface remains unchanged. This planner only changes the
 * generated item architecture: Foundation -> Main Development -> Game
 * Application, with explicit water breaks and a named transition buffer when
 * the locked catalogue cannot exactly tile the requested duration.
 */
function v12BreakCount(duration: number): number {
  if (duration >= 90) return 4;
  if (duration >= 60) return 3;
  return 0;
}
function v12FoundationMinutes(duration: number): number {
  if (duration >= 90) return 18;
  if (duration >= 75) return 15;
  if (duration >= 60) return 12;
  return Math.max(6, Math.round(duration * 0.16));
}
function v12GameMinutes(duration: number): number {
  if (duration >= 90) return 18;
  if (duration >= 75) return 15;
  if (duration >= 60) return 10;
  return 0;
}
function v12IsFoundationDrill(drill: Drill): boolean {
  return drill.moduleCode === 'WUP' || drill.moduleCode === 'BM';
}
function v12IsAthleticDrill(drill: Drill): boolean {
  return drill.moduleCode === 'WUP' && drill.category === 'Movement Preparation';
}
function v12IsBallMastery(drill: Drill): boolean {
  return drill.moduleCode === 'BM';
}
function v12IsMainDrill(drill: Drill): boolean {
  return !v12IsFoundationDrill(drill) &&
    drill.moduleCode !== 'DFW' &&
    drill.moduleCode !== 'SSG' &&
    drill.moduleCode !== 'WUP';
}
function v12Item(
  index: number,
  drill: Drill,
  duration: number,
  phase: Phase,
  ageGroup: string,
): PracticeItem {
  const prescription = resolveCoachPrescriptionV1(drill.id, ageGroup);
  return {
    id: `item-${index}`,
    kind: 'drill',
    drillId: drill.id,
    duration,
    phase,
    ...(prescription ? { coachPrescription: prescription } : {}),
  };
}
function v12Break(index: number, phase: Phase, label = 'Water Break'): PracticeItem {
  return { id: `item-${index}`, kind: 'break', label, duration: 4, phase };
}
function v12Choose(
  pool: readonly Drill[],
  ctx: HistoryAwareGeneratorContext,
  used: ReadonlySet<string>,
  limit: number,
  predicate: (drill: Drill) => boolean,
): Drill[] {
  const target = targetLevelForPhase('Technical Skill Development', ctx.skillLevel);
  return pool
    .filter((drill) => !used.has(drill.id) && predicate(drill))
    .sort((a, b) => {
      const progression = compareProgressionPreference(a, b, ctx, pool);
      return progression || (score(b, ctx, target) - score(a, ctx, target)) || a.id.localeCompare(b.id);
    })
    .slice(0, limit);
}
export function generatePractice(ctx: HistoryAwareGeneratorContext): Practice {
  const eligible = DRILLS
    .filter((drill) => isEligible(drill, ctx))
    .filter((drill) => isDevelopmentStateEligible(drill, ctx));
  const used = new Set<string>();
  const items: PracticeItem[] = [];
  let nextIndex = 1;
  const add = (drill: Drill, duration: number, phase: Phase): void => {
    if (duration <= 0 || used.has(drill.id)) return;
    used.add(drill.id);
    items.push(v12Item(nextIndex++, drill, duration, phase, ctx.ageGroup));
  };
  const addBuffer = (duration: number, phase: Phase): void => {
    if (duration > 0) items.push(v12Break(nextIndex++, phase, 'Coach transition / demonstration buffer'));
  };

  // Foundation is mandatory and always ordered WUP -> Athletic -> BM.
  const foundationTarget = v12FoundationMinutes(ctx.duration);
  const warmupPool = eligible.filter((drill) => drill.moduleCode === 'WUP' && !v12IsAthleticDrill(drill));
  const athleticPool = eligible.filter(v12IsAthleticDrill);
  const ballMasteryPool = eligible.filter(v12IsBallMastery);
  const warm = v12Choose(warmupPool, ctx, used, 1, () => true);
  warm.forEach((drill) => add(drill, Math.min(drill.duration, Math.max(3, Math.round(foundationTarget * 0.35))), 'Warm-Up and Movement Preparation'));
  const athletic = v12Choose(athleticPool, ctx, used, 2, () => true);
  athletic.forEach((drill) => add(drill, Math.min(drill.duration, Math.max(3, Math.round(foundationTarget * 0.30))), 'Individual Skill Activation'));
  const bm = v12Choose(ballMasteryPool, ctx, used, 4, () => true);
  bm.slice(0, 4).forEach((drill) => add(drill, Math.min(drill.duration, Math.max(3, Math.round(foundationTarget * 0.35 / Math.max(1, Math.min(4, bm.length))))), 'Individual Skill Activation'));

  const breakCount = v12BreakCount(ctx.duration);
  const reservedBreakMinutes = breakCount * 4;
  const gamePool = eligible.filter((drill) => drill.moduleCode === 'SSG');
  const game = v12Choose(gamePool, ctx, used, 1, () => true)[0];
  const gameMinutes = game ? v12GameMinutes(ctx.duration) : 0;
  if (game && gameMinutes > 0) add(game, gameMinutes, 'Competitive Play');

  // Main Development is focus-aware, excludes Defensive Footwork from Foundation,
  // and groups no more than three connected drills per block.
  const mainPool = eligible.filter(v12IsMainDrill);
  const primaryCodes = new Set(FOCUS_TO_MODULES[ctx.primaryFocus] ?? []);
  const secondaryCodes = new Set(FOCUS_TO_MODULES[ctx.secondaryFocus] ?? []);
  const mainSorted = mainPool
    .filter((drill) => !used.has(drill.id))
    .sort((a, b) => {
      const af = primaryCodes.has(a.moduleCode) ? 0 : secondaryCodes.has(a.moduleCode) ? 1 : 2;
      const bf = primaryCodes.has(b.moduleCode) ? 0 : secondaryCodes.has(b.moduleCode) ? 1 : 2;
      return af - bf || score(b, ctx, targetLevelForPhase('Technical Skill Development', ctx.skillLevel)) -
        score(a, ctx, targetLevelForPhase('Technical Skill Development', ctx.skillLevel)) || a.id.localeCompare(b.id);
    });
  const targetMain = Math.max(0, ctx.duration - foundationTarget - reservedBreakMinutes - gameMinutes);
  let mainSpent = 0;
  const mainBlocks: Drill[][] = [];
  for (const drill of mainSorted) {
    if (mainSpent + drill.duration > targetMain || used.has(drill.id)) continue;
    let block = mainBlocks[mainBlocks.length - 1];
    if (!block || block.length >= 3) {
      if (mainBlocks.length >= 4) break;
      block = [];
      mainBlocks.push(block);
    }
    block.push(drill);
    used.add(drill.id);
    mainSpent += drill.duration;
  }
  const mainPhase: Phase = 'Technical Skill Development';
  mainBlocks.flat().forEach((drill) => add(drill, drill.duration, mainPhase));

  // Rebuild order into Foundation -> Break 1 -> Main (with Break 2 in block 2)
  // -> later breaks -> Game. The legacy PracticeItem schema is retained.
  const foundationItems = items.filter((item) => item.phase === 'Warm-Up and Movement Preparation' || (item.phase === 'Individual Skill Activation' && item.drillId && (DRILLS.find((d) => d.id === item.drillId)?.moduleCode === 'WUP' || DRILLS.find((d) => d.id === item.drillId)?.moduleCode === 'BM')));
  const gameItems = items.filter((item) => item.phase === 'Competitive Play');
  const mainItems = items.filter((item) => item.phase === mainPhase);
  const ordered: PracticeItem[] = [];
  ordered.push(...foundationItems);
  let breakNumber = 0;
  const pushBreak = (phase: Phase): void => {
    if (breakNumber < breakCount) { breakNumber += 1; ordered.push(v12Break(nextIndex++, phase)); }
  };
  pushBreak('Individual Skill Activation');
  mainItems.forEach((item, index) => {
    ordered.push(item);
    // Break 2 is explicitly inside block 2 only when there are >=3 exercises.
    if (breakNumber === 1 && mainItems.length >= 6 && index === 4) pushBreak(mainPhase);
  });
  while (breakNumber < breakCount) pushBreak(mainPhase);
  ordered.push(...gameItems);

  const scheduled = ordered.reduce((sum, item) => sum + item.duration, 0);
  if (scheduled < ctx.duration) addBuffer(ctx.duration - scheduled, mainPhase);
  if (scheduled > ctx.duration) {
    // Do not shorten a locked drill dose. Remove the optional game allocation first.
    let excess = scheduled - ctx.duration;
    for (let index = ordered.length - 1; index >= 0 && excess > 0; index -= 1) {
      const item = ordered[index];
      if (item.kind === 'drill' && item.phase === 'Competitive Play' && item.duration <= excess) {
        ordered.splice(index, 1); excess -= item.duration;
      }
    }
  }
  const finalItems = ordered.map((item, index) => ({ ...item, id: `item-${index + 1}` }));
  const focusLabel = ctx.primaryFocus === 'Complete Player Development' ? 'Complete Development' : ctx.primaryFocus;
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
    items: finalItems,
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
