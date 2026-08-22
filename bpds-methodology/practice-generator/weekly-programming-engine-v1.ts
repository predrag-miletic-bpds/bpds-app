import type {
  Drill,
  ProgressionStage,
} from '@predrag-miletic/bpds-methodology.entities.methodology';
import type { SkillLevel } from '@predrag-miletic/bpds-storage.entities.shared-types';
import {
  PROGRESSION_STAGE_ORDER,
  type DrillUsage,
} from './generator-engine-v1.js';
import {
  evaluateDrillWithAgeLevelMatrixV1,
  inferFineSkillFamilyV1,
  type AgeLevelMatrixCandidate,
  type AgeLevelMatrixContext,
} from './age-level-matrix-v1.js';

export const WEEKLY_PROGRAMMING_ENGINE_VERSION = '1.0.0';

export type PracticeRole =
  | 'INTRODUCE'
  | 'DEVELOP'
  | 'REINFORCE'
  | 'PROGRESS'
  | 'APPLY'
  | 'REVIEW'
  | 'COMPETE';

export type WeeklyLoad = 'LOW' | 'NORMAL' | 'NORMAL-HIGH' | 'HIGH';
export type WeeklyIntensity = 'LOW' | 'NORMAL' | 'NORMAL-HIGH';
export type ExposureState =
  | 'introduced'
  | 'reinforced'
  | 'progressed'
  | 'applied'
  | 'liveApplied';
export type WeeklyProgressionStage =
  | 'INTRODUCE'
  | 'REINFORCE'
  | 'PROGRESS'
  | 'APPLY'
  | 'COMPETE';
export type WeeklyAgeBand = 'U8-9' | 'U10-11' | 'U12-13';
export type WeeklyDuration = 30 | 45 | 60 | 75 | 90 | 120;
export type WeeklyFrequency = 1 | 2 | 3 | 4 | 5 | 6;
export type WeeklyFocusPreset = '60/20/20' | '50/30/20' | '40/30/30' | 'AUTO';
export type WeeklyBlockType =
  | 'ATHLETIC'
  | 'PRIMARY'
  | 'SECONDARY'
  | 'REVIEW'
  | 'APPLICATION'
  | 'COMPETITION';
export type ExposurePriority = 'HIGH' | 'MODERATE-HIGH' | 'MODERATE' | 'LOW' | 'MAINTENANCE';

export type WeeklyQualityFlag =
  | 'TOO_REPETITIVE'
  | 'MISSING_PRIMARY_EXPOSURE'
  | 'MISSING_GAME_TRANSFER'
  | 'PREREQUISITE_VIOLATION'
  | 'AGE_COMPLEXITY_TOO_HIGH'
  | 'LEVEL_COMPLEXITY_TOO_HIGH'
  | 'ATHLETIC_IMBALANCE'
  | 'TOO_MUCH_ISOLATED_WORK'
  | 'INSUFFICIENT_DECISION_WORK'
  | 'EXCESSIVE_WAIT_TIME'
  | 'DURATION_MISMATCH';

export type WeeklyFocusWeights = {
  primary: number;
  secondary: number;
  maintenanceApplication: number;
};

export type WeeklyModuleExposureTarget = {
  module: string;
  priority: ExposurePriority;
  targetExposures: number;
  minimumMinutes: number;
  maximumMinutes: number;
};

export type WeeklySkillFamilyTarget = {
  skillFamily: string;
  emphasis: 'PRIMARY' | 'SECONDARY' | 'MAINTENANCE' | 'APPLICATION';
  targetExposures: number;
};

export type SsgConstraint = {
  goal: string;
  format: '1v1' | '2v1' | '2v2' | '3v2' | '3v3' | '4v4' | '5v5';
  rules: string[];
  coachingIntent: string;
};

export type OrganizationSuggestion = {
  format: 'STATIONS' | 'PARTNERS' | 'SMALL_GROUPS' | 'WHOLE_GROUP';
  groups: number;
  playersPerGroup: number;
  workSeconds: number;
  transitionSeconds: number;
  activePlayerRatio: number;
  waitingRisk: 'LOW' | 'MODERATE' | 'HIGH';
  note: string;
};

export type WeeklyCandidateReasonCode =
  | 'exact-previous-practice'
  | 'exact-earlier-this-week'
  | 'logical-family-progression'
  | 'same-family-same-stage'
  | 'weekly-goal-match'
  | 'weekly-module-need'
  | 'game-transfer'
  | 'waiting-risk';

export type WeeklyCandidateReason = {
  code: WeeklyCandidateReasonCode;
  label: string;
  points: number;
};

export type WeeklyCandidate = AgeLevelMatrixCandidate & {
  weeklyScore: number;
  weeklyReasons: WeeklyCandidateReason[];
  skillFamily: string;
  progressionStage: ProgressionStage;
};

export type WeeklyPracticeBlock = {
  id: string;
  type: WeeklyBlockType;
  focus: string;
  duration: number;
  targetDrills: number;
  exposureState: ExposureState;
  drills: WeeklyCandidate[];
  ssgConstraint?: SsgConstraint;
  organization: OrganizationSuggestion;
};

export type SkillFamilyExposure = {
  skillFamily: string;
  states: ExposureState[];
  practiceNumbers: number[];
  stageHistory: ProgressionStage[];
  minutes: number;
  drillIds: string[];
};

export type DrillExposure = {
  drillId: string;
  skillFamily: string;
  progressionStage: ProgressionStage;
  state: ExposureState;
  practiceNumber: number;
  minutes: number;
};

export type WeeklyPracticeMemory = {
  practiceNumber: number;
  drillIds: string[];
  skillFamilies: string[];
  progressionStages: ProgressionStage[];
  moduleMinutes: Record<string, number>;
  skillFamilyMinutes: Record<string, number>;
  primaryGoal: string;
  secondaryGoal: string;
  reviewGoal: string;
  athleticStimulus: string;
  decisionSituations: string[];
  ssgTypes: string[];
};

export type WeeklyPracticePlan = {
  practiceNumber: number;
  roles: PracticeRole[];
  primaryGoal: string;
  secondaryGoal: string;
  reviewGoal: string;
  athleticGoal: string;
  applicationGoal: string;
  intensity: WeeklyIntensity;
  plannedDuration: WeeklyDuration;
  weeklyConnection: string[];
  previousPracticeContext: WeeklyPracticeMemory[];
  ssgConstraints: SsgConstraint[];
  blocks: WeeklyPracticeBlock[];
  internalExplanation: string[];
};

export type WeeklyCoherenceScore = {
  SkillContinuity: number;
  ProgressionQuality: number;
  DrillVariety: number;
  GameTransfer: number;
  AthleticBalance: number;
  AgeAppropriateness: number;
  LevelAppropriateness: number;
  total: number;
};

