import type {
  Drill,
  ProgressionStage,
} from '@predrag-miletic/bpds-methodology.entities.methodology';
import type { SkillLevel } from '@predrag-miletic/bpds-storage.entities.shared-types';
import {
  evaluateDrillWithAgeLevelMatrixV1,
  getAgeLevelProfileV1,
  inferFineSkillFamilyV1,
  type AgeLevelMatrixCandidate,
  type AgeLevelMatrixContext,
} from './age-level-matrix-v1.js';
import {
  normalizeDrillGeneratorMetadata,
  PROGRESSION_STAGE_ORDER,
} from './generator-engine-v1.js';

/**
 * BPDS Correction & Progression Layer v1.1 — Step 2 only.
 *
 * This is an internal, opt-in Engine v1 layer. It has no coach-facing runtime
 * integration and does not persist data to the production database.
 */
export const SKILL_FAMILY_PROGRESSION_VERSION = '1.1.0-step-2';

export type SkillFamilyDevelopmentMode =
  | 'INTRODUCE'
  | 'REINFORCE'
  | 'READY_TO_PROGRESS'
  | 'PROGRESS'
  | 'APPLY'
  | 'REVIEW'
  | 'REGRESS';

export type ProgressionReadinessReason =
  | 'EXPOSURE_THRESHOLD_MET'
  | 'AGE_LEVEL_READY'
  | 'PREREQUISITES_MET'
  | 'AVAILABLE_NEXT_STAGE';

export type ProgressionBlockedReason =
  | 'INSUFFICIENT_EXPOSURE'
  | 'AGE_CEILING'
  | 'LEVEL_CEILING'
  | 'PREREQUISITE_MISSING'
  | 'NO_ELIGIBLE_NEXT_STAGE_DRILL'
  | 'REVIEW_REQUIRED';

export type MeaningfulSkillFamilyExposure = {
  drillId: string;
  stage: ProgressionStage;
  date: string;
  weekId: string;
  practiceId: string;
  practiceNumber: number;
  minutes: number;
  role: string;
  meaningful: boolean;
};

export type SkillFamilyDevelopmentState = {
  skillFamily: string;
  currentStage: ProgressionStage;
  highestStageReached: ProgressionStage;
  stageHistory: ProgressionStage[];
  currentStageMeaningfulExposures: number;
  totalMeaningfulExposures: number;
  recentDrillIds: string[];
  recentPracticeIds: string[];
  recentWeekIds: string[];
  lastExposureDate?: string;
  developmentState: SkillFamilyDevelopmentMode;
  readyForProgression: boolean;
  readinessReasons: ProgressionReadinessReason[];
  progressionBlockedReason?: ProgressionBlockedReason;
  recommendedNextStage?: ProgressionStage;
  meaningfulExposures: MeaningfulSkillFamilyExposure[];
  exposureHistory: MeaningfulSkillFamilyExposure[];
};

export type StageAvailability = {
  stage: ProgressionStage;
  totalDrillCount: number;
  eligibleDrillCount: number;
  eligibleDrillIds: string[];
  ageBlockedDrillIds: string[];
  levelBlockedDrillIds: string[];
  prerequisiteBlockedDrillIds: string[];
  resourceBlockedDrillIds: string[];
};

export type SkillFamilyProgressionPath = {
  skillFamily: string;
  stages: ProgressionStage[];
  availableByStage: Record<ProgressionStage, StageAvailability>;
  eligibleDrillCount: number;
  eligibleDrillIds: string[];
  missingStages: ProgressionStage[];
  progressionPossible: boolean;
};

export type SkillFamilyLibraryGapDiagnostic = {
  skillFamily: string;
  eligibleDrillCount: number;
  eligibleStages: ProgressionStage[];
  missingStages: ProgressionStage[];
  progressionPossible: boolean;
  exactRepeatLikelyFromLibraryShortage: boolean;
  blockedByAge: number;
  blockedByLevel: number;
  blockedByPrerequisite: number;
  blockedByResources: number;
};

export type SkillFamilyProgressionConfig = {
  meaningfulExposureThresholds: Record<ProgressionStage, number | null>;
  minimumMeaningfulMinutes: number;
  foundationAgeAdjustment: number;
  levelOneAdjustment: number;
  levelThreeAdjustment: number;
  skillFamilyContinuityBonus: number;
  progressionStageBonus: number;
  sameStageReinforcementBonus: number;
  practiceRoleFitBonus: number;
};

export const DEFAULT_SKILL_FAMILY_PROGRESSION_CONFIG: SkillFamilyProgressionConfig = {
  meaningfulExposureThresholds: {
    Technique: 2,
    Movement: 2,
    Speed: 2,
    Combination: 1,
    Reaction: 2,
    Defender: 2,
    Game: null,
  },
  minimumMeaningfulMinutes: 2,
  foundationAgeAdjustment: 1,
  levelOneAdjustment: 1,
  levelThreeAdjustment: -1,
  skillFamilyContinuityBonus: 14,
  progressionStageBonus: 30,
  sameStageReinforcementBonus: 18,
  practiceRoleFitBonus: 6,
};

type ProgressionContext = AgeLevelMatrixContext;

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function stageIndex(stage: ProgressionStage): number {
  return PROGRESSION_STAGE_ORDER.indexOf(stage);
}

function emptyStageAvailability(stage: ProgressionStage): StageAvailability {
  return {
    stage,
    totalDrillCount: 0,
    eligibleDrillCount: 0,
    eligibleDrillIds: [],
    ageBlockedDrillIds: [],
    levelBlockedDrillIds: [],
    prerequisiteBlockedDrillIds: [],
    resourceBlockedDrillIds: [],
  };
}

function stageMap(): Record<ProgressionStage, StageAvailability> {
  return Object.fromEntries(
    PROGRESSION_STAGE_ORDER.map((stage) => [stage, emptyStageAvailability(stage)]),
  ) as Record<ProgressionStage, StageAvailability>;
}

function candidateBlockers(candidate: AgeLevelMatrixCandidate): {
  age: boolean;
  level: boolean;
  prerequisite: boolean;
  resources: boolean;
} {
  const exclusionCodes = new Set(candidate.exclusions.map((item) => item.code));
  const matrixCodes = new Set(candidate.matrixExclusions.map((item) => item.code));
  const resourceCodes = new Set([
    'players',
    'baskets',
    'equipment',
    'space',
    'defense',
    'training-format',
  ]);
  return {
    age:
      exclusionCodes.has('age') ||
      matrixCodes.has('unsupported-age-band') ||
      matrixCodes.has('progression-stage'),
    level:
      exclusionCodes.has('difficulty') ||
      matrixCodes.has('age-level-difficulty') ||
      matrixCodes.has('cognitive-load') ||
      matrixCodes.has('contact-level') ||
      matrixCodes.has('combination-complexity') ||
      matrixCodes.has('tactical-complexity') ||
      matrixCodes.has('small-sided-size') ||
      matrixCodes.has('blocked-module'),
    prerequisite:
      exclusionCodes.has('prerequisites') ||
      candidate.selectionData.prerequisiteStatus === 'missing',
    resources: candidate.exclusions.some((item) => resourceCodes.has(item.code)),
  };
}

function progressionContext(context: ProgressionContext): AgeLevelMatrixContext {
  return {
    ...context,
    primaryFocus: context.primaryFocus ?? 'Skill development',
    secondaryFocus: context.secondaryFocus ?? 'Application',
    strictPrerequisites: context.strictPrerequisites ?? true,
  };
}