export type WeekValidationIssue = {
  flag: WeeklyQualityFlag;
  practiceNumber?: number;
  blockId?: string;
  message: string;
  targetedRegeneration: 'BLOCK' | 'PRACTICE' | 'WEEK';
};

export type WeekValidationResult = {
  valid: boolean;
  flags: WeeklyQualityFlag[];
  issues: WeekValidationIssue[];
};

export type WeeklyDevelopmentPlan = {
  engineVersion: typeof WEEKLY_PROGRAMMING_ENGINE_VERSION;
  activeInCoachApp: false;
  weekId: string;
  ageBand: WeeklyAgeBand;
  bpdsLevel: SkillLevel;
  practicesPerWeek: WeeklyFrequency;
  practiceDuration: WeeklyDuration;
  weeklyPrimaryGoals: string[];
  weeklySecondaryGoals: string[];
  weeklyReviewGoals: string[];
  athleticRotation: string[];
  skillFamiliesIntroduced: string[];
  skillFamiliesReinforced: string[];
  skillFamiliesProgressed: string[];
  skillFamiliesApplied: string[];
  moduleExposureTargets: Record<string, WeeklyModuleExposureTarget>;
  skillFamilyExposureTargets: Record<string, WeeklySkillFamilyTarget>;
  recentDrillIds: string[];
  recentSkillFamilies: string[];
  weeklyLoad: WeeklyLoad;
  weeklyProgressionStage: WeeklyProgressionStage;
  focusWeights: WeeklyFocusWeights;
  practicePlans: WeeklyPracticePlan[];
  practiceMemory: WeeklyPracticeMemory[];
  drillExposures: DrillExposure[];
  skillFamilyExposures: Record<string, SkillFamilyExposure>;
  rollingThreeWeekContext: {
    weekIds: string[];
    drillIds: string[];
    skillFamilies: string[];
  };
  coherenceScore: WeeklyCoherenceScore;
  validation: WeekValidationResult;
  internalWeeklySummary: string[];
};

export type WeeklyProgrammingInput = Omit<
  AgeLevelMatrixContext,
  'duration' | 'practicesPerWeek' | 'currentTrainingDay'
> & {
  weekId?: string;
  practicesPerWeek: WeeklyFrequency;
  practiceDuration: WeeklyDuration;
  currentPracticeNumber?: number;
  weeklyLoad?: WeeklyLoad;
  focusPreset?: WeeklyFocusPreset;
  manualPrimaryGoals?: string[];
  manualSecondaryGoals?: string[];
  manualReviewGoals?: string[];
  recentSkillFamilies?: string[];
  previousWeeks?: WeeklyDevelopmentPlan[];
};

export type WeeklyProgrammingConfig = {
  exactPreviousPracticePenalty: number;
  exactEarlierWeekPenalty: number;
  logicalFamilyProgressionBonus: number;
  sameFamilySameStagePenalty: number;
  weeklyGoalMatchBonus: number;
  moduleNeedBonus: number;
  gameTransferBonus: number;
  excessiveWaitingPenalty: number;
};

export const DEFAULT_WEEKLY_PROGRAMMING_CONFIG: WeeklyProgrammingConfig = {
  exactPreviousPracticePenalty: 28,
  exactEarlierWeekPenalty: 16,
  logicalFamilyProgressionBonus: 20,
  sameFamilySameStagePenalty: 7,
  weeklyGoalMatchBonus: 14,
  moduleNeedBonus: 9,
  gameTransferBonus: 12,
  excessiveWaitingPenalty: 14,
};

const THREE_DAY_ROLES: PracticeRole[][] = [
  ['INTRODUCE', 'DEVELOP'],
  ['REINFORCE', 'PROGRESS'],
  ['APPLY', 'COMPETE', 'REVIEW'],
];

const ROLE_ARCHITECTURE: Record<WeeklyFrequency, PracticeRole[][]> = {
  1: [['INTRODUCE', 'REINFORCE', 'APPLY']],
  2: [
    ['INTRODUCE', 'DEVELOP'],
    ['REINFORCE', 'APPLY', 'COMPETE'],
  ],
  3: THREE_DAY_ROLES,
  4: [
    ['INTRODUCE', 'DEVELOP'],
    ['REINFORCE'],
    ['PROGRESS'],
    ['APPLY', 'COMPETE'],
  ],
  5: [
    ['INTRODUCE', 'DEVELOP'],
    ['REINFORCE'],
    ['PROGRESS'],
    ['APPLY'],
    ['COMPETE', 'REVIEW'],
  ],
  6: [
    ['INTRODUCE', 'DEVELOP'],
    ['REINFORCE'],
    ['PROGRESS'],
    ['REINFORCE', 'APPLY'],
    ['APPLY'],
    ['COMPETE', 'REVIEW'],
  ],
};

const THREE_DAY_ATHLETIC = [
  'Speed / Acceleration',
  'Agility / Deceleration / Balance / Coordination',
  'Reaction / Coordination / Quickness',
];

const PRIMARY_ROTATION = [
  'Ball Handling / Moving Ball Handling / Change of Direction',
  'Passing / Shooting',
  'Decision Making / 1v1 / Team Transfer',
];

const SECONDARY_ROTATION = [
  'Finishing',
  'Ball Handling review in movement',
  'Shooting / Finishing',
];

const APPLICATION_ROTATION = [
  '1v1 or 2v1 advantage',
  '2v1, 2v2 or 3v3 connected game',
  '1v1, 2v2, 3v3 or selected 4v4 competition',
];