export function discoverSkillFamilyProgressionPathsV1(
  drills: Drill[],
  context: ProgressionContext,
): Record<string, SkillFamilyProgressionPath> {
  const evaluated = drills.map((drill) => ({
    family: inferFineSkillFamilyV1(drill),
    stage: normalizeDrillGeneratorMetadata(drill).progressionStage,
    candidate: evaluateDrillWithAgeLevelMatrixV1(
      drill,
      progressionContext(context),
    ),
  }));
  const families = unique(evaluated.map((item) => item.family)).sort();
  return Object.fromEntries(
    families.map((family) => {
      const availableByStage = stageMap();
      for (const item of evaluated.filter((entry) => entry.family === family)) {
        const availability = availableByStage[item.stage];
        availability.totalDrillCount += 1;
        if (item.candidate.eligible) {
          availability.eligibleDrillCount += 1;
          availability.eligibleDrillIds.push(item.candidate.drill.id);
          continue;
        }
        const blockers = candidateBlockers(item.candidate);
        if (blockers.age) availability.ageBlockedDrillIds.push(item.candidate.drill.id);
        if (blockers.level) availability.levelBlockedDrillIds.push(item.candidate.drill.id);
        if (blockers.prerequisite) {
          availability.prerequisiteBlockedDrillIds.push(item.candidate.drill.id);
        }
        if (blockers.resources) {
          availability.resourceBlockedDrillIds.push(item.candidate.drill.id);
        }
      }
      const stages = PROGRESSION_STAGE_ORDER.filter(
        (stage) => availableByStage[stage].eligibleDrillCount > 0,
      );
      const eligibleDrillIds = stages.flatMap(
        (stage) => availableByStage[stage].eligibleDrillIds,
      );
      return [
        family,
        {
          skillFamily: family,
          stages,
          availableByStage,
          eligibleDrillCount: eligibleDrillIds.length,
          eligibleDrillIds,
          missingStages: PROGRESSION_STAGE_ORDER.filter(
            (stage) => availableByStage[stage].eligibleDrillCount === 0,
          ),
          progressionPossible: stages.some((stage, index) =>
            stages
              .slice(index + 1)
              .some((later) =>
                isMethodologicallyAppropriateSkip(
                  stage,
                  later,
                  context.chronologicalAge,
                ),
              ),
          ),
        } satisfies SkillFamilyProgressionPath,
      ];
    }),
  );
}

export function buildSkillFamilyLibraryGapDiagnosticsV1(
  paths: Record<string, SkillFamilyProgressionPath>,
): Record<string, SkillFamilyLibraryGapDiagnostic> {
  return Object.fromEntries(
    Object.entries(paths).map(([family, path]) => {
      const availability = Object.values(path.availableByStage);
      return [
        family,
        {
          skillFamily: family,
          eligibleDrillCount: path.eligibleDrillCount,
          eligibleStages: [...path.stages],
          missingStages: [...path.missingStages],
          progressionPossible: path.progressionPossible,
          exactRepeatLikelyFromLibraryShortage:
            path.eligibleDrillCount <= 1 ||
            availability.every((stage) => stage.eligibleDrillCount <= 1),
          blockedByAge: unique(
            availability.flatMap((stage) => stage.ageBlockedDrillIds),
          ).length,
          blockedByLevel: unique(
            availability.flatMap((stage) => stage.levelBlockedDrillIds),
          ).length,
          blockedByPrerequisite: unique(
            availability.flatMap((stage) => stage.prerequisiteBlockedDrillIds),
          ).length,
          blockedByResources: unique(
            availability.flatMap((stage) => stage.resourceBlockedDrillIds),
          ).length,
        } satisfies SkillFamilyLibraryGapDiagnostic,
      ];
    }),
  );
}

export function meaningfulExposureThresholdV1(
  stage: ProgressionStage,
  chronologicalAge: number,
  level: SkillLevel,
  config: SkillFamilyProgressionConfig = DEFAULT_SKILL_FAMILY_PROGRESSION_CONFIG,
): number | null {
  const base = config.meaningfulExposureThresholds[stage];
  if (base === null) return null;
  const ageAdjustment = chronologicalAge <= 9 ? config.foundationAgeAdjustment : 0;
  const levelAdjustment =
    level === 1
      ? config.levelOneAdjustment
      : level === 3
        ? config.levelThreeAdjustment
        : 0;
  return Math.max(1, base + ageAdjustment + levelAdjustment);
}

function isMethodologicallyAppropriateSkip(
  from: ProgressionStage,
  to: ProgressionStage,
  chronologicalAge: number,
): boolean {
  const difference = stageIndex(to) - stageIndex(from);
  if (difference <= 0) return false;
  if (difference === 1) return true;
  if (to === 'Game') {
    return from === 'Defender' || from === 'Reaction' ||
      (chronologicalAge <= 9 && from === 'Movement');
  }
  return difference <= 3;
}

export function nextAvailableProgressionStageV1(
  currentStage: ProgressionStage,
  path: SkillFamilyProgressionPath,
  chronologicalAge: number,
): ProgressionStage | undefined {
  if (currentStage === 'Game') return undefined;
  return path.stages.find(
    (stage) =>
      stageIndex(stage) > stageIndex(currentStage) &&
      isMethodologicallyAppropriateSkip(currentStage, stage, chronologicalAge),
  );
}

function blockedReasonForNextStage(
  currentStage: ProgressionStage,
  path: SkillFamilyProgressionPath,
): ProgressionBlockedReason {
  const later = PROGRESSION_STAGE_ORDER.filter(
    (stage) => stageIndex(stage) > stageIndex(currentStage),
  ).map((stage) => path.availableByStage[stage]);
  if (later.some((stage) => stage.prerequisiteBlockedDrillIds.length > 0)) {
    return 'PREREQUISITE_MISSING';
  }
  if (later.some((stage) => stage.ageBlockedDrillIds.length > 0)) {
    return 'AGE_CEILING';
  }
  if (later.some((stage) => stage.levelBlockedDrillIds.length > 0)) {
    return 'LEVEL_CEILING';
  }
  return 'NO_ELIGIBLE_NEXT_STAGE_DRILL';
}

export type DeriveDevelopmentStateInput = {
  skillFamily: string;
  path: SkillFamilyProgressionPath;
  chronologicalAge: number;
  level: SkillLevel;
  meaningfulExposures?: MeaningfulSkillFamilyExposure[];
  explicitReviewRequired?: boolean;
  prerequisiteStateInsufficient?: boolean;
};

export function deriveSkillFamilyDevelopmentStateV1(
  input: DeriveDevelopmentStateInput,
  config: SkillFamilyProgressionConfig = DEFAULT_SKILL_FAMILY_PROGRESSION_CONFIG,
): SkillFamilyDevelopmentState {
  const exposureHistory = (input.meaningfulExposures ?? [])
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime() ||
        a.practiceId.localeCompare(b.practiceId),
    );
  const exposures = exposureHistory.filter((exposure) => exposure.meaningful);
  const fallbackStage = input.path.stages[0] ?? 'Technique';
  const highestStageReached = exposures.reduce(
    (highest, exposure) =>
      stageIndex(exposure.stage) > stageIndex(highest) ? exposure.stage : highest,
    fallbackStage,
  );
  const latest = exposures.at(-1);
  const currentStage = highestStageReached;
  const currentStageMeaningfulExposures = exposures.filter(
    (exposure) => exposure.stage === currentStage,
  ).length;
  const threshold = meaningfulExposureThresholdV1(
    currentStage,
    input.chronologicalAge,
    input.level,
    config,
  );
  const nextStage = nextAvailableProgressionStageV1(
    currentStage,
    input.path,
    input.chronologicalAge,
  );
  const exposureReady = threshold !== null && currentStageMeaningfulExposures >= threshold;
  const profile = getAgeLevelProfileV1(input.chronologicalAge, input.level);
  const ageLevelReady = Boolean(
    nextStage && profile && profile.stageWeights[nextStage] > 0,
  );
  const readyForProgression = Boolean(
    exposureReady && nextStage && ageLevelReady &&
      !input.explicitReviewRequired && !input.prerequisiteStateInsufficient,
  );
  let developmentState: SkillFamilyDevelopmentMode = exposures.length
    ? 'REINFORCE'
    : 'INTRODUCE';
  if (latest && stageIndex(latest.stage) < stageIndex(highestStageReached)) {
    developmentState = 'REVIEW';
  }
  if (
    exposures.length >= 2 &&
    stageIndex(exposures.at(-1)!.stage) > stageIndex(exposures.at(-2)!.stage)
  ) {
    developmentState = 'PROGRESS';
  }
  if (currentStage === 'Defender' || currentStage === 'Game') {
    developmentState = latest?.stage === currentStage ? 'APPLY' : developmentState;
  }
  if (readyForProgression && developmentState !== 'PROGRESS') {
    developmentState = 'READY_TO_PROGRESS';
  }
  if (input.explicitReviewRequired) developmentState = 'REVIEW';
  if (input.prerequisiteStateInsufficient) developmentState = 'REGRESS';

  let progressionBlockedReason: ProgressionBlockedReason | undefined;
  if (currentStage === 'Game' || input.explicitReviewRequired) {
    progressionBlockedReason = 'REVIEW_REQUIRED';
  } else if (input.prerequisiteStateInsufficient) {
    progressionBlockedReason = 'PREREQUISITE_MISSING';
  } else if (!exposureReady) {
    progressionBlockedReason = 'INSUFFICIENT_EXPOSURE';
  } else if (!nextStage) {
    progressionBlockedReason = blockedReasonForNextStage(currentStage, input.path);
  } else if (!ageLevelReady) {
    progressionBlockedReason = 'AGE_CEILING';
  }

  return {
    skillFamily: input.skillFamily,
    currentStage,
    highestStageReached,
    stageHistory: exposures.map((exposure) => exposure.stage),
    currentStageMeaningfulExposures,
    totalMeaningfulExposures: exposures.length,
    recentDrillIds: unique(
      exposureHistory.slice(-12).map((exposure) => exposure.drillId),
    ),
    recentPracticeIds: unique(
      exposureHistory.slice(-12).map((exposure) => exposure.practiceId),
    ),
    recentWeekIds: unique(
      exposureHistory.slice(-24).map((exposure) => exposure.weekId),
    ),
    lastExposureDate: exposureHistory.at(-1)?.date,
    developmentState,
    readyForProgression,
    readinessReasons: readyForProgression
      ? [
          'EXPOSURE_THRESHOLD_MET',
          'AGE_LEVEL_READY',
          'PREREQUISITES_MET',
          'AVAILABLE_NEXT_STAGE',
        ]
      : [],
    progressionBlockedReason,
    recommendedNextStage: nextStage,
    meaningfulExposures: exposures,
    exposureHistory,
  };
}