const MODULE_GROUPS: Record<WeeklyAgeBand, Record<ExposurePriority, string[]>> = {
  'U8-9': {
    HIGH: ['MOV', 'COORD', 'BM', 'BH', 'PAS', 'SH', 'FIN', 'SSG'],
    'MODERATE-HIGH': [],
    MODERATE: ['MBH', 'FW', 'COD', '1V1'],
    LOW: ['COM', 'TT'],
    MAINTENANCE: [],
  },
  'U10-11': {
    HIGH: ['MOV', 'COORD', 'ATH', 'BH', 'MBH', 'PAS', 'SH', 'FIN', '1V1', 'SSG'],
    'MODERATE-HIGH': [],
    MODERATE: ['COD', 'FW', 'TT', 'COM'],
    LOW: [],
    MAINTENANCE: ['BM'],
  },
  'U12-13': {
    HIGH: ['ATH', 'MBH', 'COD', 'PAS', 'SH', 'FIN', '1V1', 'DM', 'SSG'],
    'MODERATE-HIGH': ['COM', 'FW', 'TT'],
    MODERATE: [],
    LOW: [],
    MAINTENANCE: ['BM', 'SBH'],
  },
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function ageBandFor(age: number): WeeklyAgeBand {
  if (age <= 9) return 'U8-9';
  if (age <= 11) return 'U10-11';
  return 'U12-13';
}

function stageIndex(stage: ProgressionStage): number {
  return PROGRESSION_STAGE_ORDER.indexOf(stage);
}

function progressionStageForPractice(
  practiceNumber: number,
  frequency: WeeklyFrequency,
): WeeklyProgressionStage {
  if (frequency === 1) return 'APPLY';
  const ratio = (practiceNumber - 1) / Math.max(1, frequency - 1);
  if (ratio === 0) return 'INTRODUCE';
  if (ratio <= 0.3) return 'REINFORCE';
  if (ratio <= 0.55) return 'PROGRESS';
  if (ratio <= 0.8) return 'APPLY';
  return 'COMPETE';
}

export function resolvePracticeRolesV1(
  frequency: WeeklyFrequency,
): PracticeRole[][] {
  return ROLE_ARCHITECTURE[frequency].map((roles) => [...roles]);
}

export function resolveFocusWeightsV1(
  preset: WeeklyFocusPreset = 'AUTO',
  duration: WeeklyDuration = 90,
): WeeklyFocusWeights {
  if (preset === '60/20/20') {
    return { primary: 60, secondary: 20, maintenanceApplication: 20 };
  }
  if (preset === '50/30/20') {
    return { primary: 50, secondary: 30, maintenanceApplication: 20 };
  }
  if (preset === '40/30/30') {
    return { primary: 40, secondary: 30, maintenanceApplication: 30 };
  }
  if (duration <= 45) {
    return { primary: 60, secondary: 15, maintenanceApplication: 25 };
  }
  if (duration <= 75) {
    return { primary: 50, secondary: 25, maintenanceApplication: 25 };
  }
  return { primary: 50, secondary: 20, maintenanceApplication: 30 };
}

export function resolveIntensityPatternV1(
  frequency: WeeklyFrequency,
  load: WeeklyLoad = 'NORMAL',
): WeeklyIntensity[] {
  if (frequency === 1) return ['NORMAL-HIGH'];
  if (frequency === 2) return ['NORMAL', 'NORMAL-HIGH'];
  if (frequency === 3) return ['NORMAL-HIGH', 'NORMAL', 'NORMAL-HIGH'];

  const base: WeeklyIntensity[] = Array.from(
    { length: frequency },
    (_, index) => (index % 3 === 2 ? 'NORMAL-HIGH' : 'NORMAL'),
  );
  if (frequency === 6) {
    base[1] = 'LOW';
    base[4] = load === 'HIGH' ? 'NORMAL' : 'LOW';
  }
  if (load === 'LOW') {
    return base.map((intensity, index) =>
      index % 2 === 1 || intensity === 'LOW' ? 'LOW' : 'NORMAL',
    );
  }
  return base;
}

export function resolveAthleticRotationForWeekV1(
  frequency: WeeklyFrequency,
): string[] {
  const extended = [
    ...THREE_DAY_ATHLETIC,
    'Balance / Landing / Mobility',
    'Reaction / Perception',
    'Speed technique / Low volume',
  ];
  return Array.from({ length: frequency }, (_, index) => extended[index % extended.length]);
}

export function resolveModuleExposureTargetsV1(
  ageBand: WeeklyAgeBand,
  level: SkillLevel,
  frequency: WeeklyFrequency,
  duration: WeeklyDuration,
): Record<string, WeeklyModuleExposureTarget> {
  const targets: Record<string, WeeklyModuleExposureTarget> = {};
  const minuteFactor = duration / 90;
  const frequencyFactor = frequency / 3;
  const priorityValues: Record<ExposurePriority, [number, number, number]> = {
    HIGH: [Math.max(1, Math.round(frequencyFactor * 2)), 6, 30],
    'MODERATE-HIGH': [Math.max(1, Math.round(frequencyFactor * 1.5)), 5, 24],
    MODERATE: [Math.max(1, Math.round(frequencyFactor)), 4, 18],
    LOW: [frequency >= 3 ? 1 : 0, 0, 10],
    MAINTENANCE: [frequency >= 2 ? 1 : 0, 2, 12],
  };

  for (const [priority, modules] of Object.entries(MODULE_GROUPS[ageBand]) as [
    ExposurePriority,
    string[],
  ][]) {
    for (const module of modules) {
      const [targetExposures, minimumMinutes, maximumMinutes] = priorityValues[priority];
      const levelBoost =
        level === 3 && ['COM', 'TT', 'DM', '1V1'].includes(module) ? 1 : 0;
      targets[module] = {
        module,
        priority,
        targetExposures: targetExposures + levelBoost,
        minimumMinutes: Math.round(minimumMinutes * minuteFactor),
        maximumMinutes: Math.max(
          Math.round(maximumMinutes * minuteFactor),
          Math.round(minimumMinutes * minuteFactor),
        ),
      };
    }
  }
  return targets;
}

function rotateGoal(goals: string[] | undefined, index: number, fallback: string): string {
  if (!goals?.length) return fallback;
  return goals[index % goals.length];
}

function resolveDayGoals(
  input: WeeklyProgrammingInput,
  practiceNumber: number,
): {
  primary: string;
  secondary: string;
  review: string;
  application: string;
} {
  const index = practiceNumber - 1;
  const rotationIndex = index % 3;
  const primary = rotateGoal(
    input.manualPrimaryGoals,
    index,
    PRIMARY_ROTATION[rotationIndex],
  );
  const secondary = rotateGoal(
    input.manualSecondaryGoals,
    index,
    SECONDARY_ROTATION[rotationIndex],
  );
  const defaultReview =
    practiceNumber === 1
      ? 'Prerequisite technique and movement quality'
      : practiceNumber === 2
        ? PRIMARY_ROTATION[0]
        : PRIMARY_ROTATION[(rotationIndex + 2) % 3];
  const review = rotateGoal(input.manualReviewGoals, index, defaultReview);
  return {
    primary,
    secondary,
    review,
    application: APPLICATION_ROTATION[rotationIndex],
  };
}

function allocateDurations(
  duration: WeeklyDuration,
  practiceNumber: number,
  frequency: WeeklyFrequency,
): Record<WeeklyBlockType, number> {
  let weights: Record<WeeklyBlockType, number> =
    duration <= 45
      ? {
          ATHLETIC: 16,
          PRIMARY: 42,
          SECONDARY: 10,
          REVIEW: 12,
          APPLICATION: 20,
          COMPETITION: 0,
        }
      : {
          ATHLETIC: 14,
          PRIMARY: 32,
          SECONDARY: 16,
          REVIEW: 10,
          APPLICATION: 19,
          COMPETITION: 9,
        };

  if (practiceNumber === frequency && frequency > 1) {
    weights = {
      ATHLETIC: 13,
      PRIMARY: 26,
      SECONDARY: 13,
      REVIEW: 12,
      APPLICATION: 22,
      COMPETITION: 14,
    };
  }

  const keys = Object.keys(weights) as WeeklyBlockType[];
  const exact = keys.map((key) => ({
    key,
    value: (duration * weights[key]) / 100,
  }));
  const result = {} as Record<WeeklyBlockType, number>;
  for (const item of exact) result[item.key] = Math.floor(item.value);
  let remaining = duration - Object.values(result).reduce((sum, value) => sum + value, 0);
  exact
    .sort((a, b) => b.value - Math.floor(b.value) - (a.value - Math.floor(a.value)))
    .forEach((item) => {
      if (remaining > 0) {
        result[item.key] += 1;
        remaining -= 1;
      }
    });
  return result;
}

function exposureStateFor(
  blockType: WeeklyBlockType,
  roles: PracticeRole[],
): ExposureState {
  if (blockType === 'COMPETITION') return 'liveApplied';
  if (blockType === 'APPLICATION') {
    return roles.includes('COMPETE') ? 'liveApplied' : 'applied';
  }
  if (blockType === 'REVIEW') return 'reinforced';
  if (roles.includes('PROGRESS')) return 'progressed';
  if (roles.includes('REINFORCE')) return 'reinforced';
  return 'introduced';
}

function drillTargetForBlock(
  blockType: WeeklyBlockType,
  duration: number,
  ageBand: WeeklyAgeBand,
): number {
  if (duration === 0) return 0;
  const technicalMinutes =
    ageBand === 'U8-9' ? 2.5 : ageBand === 'U10-11' ? 3 : 4;
  const liveMinutes = ageBand === 'U8-9' ? 5 : 6;
  const divisor =
    blockType === 'APPLICATION' || blockType === 'COMPETITION'
      ? liveMinutes
      : technicalMinutes;
  const cap =
    blockType === 'PRIMARY' ? 6 : blockType === 'SECONDARY' || blockType === 'REVIEW' ? 4 : 3;
  return clamp(Math.round(duration / divisor), 1, cap);
}

function inferSsgFormat(
  ageBand: WeeklyAgeBand,
  level: SkillLevel,
  practiceNumber: number,
  frequency: WeeklyFrequency,
): SsgConstraint['format'] {
  const last = practiceNumber === frequency;
  if (ageBand === 'U8-9') {
    return last && level >= 2 ? '2v2' : practiceNumber === 1 ? '1v1' : '2v1';
  }
  if (ageBand === 'U10-11') {
    return last ? '3v3' : practiceNumber === 1 ? '2v1' : '2v2';
  }
  if (last && level === 3) return '4v4';
  return practiceNumber === 1 ? '2v2' : '3v3';
}

export function resolveSsgConstraintV1(
  goal: string,
  ageBand: WeeklyAgeBand,
  level: SkillLevel,
  practiceNumber: number,
  frequency: WeeklyFrequency,
): SsgConstraint {
  const normalized = goal.toLowerCase();
  const format = inferSsgFormat(ageBand, level, practiceNumber, frequency);
  if (normalized.includes('pass')) {
    return {
      goal,
      format,
      rules: ['No dribble or maximum 1-2 dribbles', 'Reward the extra pass'],
      coachingIntent: 'Create passing angles and decisions before speed.',
    };
  }
  if (normalized.includes('shoot')) {
    return {
      goal,
      format,
      rules: ['Paint touch before kick-out', 'Catch ready', 'Live closeout'],
      coachingIntent: 'Protect shot quality before distance or volume.',
    };
  }
  if (normalized.includes('finish')) {
    return {
      goal,
      format,
      rules: ['Start with an advantage', 'Attack the drive lane', 'Use 2v1 when possible'],
      coachingIntent: 'Transfer finishing technique to advantage recognition.',
    };
  }
  if (
    normalized.includes('handling') ||
    normalized.includes('dribbl') ||
    normalized.includes('change of direction')
  ) {
    return {
      goal,
      format,
      rules: ['Designated attacking space', 'Limited dribbles', 'Reward change of pace'],
      coachingIntent: 'Connect control and change of direction to a live defender.',
    };
  }
  if (normalized.includes('team') || normalized.includes('decision')) {
    return {
      goal,
      format,
      rules: ['Maximum two seconds on the catch', 'Read advantage before action'],
      coachingIntent: 'Improve perception, spacing and fast decisions.',
    };
  }
  return {
    goal,
    format,
    rules: ['Score only after a coached action', 'Short rounds with feedback'],
    coachingIntent: 'Reinforce the weekly learning target through play.',
  };
}

export function resolveOrganizationSuggestionV1(
  playerCount: number,
  targetDrills: number,
  workSeconds = 40,
): OrganizationSuggestion {
  if (playerCount <= 2) {
    return {
      format: 'PARTNERS',
      groups: 1,
      playersPerGroup: Math.max(1, playerCount),
      workSeconds,
      transitionSeconds: 20,
      activePlayerRatio: 1,
      waitingRisk: 'LOW',
      note: 'Alternate repetitions, sides or hands without elimination lines.',
    };
  }
  const groups = clamp(Math.min(targetDrills || 1, Math.ceil(playerCount / 3)), 1, 6);
  const playersPerGroup = Math.ceil(playerCount / groups);
  const activePlayerRatio = clamp(3 / playersPerGroup, 0.25, 1);
  const waitingRisk =
    activePlayerRatio >= 0.75 ? 'LOW' : activePlayerRatio >= 0.5 ? 'MODERATE' : 'HIGH';
  return {
    format: groups > 1 ? 'STATIONS' : 'SMALL_GROUPS',
    groups,
    playersPerGroup,
    workSeconds,
    transitionSeconds: 20,
    activePlayerRatio,
    waitingRisk,
    note:
      groups > 1
        ? groups + ' stations; use parallel starts and short transitions.'
        : 'Use multiple active lines or partner repetitions.',
  };
}

function focusForBlock(
  type: WeeklyBlockType,
  goals: ReturnType<typeof resolveDayGoals>,
  athleticGoal: string,
): string {
  if (type === 'ATHLETIC') return athleticGoal;
  if (type === 'PRIMARY') return goals.primary;
  if (type === 'SECONDARY') return goals.secondary;
  if (type === 'REVIEW') return goals.review;
  if (type === 'APPLICATION') return goals.application;
  return goals.primary + ' competition';
}

function createPracticeSkeleton(
  input: WeeklyProgrammingInput,
  practiceNumber: number,
  roles: PracticeRole[],
  athleticGoal: string,
  intensity: WeeklyIntensity,
): WeeklyPracticePlan {
  const goals = resolveDayGoals(input, practiceNumber);
  const durations = allocateDurations(
    input.practiceDuration,
    practiceNumber,
    input.practicesPerWeek,
  );
  const ageBand = ageBandFor(input.chronologicalAge);
  const ssg = resolveSsgConstraintV1(
    goals.primary,
    ageBand,
    input.bpdsLevel ?? 1,
    practiceNumber,
    input.practicesPerWeek,
  );
  const playerCount = Math.max(1, input.playerCount ?? 12);
  const types: WeeklyBlockType[] = [
    'ATHLETIC',
    'PRIMARY',
    'SECONDARY',
    'REVIEW',
    'APPLICATION',
    'COMPETITION',
  ];

  const blocks = types
    .filter((type) => durations[type] > 0)
    .map((type) => {
      const targetDrills = drillTargetForBlock(type, durations[type], ageBand);
      return {
        id: 'p' + practiceNumber + '-' + type.toLowerCase(),
        type,
        focus: focusForBlock(type, goals, athleticGoal),
        duration: durations[type],
        targetDrills,
        exposureState: exposureStateFor(type, roles),
        drills: [],
        ssgConstraint:
          type === 'APPLICATION' || type === 'COMPETITION' ? ssg : undefined,
        organization: resolveOrganizationSuggestionV1(playerCount, targetDrills),
      } satisfies WeeklyPracticeBlock;
    });

  const weeklyConnection =
    practiceNumber === 1
      ? ['Introduces the technical and movement references used later this week.']
      : [
          'Uses prior practice memory before choosing drills.',
          roles.includes('COMPETE')
            ? 'Transfers the weekly primary goal to constrained competition.'
            : 'Progresses a known family without defaulting to the same drill.',
        ];

  return {
    practiceNumber,
    roles,
    primaryGoal: goals.primary,
    secondaryGoal: goals.secondary,
    reviewGoal: goals.review,
    athleticGoal,
    applicationGoal: goals.application,
    intensity,
    plannedDuration: input.practiceDuration,
    weeklyConnection,
    previousPracticeContext: [],
    ssgConstraints: [ssg],
    blocks,
    internalExplanation: [
      'Primary, secondary and review goals are separated.',
      'Pure speed work is placed before extended live play.',
      'Application constraints are connected to the primary goal.',
    ],
  };
}

function rollingContext(
  previousWeeks: WeeklyDevelopmentPlan[] | undefined,
): WeeklyDevelopmentPlan['rollingThreeWeekContext'] {
  const weeks = (previousWeeks ?? []).slice(-3);
  return {
    weekIds: weeks.map((week) => week.weekId),
    drillIds: unique(weeks.flatMap((week) => week.drillExposures.map((item) => item.drillId))),
    skillFamilies: unique(
      weeks.flatMap((week) => Object.keys(week.skillFamilyExposures)),
    ),
  };
}

function emptyCoherenceScore(): WeeklyCoherenceScore {
  return {
    SkillContinuity: 100,
    ProgressionQuality: 100,
    DrillVariety: 100,
    GameTransfer: 100,
    AthleticBalance: 100,
    AgeAppropriateness: 100,
    LevelAppropriateness: 100,
    total: 100,
  };
}

export function buildWeeklyDevelopmentPlanV1(
  input: WeeklyProgrammingInput,
): WeeklyDevelopmentPlan {
  const ageBand = ageBandFor(input.chronologicalAge);
  const roles = resolvePracticeRolesV1(input.practicesPerWeek);
  const intensities = resolveIntensityPatternV1(
    input.practicesPerWeek,
    input.weeklyLoad,
  );
  const athleticRotation = resolveAthleticRotationForWeekV1(input.practicesPerWeek);
  const practicePlans = roles.map((practiceRoles, index) =>
    createPracticeSkeleton(
      input,
      index + 1,
      practiceRoles,
      athleticRotation[index],
      intensities[index],
    ),
  );
  const primaryGoals = unique(practicePlans.map((practice) => practice.primaryGoal));
  const secondaryGoals = unique(practicePlans.map((practice) => practice.secondaryGoal));
  const reviewGoals = unique(practicePlans.map((practice) => practice.reviewGoal));
  const recentHistoryIds = input.previousPracticeHistory?.map((usage) => usage.drillId) ?? [];

  const plan: WeeklyDevelopmentPlan = {
    engineVersion: WEEKLY_PROGRAMMING_ENGINE_VERSION,
    activeInCoachApp: false,
    weekId: input.weekId ?? 'week-' + (input.referenceDate ?? 'draft'),
    ageBand,
    bpdsLevel: input.bpdsLevel ?? 1,
    practicesPerWeek: input.practicesPerWeek,
    practiceDuration: input.practiceDuration,
    weeklyPrimaryGoals: primaryGoals,
    weeklySecondaryGoals: secondaryGoals,
    weeklyReviewGoals: reviewGoals,
    athleticRotation,
    skillFamiliesIntroduced: [],
    skillFamiliesReinforced: [],
    skillFamiliesProgressed: [],
    skillFamiliesApplied: [],
    moduleExposureTargets: resolveModuleExposureTargetsV1(
      ageBand,
      input.bpdsLevel ?? 1,
      input.practicesPerWeek,
      input.practiceDuration,
    ),
    skillFamilyExposureTargets: Object.fromEntries(
      primaryGoals.map((goal) => [
        goal,
        {
          skillFamily: goal,
          emphasis: 'PRIMARY',
          targetExposures: Math.max(1, input.practicesPerWeek),
        } satisfies WeeklySkillFamilyTarget,
      ]),
    ),
    recentDrillIds: unique(recentHistoryIds),
    recentSkillFamilies: unique(input.recentSkillFamilies ?? []),
    weeklyLoad: input.weeklyLoad ?? 'NORMAL',
    weeklyProgressionStage: 'INTRODUCE',
    focusWeights: resolveFocusWeightsV1(input.focusPreset, input.practiceDuration),
    practicePlans,
    practiceMemory: [],
    drillExposures: [],
    skillFamilyExposures: {},
    rollingThreeWeekContext: rollingContext(input.previousWeeks),
    coherenceScore: emptyCoherenceScore(),
    validation: { valid: true, flags: [], issues: [] },
    internalWeeklySummary: [
      'The week is planned as one connected development cycle.',
      'Exact repetition is discouraged while useful skill-family continuity is rewarded.',
      'The default chain is introduce, reinforce, progress, apply and compete.',
    ],
  };
  return plan;
}

function normalizedText(drill: Drill): string {
  return [
    drill.name,
    drill.code,
    drill.category,
    drill.moduleCode,
    drill.objective,
    ...(drill.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();
}

function goalMatches(drill: Drill, goal: string): boolean {
  const tokens = goal
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
  const text = normalizedText(drill);
  return tokens.some((token) => text.includes(token));
}

function latestFamilyExposure(
  plan: WeeklyDevelopmentPlan,
  family: string,
): SkillFamilyExposure | undefined {
  return plan.skillFamilyExposures[family];
}

function mergeConfig(
  override?: Partial<WeeklyProgrammingConfig>,
): WeeklyProgrammingConfig {
  return { ...DEFAULT_WEEKLY_PROGRAMMING_CONFIG, ...override };
}

export function evaluateWeeklyCandidateV1(
  drill: Drill,
  input: WeeklyProgrammingInput,
  plan: WeeklyDevelopmentPlan,
  practice: WeeklyPracticePlan,
  block: WeeklyPracticeBlock,
  selectedDrills: Drill[] = [],
  configOverride?: Partial<WeeklyProgrammingConfig>,
): WeeklyCandidate {
  const config = mergeConfig(configOverride);
  const context: AgeLevelMatrixContext = {
    ...input,
    duration: input.practiceDuration,
    practicesPerWeek: input.practicesPerWeek,
    currentTrainingDay: practice.practiceNumber,
    primaryFocus: block.focus,
    secondaryFocus: practice.secondaryGoal,
    reviewFocus: practice.reviewGoal,
    previousPracticeHistory: [
      ...(input.previousPracticeHistory ?? []),
      ...plan.drillExposures.map(
        (exposure): DrillUsage => ({
          drillId: exposure.drillId,
          skillFamily: exposure.skillFamily,
          usedAt: input.referenceDate ?? '2026-01-01',
          completed: true,
          successful: true,
        }),
      ),
    ],
  };
  const base = evaluateDrillWithAgeLevelMatrixV1(
    drill,
    context,
    selectedDrills,
    undefined,
    block.id,
  );
  const family = inferFineSkillFamilyV1(drill);
  const stage = base.metadata.progressionStage;
  const reasons: WeeklyCandidateReason[] = [];
  const previousPractice = plan.practiceMemory.at(-1);
  const earlierPracticeIds = plan.practiceMemory.slice(0, -1).flatMap((item) => item.drillIds);

  if (previousPractice?.drillIds.includes(drill.id)) {
    reasons.push({
      code: 'exact-previous-practice',
      label: 'Exact drill used in the immediately previous practice',
      points: -config.exactPreviousPracticePenalty,
    });
  } else if (earlierPracticeIds.includes(drill.id)) {
    reasons.push({
      code: 'exact-earlier-this-week',
      label: 'Exact drill used earlier in the same week',
      points: -config.exactEarlierWeekPenalty,
    });
  }

  const familyExposure = latestFamilyExposure(plan, family);
  const latestStage = familyExposure?.stageHistory.at(-1);
  if (latestStage) {
    const difference = stageIndex(stage) - stageIndex(latestStage);
    if (difference === 1) {
      reasons.push({
        code: 'logical-family-progression',
        label: 'Useful next step in a previously exposed skill family',
        points: config.logicalFamilyProgressionBonus,
      });
    } else if (difference === 0) {
      reasons.push({
        code: 'same-family-same-stage',
        label: 'Same family and same stage already used this week',
        points: -config.sameFamilySameStagePenalty,
      });
    }
  }

  if (goalMatches(drill, block.focus)) {
    reasons.push({
      code: 'weekly-goal-match',
      label: 'Matches the goal of this weekly block',
      points: config.weeklyGoalMatchBonus,
    });
  }

  const target = plan.moduleExposureTargets[drill.moduleCode.toUpperCase()];
  if (target && (target.priority === 'HIGH' || target.priority === 'MODERATE-HIGH')) {
    reasons.push({
      code: 'weekly-module-need',
      label: 'Supports a high-priority module exposure for this profile',
      points: config.moduleNeedBonus,
    });
  }

  if (
    block.type === 'APPLICATION' ||
    block.type === 'COMPETITION' ||
    base.metadata.defender ||
    base.metadata.smallSidedPlayersPerTeam
  ) {
    reasons.push({
      code: 'game-transfer',
      label: 'Adds decision or game transfer',
      points: config.gameTransferBonus,
    });
  }

  const organization = resolveOrganizationSuggestionV1(
    Math.max(1, input.playerCount ?? 12),
    block.targetDrills,
    base.metadata.workSeconds,
  );
  if (organization.waitingRisk === 'HIGH') {
    reasons.push({
      code: 'waiting-risk',
      label: 'Organization creates excessive waiting risk',
      points: -config.excessiveWaitingPenalty,
    });
  }

  const adjustment = reasons.reduce((sum, reason) => sum + reason.points, 0);
  return {
    ...base,
    score: base.score + adjustment,
    weeklyScore: base.score + adjustment,
    weeklyReasons: reasons,
    skillFamily: family,
    progressionStage: stage,
  };
}

function chooseCandidates(
  drills: Drill[],
  input: WeeklyProgrammingInput,
  plan: WeeklyDevelopmentPlan,
  practice: WeeklyPracticePlan,
  block: WeeklyPracticeBlock,
  currentPracticeDrills: Drill[],
  configOverride?: Partial<WeeklyProgrammingConfig>,
): WeeklyCandidate[] {
  const usedCurrentIds = new Set(currentPracticeDrills.map((drill) => drill.id));
  const previousPracticeIds = new Set(
    plan.practiceMemory.at(-1)?.drillIds ?? [],
  );
  const exactWeekIds = new Set(plan.drillExposures.map((item) => item.drillId));
  const evaluated = drills
    .filter(
      (drill) =>
        !usedCurrentIds.has(drill.id) && !previousPracticeIds.has(drill.id),
    )
    .map((drill) =>
      evaluateWeeklyCandidateV1(
        drill,
        input,
        plan,
        practice,
        block,
        currentPracticeDrills,
        configOverride,
      ),
    )
    .filter((candidate) => candidate.eligible)
    .sort((a, b) => {
      const aRepeat = exactWeekIds.has(a.drill.id) ? 1 : 0;
      const bRepeat = exactWeekIds.has(b.drill.id) ? 1 : 0;
      if (aRepeat !== bRepeat) return aRepeat - bRepeat;
      return b.weeklyScore - a.weeklyScore || a.drill.id.localeCompare(b.drill.id);
    });
  return evaluated.slice(0, block.targetDrills);
}

function minutesPerDrill(block: WeeklyPracticeBlock): number {
  return block.drills.length ? block.duration / block.drills.length : block.duration;
}

function memoryFromPractice(practice: WeeklyPracticePlan): WeeklyPracticeMemory {
  const moduleMinutes: Record<string, number> = {};
  const skillFamilyMinutes: Record<string, number> = {};
  const drills = practice.blocks.flatMap((block) => block.drills);
  for (const block of practice.blocks) {
    const minutes = minutesPerDrill(block);
    for (const candidate of block.drills) {
      const module = candidate.drill.moduleCode;
      moduleMinutes[module] = (moduleMinutes[module] ?? 0) + minutes;
      skillFamilyMinutes[candidate.skillFamily] =
        (skillFamilyMinutes[candidate.skillFamily] ?? 0) + minutes;
    }
  }
  return {
    practiceNumber: practice.practiceNumber,
    drillIds: drills.map((candidate) => candidate.drill.id),
    skillFamilies: unique(drills.map((candidate) => candidate.skillFamily)),
    progressionStages: drills.map((candidate) => candidate.progressionStage),
    moduleMinutes,
    skillFamilyMinutes,
    primaryGoal: practice.primaryGoal,
    secondaryGoal: practice.secondaryGoal,
    reviewGoal: practice.reviewGoal,
    athleticStimulus: practice.athleticGoal,
    decisionSituations: practice.ssgConstraints.flatMap((constraint) => constraint.rules),
    ssgTypes: unique(practice.ssgConstraints.map((constraint) => constraint.format)),
  };
}

function updateExposureCollections(
  plan: WeeklyDevelopmentPlan,
  practice: WeeklyPracticePlan,
): void {
  for (const block of practice.blocks) {
    const minutes = minutesPerDrill(block);
    for (const candidate of block.drills) {
      const family = candidate.skillFamily;
      const exposure: DrillExposure = {
        drillId: candidate.drill.id,
        skillFamily: family,
        progressionStage: candidate.progressionStage,
        state: block.exposureState,
        practiceNumber: practice.practiceNumber,
        minutes,
      };
      plan.drillExposures.push(exposure);
      const existing = plan.skillFamilyExposures[family] ?? {
        skillFamily: family,
        states: [],
        practiceNumbers: [],
        stageHistory: [],
        minutes: 0,
        drillIds: [],
      };
      existing.states.push(block.exposureState);
      existing.practiceNumbers.push(practice.practiceNumber);
      existing.stageHistory.push(candidate.progressionStage);
      existing.minutes += minutes;
      existing.drillIds.push(candidate.drill.id);
      plan.skillFamilyExposures[family] = existing;

      if (block.exposureState === 'introduced') plan.skillFamiliesIntroduced.push(family);
      if (block.exposureState === 'reinforced') plan.skillFamiliesReinforced.push(family);
      if (block.exposureState === 'progressed') plan.skillFamiliesProgressed.push(family);
      if (block.exposureState === 'applied' || block.exposureState === 'liveApplied') {
        plan.skillFamiliesApplied.push(family);
      }
    }
  }
  plan.skillFamiliesIntroduced = unique(plan.skillFamiliesIntroduced);
  plan.skillFamiliesReinforced = unique(plan.skillFamiliesReinforced);
  plan.skillFamiliesProgressed = unique(plan.skillFamiliesProgressed);
  plan.skillFamiliesApplied = unique(plan.skillFamiliesApplied);
}

export function generateWeeklyProgramV1(
  drills: Drill[],
  input: WeeklyProgrammingInput,
  configOverride?: Partial<WeeklyProgrammingConfig>,
): WeeklyDevelopmentPlan {
  const plan = buildWeeklyDevelopmentPlanV1(input);
  for (const practice of plan.practicePlans) {
    practice.previousPracticeContext = plan.practiceMemory.map((memory) => ({ ...memory }));
    const currentPracticeDrills: Drill[] = [];
    for (const block of practice.blocks) {
      block.drills = chooseCandidates(
        drills,
        input,
        plan,
        practice,
        block,
        currentPracticeDrills,
        configOverride,
      );
      currentPracticeDrills.push(...block.drills.map((candidate) => candidate.drill));
      const workSeconds = block.drills[0]?.metadata.workSeconds ?? 40;
      block.organization = resolveOrganizationSuggestionV1(
        Math.max(1, input.playerCount ?? 12),
        block.targetDrills,
        workSeconds,
      );
    }
    const memory = memoryFromPractice(practice);
    plan.practiceMemory.push(memory);
    updateExposureCollections(plan, practice);
    plan.weeklyProgressionStage = progressionStageForPractice(
      practice.practiceNumber,
      input.practicesPerWeek,
    );
  }
  plan.recentDrillIds = unique([
    ...plan.recentDrillIds,
    ...plan.drillExposures.map((item) => item.drillId),
  ]);
  plan.recentSkillFamilies = unique([
    ...plan.recentSkillFamilies,
    ...Object.keys(plan.skillFamilyExposures),
  ]);
  plan.validation = validateWeeklyProgramV1(plan);
  plan.coherenceScore = scoreWeeklyCoherenceV1(plan);
  plan.internalWeeklySummary = buildWeeklySummaryV1(plan);
  return plan;
}

function addIssue(
  issues: WeekValidationIssue[],
  issue: WeekValidationIssue,
): void {
  if (
    !issues.some(
      (existing) =>
        existing.flag === issue.flag &&
        existing.practiceNumber === issue.practiceNumber &&
        existing.blockId === issue.blockId,
    )
  ) {
    issues.push(issue);
  }
}

function isolatedMinutes(practice: WeeklyPracticePlan): number {
  return practice.blocks
    .filter((block) => block.type === 'PRIMARY' || block.type === 'SECONDARY')
    .reduce((sum, block) => sum + block.duration, 0);
}

function decisionMinutes(practice: WeeklyPracticePlan): number {
  return practice.blocks
    .filter((block) => block.type === 'APPLICATION' || block.type === 'COMPETITION')
    .reduce((sum, block) => sum + block.duration, 0);
}

export function validateWeeklyProgramV1(
  plan: WeeklyDevelopmentPlan,
): WeekValidationResult {
  const issues: WeekValidationIssue[] = [];
  if (plan.practicePlans.length !== plan.practicesPerWeek) {
    addIssue(issues, {
      flag: 'DURATION_MISMATCH',
      message: 'Practice count does not match the requested weekly frequency.',
      targetedRegeneration: 'WEEK',
    });
  }

  for (const practice of plan.practicePlans) {
    const total = practice.blocks.reduce((sum, block) => sum + block.duration, 0);
    if (total !== practice.plannedDuration) {
      addIssue(issues, {
        flag: 'DURATION_MISMATCH',
        practiceNumber: practice.practiceNumber,
        message: 'Block durations do not match the requested practice duration.',
        targetedRegeneration: 'PRACTICE',
      });
    }
    if (!practice.primaryGoal || !practice.blocks.some((block) => block.type === 'PRIMARY')) {
      addIssue(issues, {
        flag: 'MISSING_PRIMARY_EXPOSURE',
        practiceNumber: practice.practiceNumber,
        message: 'The practice does not contain a primary-goal block.',
        targetedRegeneration: 'PRACTICE',
      });
    }
    const applicationBlocks = practice.blocks.filter(
      (block) => block.type === 'APPLICATION' || block.type === 'COMPETITION',
    );
    if (!applicationBlocks.length || !practice.ssgConstraints.length) {
      addIssue(issues, {
        flag: 'MISSING_GAME_TRANSFER',
        practiceNumber: practice.practiceNumber,
        message: 'The practice needs a constrained application or competition block.',
        targetedRegeneration: 'PRACTICE',
      });
    }
    if (isolatedMinutes(practice) > practice.plannedDuration * 0.62) {
      addIssue(issues, {
        flag: 'TOO_MUCH_ISOLATED_WORK',
        practiceNumber: practice.practiceNumber,
        message: 'Too much of the practice is isolated technical work.',
        targetedRegeneration: 'PRACTICE',
      });
    }
    if (decisionMinutes(practice) < Math.max(6, practice.plannedDuration * 0.15)) {
      addIssue(issues, {
        flag: 'INSUFFICIENT_DECISION_WORK',
        practiceNumber: practice.practiceNumber,
        message: 'Decision and game-transfer exposure is below the youth target.',
        targetedRegeneration: 'PRACTICE',
      });
    }

    for (const block of practice.blocks) {
      if (block.organization.waitingRisk === 'HIGH') {
        addIssue(issues, {
          flag: 'EXCESSIVE_WAIT_TIME',
          practiceNumber: practice.practiceNumber,
          blockId: block.id,
          message: 'The block organization creates excessive waiting time.',
          targetedRegeneration: 'BLOCK',
        });
      }
      for (const candidate of block.drills) {
        if (
          candidate.exclusions.some((item) => item.code === 'prerequisites') ||
          candidate.matrixExclusions.some((item) =>
            item.message.toLowerCase().includes('prerequisite'),
          )
        ) {
          addIssue(issues, {
            flag: 'PREREQUISITE_VIOLATION',
            practiceNumber: practice.practiceNumber,
            blockId: block.id,
            message: 'A selected drill does not satisfy prerequisites.',
            targetedRegeneration: 'BLOCK',
          });
        }
        if (
          candidate.exclusions.some((item) => item.code === 'age') ||
          candidate.matrixExclusions.some((item) => item.message.toLowerCase().includes('age'))
        ) {
          addIssue(issues, {
            flag: 'AGE_COMPLEXITY_TOO_HIGH',
            practiceNumber: practice.practiceNumber,
            blockId: block.id,
            message: 'A selected drill exceeds the age profile.',
            targetedRegeneration: 'BLOCK',
          });
        }
        if (
          candidate.exclusions.some((item) => item.code === 'difficulty') ||
          candidate.matrixExclusions.some((item) =>
            item.message.toLowerCase().includes('level'),
          )
        ) {
          addIssue(issues, {
            flag: 'LEVEL_COMPLEXITY_TOO_HIGH',
            practiceNumber: practice.practiceNumber,
            blockId: block.id,
            message: 'A selected drill exceeds the BPDS level profile.',
            targetedRegeneration: 'BLOCK',
          });
        }
      }
    }
  }

  for (let index = 1; index < plan.practiceMemory.length; index += 1) {
    const previous = new Set(plan.practiceMemory[index - 1].drillIds);
    const repeated = plan.practiceMemory[index].drillIds.filter((id) => previous.has(id));
    if (repeated.length > 0) {
      addIssue(issues, {
        flag: 'TOO_REPETITIVE',
        practiceNumber: index + 1,
        message: 'Exact drills repeat in consecutive practices: ' + repeated.join(', '),
        targetedRegeneration: 'BLOCK',
      });
    }
  }

  if (plan.athleticRotation.length >= 3 && unique(plan.athleticRotation.slice(0, 3)).length < 3) {
    addIssue(issues, {
      flag: 'ATHLETIC_IMBALANCE',
      message: 'The first three athletic stimuli are not balanced.',
      targetedRegeneration: 'WEEK',
    });
  }

  return {
    valid: issues.length === 0,
    flags: unique(issues.map((issue) => issue.flag)),
    issues,
  };
}

function scoreFromIssueCount(count: number, penalty: number): number {
  return clamp(100 - count * penalty, 0, 100);
}

export function scoreWeeklyCoherenceV1(
  plan: WeeklyDevelopmentPlan,
): WeeklyCoherenceScore {
  const count = (flags: WeeklyQualityFlag[]) =>
    plan.validation.issues.filter((issue) => flags.includes(issue.flag)).length;
  const familyContinuity = Object.values(plan.skillFamilyExposures).some(
    (exposure) => unique(exposure.practiceNumbers).length >= 2,
  );
  const values: Omit<WeeklyCoherenceScore, 'total'> = {
    SkillContinuity: familyContinuity || plan.practicesPerWeek === 1 ? 100 : 72,
    ProgressionQuality: scoreFromIssueCount(
      count(['TOO_REPETITIVE', 'PREREQUISITE_VIOLATION']),
      18,
    ),
    DrillVariety: scoreFromIssueCount(count(['TOO_REPETITIVE']), 25),
    GameTransfer: scoreFromIssueCount(
      count(['MISSING_GAME_TRANSFER', 'INSUFFICIENT_DECISION_WORK']),
      20,
    ),
    AthleticBalance: scoreFromIssueCount(count(['ATHLETIC_IMBALANCE']), 30),
    AgeAppropriateness: scoreFromIssueCount(count(['AGE_COMPLEXITY_TOO_HIGH']), 25),
    LevelAppropriateness: scoreFromIssueCount(count(['LEVEL_COMPLEXITY_TOO_HIGH']), 25),
  };
  return {
    ...values,
    total: Math.round(
      Object.values(values).reduce((sum, value) => sum + value, 0) /
        Object.values(values).length,
    ),
  };
}

export function buildWeeklySummaryV1(
  plan: WeeklyDevelopmentPlan,
): string[] {
  const exactRepeated = plan.validation.flags.includes('TOO_REPETITIVE');
  return [
    plan.practicesPerWeek + ' connected practices of ' + plan.practiceDuration + ' minutes.',
    'Primary goals: ' + plan.weeklyPrimaryGoals.join('; ') + '.',
    'Athletic rotation: ' + plan.athleticRotation.join(' -> ') + '.',
    exactRepeated
      ? 'Exact repetition requires targeted regeneration.'
      : 'No consecutive exact-drill repetition was accepted.',
    'Skill-family continuity is tracked separately from exact-drill novelty.',
    'Weekly coherence score: ' + plan.coherenceScore.total + '/100.',
  ];
}