export function requestSkillFamilyRegressionV1(
  state: SkillFamilyDevelopmentState,
  evidence: 'PREREQUISITE_STATE_INSUFFICIENT' | 'EXPLICIT_TECHNICAL_REBUILD',
): SkillFamilyDevelopmentState {
  const currentIndex = stageIndex(state.currentStage);
  const regressionStage = PROGRESSION_STAGE_ORDER[Math.max(0, currentIndex - 1)];
  return {
    ...state,
    currentStage: regressionStage,
    developmentState: 'REGRESS',
    readyForProgression: false,
    readinessReasons: [],
    progressionBlockedReason:
      evidence === 'PREREQUISITE_STATE_INSUFFICIENT'
        ? 'PREREQUISITE_MISSING'
        : 'REVIEW_REQUIRED',
    recommendedNextStage: state.highestStageReached,
  };
}

export type MeaningfulExposureEvidence = {
  eligible: boolean;
  stageMatches: boolean;
  minutes: number;
  blockType: string;
  goalMatch: number;
  role: string;
  progressionStage: ProgressionStage;
};

export function isMeaningfulSkillFamilyExposureV1(
  evidence: MeaningfulExposureEvidence,
  config: SkillFamilyProgressionConfig = DEFAULT_SKILL_FAMILY_PROGRESSION_CONFIG,
): boolean {
  if (
    !evidence.eligible ||
    !evidence.stageMatches ||
    evidence.minutes < config.minimumMeaningfulMinutes
  ) {
    return false;
  }
  const directDevelopmentBlock = ['PRIMARY', 'SECONDARY', 'REVIEW'].includes(
    evidence.blockType,
  );
  const contextualApplication =
    ['APPLICATION', 'COMPETITION'].includes(evidence.blockType) &&
    ['Reaction', 'Defender', 'Game'].includes(evidence.progressionStage);
  return (
    evidence.goalMatch > 0 &&
    (directDevelopmentBlock || contextualApplication) &&
    Boolean(evidence.role)
  );
}
