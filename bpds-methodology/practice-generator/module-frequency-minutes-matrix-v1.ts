import type {
  Drill,
  ProgressionStage,
} from '@predrag-miletic/bpds-methodology.entities.methodology';
import type { SkillLevel } from '@predrag-miletic/bpds-storage.entities.shared-types';
import type { DrillUsage } from './generator-engine-v1.js';
import {
  generateWeeklyProgramV1,
  type PracticeRole,
  type WeeklyAgeBand,
  type WeeklyDevelopmentPlan,
  type WeeklyDuration,
  type WeeklyFrequency,
  type WeeklyPracticeBlock,
  type WeeklyProgrammingInput,
} from './weekly-programming-engine-v1.js';

export const MODULE_FREQUENCY_MINUTES_MATRIX_VERSION = '1.0.0';

export type ModuleFrequencyProfileKey =
  | 'U8-9-L1'
  | 'U8-9-L2'
  | 'U8-9-L3'
  | 'U10-11-L1'
  | 'U10-11-L2'
  | 'U10-11-L3'
  | 'U12-13-L1'
  | 'U12-13-L2'
  | 'U12-13-L3';

export type DevelopmentAreaGroup =
  | 'ATHLETIC DEVELOPMENT'
  | 'BASKETBALL DEVELOPMENT'
  | 'DECISION / APPLICATION';

export type ModuleFrequencyPriority =
  | 'CORE'
  | 'HIGH'
  | 'MODERATE'
  | 'LOW'
  | 'CONDITIONAL';

export type RequiredWeeklyExposure = 'YES' | 'NO' | 'CONDITIONAL';

export type ModuleDevelopmentRole =
  | 'PRIMARY'
  | 'SECONDARY'
  | 'MAINTENANCE'
  | 'APPLICATION'
  | 'INTEGRATED';

export type ModuleFrequencyTarget = {
  moduleId: string;
  label: string;
  areaGroup: DevelopmentAreaGroup;
  minimumWeeklyMinutes: number;
  targetWeeklyMinutesMin: number;
  targetWeeklyMinutesMax: number;
  maximumWeeklyMinutes: number;
  targetFrequencyMin: number;
  targetFrequencyMax: number;
  priority: ModuleFrequencyPriority;
  primaryEligible: boolean;
  secondaryEligible: boolean;
  maintenanceEligible: boolean;
  applicationEligible: boolean;
  integratedEligible: boolean;
  roles: ModuleDevelopmentRole[];
  allowedProgressionStages: ProgressionStage[];
  preferredPracticeDays: number[];
  ageLevelProfile: ModuleFrequencyProfileKey;
  requiredWeeklyExposure: RequiredWeeklyExposure;
};

export type ModuleFrequencyProfile = {
  key: ModuleFrequencyProfileKey;
  ageBand: WeeklyAgeBand;
  bpdsLevel: SkillLevel;
  profileLabel: string;
  objectives: string[];
  baselinePracticesPerWeek: 3;
  baselinePracticeDuration: 90;
  baselineWeeklyMinutes: 270;
  targets: Record<string, ModuleFrequencyTarget>;
};

export type ScaledModuleFrequencyTarget = ModuleFrequencyTarget & {
  sourceTargetWeeklyMinutesMin: number;
  sourceTargetWeeklyMinutesMax: number;
  scaleFactor: number;
  flexibilityPercent: number;
};

export type ExposureCreditWeights = Record<ModuleDevelopmentRole, number>;

export const DEFAULT_EXPOSURE_CREDIT_WEIGHTS: ExposureCreditWeights = {
  PRIMARY: 1,
  SECONDARY: 0.5,
  MAINTENANCE: 0.4,
  APPLICATION: 1,
  INTEGRATED: 0.25,
};

export type DevelopmentExposureCredit = {
  moduleId: string;
  moduleLabel: string;
  role: ModuleDevelopmentRole;
  exposureCredit: number;
  playerExposureMinutes: number;
  creditedMinutes: number;
  activityRate: number;
  effectiveDevelopmentMinutes: number;
  drillId?: string;
  progressionStage?: ProgressionStage;
};

export type BlockDevelopmentExposure = {
  weekId: string;
  practiceNumber: number;
  blockId: string;
  blockMinutes: number;
  playerMinutesPerStationOrDrill: number;
  activityRate: number;
  credits: DevelopmentExposureCredit[];
};

export type ModuleExposureSummary = {
  moduleId: string;
  moduleLabel: string;
  blockMinutes: number;
  creditedMinutes: number;
  effectiveDevelopmentMinutes: number;
  frequency: number;
  practiceNumbers: number[];
  roles: ModuleDevelopmentRole[];
  progressionStages: ProgressionStage[];
  drillIds: string[];
};

export type WeeklyModuleExposureReport = {
  weekId: string;
  totalClockMinutes: number;
  expectedClockMinutes: number;
  blocks: BlockDevelopmentExposure[];
  modules: Record<string, ModuleExposureSummary>;
  weakSideEffectiveMinutes: number;
  averageActivityRate: number;
};

export type ModuleFrequencyQualityFlag =
  | 'UNDEREXPOSED_CORE_MODULE'
  | 'OVEREXPOSED_SINGLE_MODULE'
  | 'INSUFFICIENT_SHOOTING_EXPOSURE'
  | 'INSUFFICIENT_PASSING_EXPOSURE'
  | 'INSUFFICIENT_FINISHING_EXPOSURE'
  | 'INSUFFICIENT_BALL_CONTROL'
  | 'INSUFFICIENT_SSG'
  | 'EXCESSIVE_STATIONARY_WORK'
  | 'EXCESSIVE_COMBINATION_WORK'
  | 'AGE_INAPPROPRIATE_MODULE_VOLUME'
  | 'LEVEL_INAPPROPRIATE_MODULE_VOLUME'
  | 'MISSING_WEAK_SIDE_EXPOSURE';

export type ModuleFrequencyValidationIssue = {
  flag: ModuleFrequencyQualityFlag;
  moduleId?: string;
  message: string;
  actualMinutes?: number;
  targetMinutesMin?: number;
  targetMinutesMax?: number;
  targetedRegeneration: 'BLOCK' | 'PRACTICE' | 'WEEK';
};

export type ModuleFrequencyValidation = {
  valid: boolean;
  flags: ModuleFrequencyQualityFlag[];
  issues: ModuleFrequencyValidationIssue[];
  underexposedModules: string[];
  overexposedModules: string[];
};

export type ModuleMatrixWeekResult = {
  engineVersion: typeof MODULE_FREQUENCY_MINUTES_MATRIX_VERSION;
  activeInCoachApp: false;
  profile: ModuleFrequencyProfile;
  scaledTargets: Record<string, ScaledModuleFrequencyTarget>;
  plan: WeeklyDevelopmentPlan;
  exposure: WeeklyModuleExposureReport;
  moduleValidation: ModuleFrequencyValidation;
};

export type SimulationPracticeSummary = {
  practiceNumber: number;
  practiceRoles: PracticeRole[];
  athleticFocus: string;
  primaryGoal: string;
  secondaryGoal: string;
  reviewGoal: string;
  blocks: Array<{
    blockId: string;
    blockType: string;
    focus: string;
    duration: number;
    selectedDrills: Array<{
      drillId: string;
      drillName: string;
      duration: number;
      skillFamily: string;
      progressionStage: ProgressionStage;
    }>;
    ssgFormat?: string;
  }>;
  totalDuration: number;
};

export type SimulationWeekSummary = {
  weekNumber: number;
  weekId: string;
  practices: SimulationPracticeSummary[];
  weeklyModuleExposure: Record<
    string,
    {
      creditedMinutes: number;
      effectiveDevelopmentMinutes: number;
      frequency: number;
    }
  >;
  skillFamilyProgression: Record<string, ProgressionStage[]>;
  exactDrillRepetitions: string[];
  weeklyCoherence: number;
  qualityFlags: string[];
  underexposedModules: string[];
  overexposedModules: string[];
};

export type FourWeekSimulationResult = {
  engineVersion: typeof MODULE_FREQUENCY_MINUTES_MATRIX_VERSION;
  activeInCoachApp: false;
  profile: ModuleFrequencyProfileKey;
  weeks: SimulationWeekSummary[];
  exactDrillRepeatCount: number;
  continuedSkillFamilies: string[];
  progressedSkillFamilies: string[];
  allQualityFlags: string[];
  underexposedModules: string[];
  overexposedModules: string[];
  methodologicalWeaknesses: string[];
  recommendationsBeforeActivation: string[];
};

type TargetTuple = [
  priority: ModuleFrequencyPriority,
  targetMin: number,
  targetMax: number,
  frequencyMin: number,
  frequencyMax: number,
];

type BasketballProfileData = Record<string, TargetTuple>;

const FOUNDATION_STAGES: ProgressionStage[] = [
  'Technique',
  'Movement',
  'Speed',
  'Reaction',
  'Defender',
  'Game',
];

const DEVELOPMENT_STAGES: ProgressionStage[] = [
  'Technique',
  'Movement',
  'Speed',
  'Combination',
  'Reaction',
  'Defender',
  'Game',
];

const PERFORMANCE_STAGES: ProgressionStage[] = [
  'Technique',
  'Movement',
  'Speed',
  'Combination',
  'Reaction',
  'Defender',
  'Game',
];

const BASKETBALL_PROFILE_DATA: Record<
  ModuleFrequencyProfileKey,
  BasketballProfileData
> = {
  'U8-9-L1': {
    'Ball Mastery': ['CORE', 18, 30, 2, 3],
    'Stationary Ball Handling': ['CORE', 15, 25, 2, 3],
    'Two-Ball Series': ['CONDITIONAL', 0, 6, 0, 1],
    'Tennis Ball Reaction': ['CONDITIONAL', 0, 5, 0, 1],
    'Moving Ball Handling': ['HIGH', 10, 18, 1, 2],
    'Change of Direction': ['MODERATE', 6, 12, 1, 1],
    'Combination Moves': ['CONDITIONAL', 0, 6, 0, 1],
    Footwork: ['HIGH', 8, 15, 1, 2],
    'Triple Threat': ['MODERATE', 5, 10, 1, 1],
    '1-on-1 Offensive Development': ['MODERATE', 5, 10, 1, 1],
    Passing: ['CORE', 15, 25, 2, 2],
    Shooting: ['CORE', 18, 30, 2, 3],
    Finishing: ['CORE', 15, 25, 2, 2],
    'Offensive Concepts / Spacing': ['LOW', 0, 8, 0, 1],
    'Situational / SSG': ['CORE', 35, 55, 2, 3],
  },
  'U8-9-L2': {
    'Ball Mastery': ['CORE', 15, 25, 2, 3],
    'Stationary Ball Handling': ['HIGH', 12, 20, 2, 2],
    'Two-Ball Series': ['CONDITIONAL', 0, 8, 0, 1],
    'Tennis Ball Reaction': ['CONDITIONAL', 0, 8, 0, 1],
    'Moving Ball Handling': ['CORE', 15, 25, 2, 2],
    'Change of Direction': ['HIGH', 10, 18, 1, 2],
    'Combination Moves': ['MODERATE', 5, 10, 0, 1],
    Footwork: ['HIGH', 10, 18, 1, 2],
    'Triple Threat': ['MODERATE', 6, 12, 1, 1],
    '1-on-1 Offensive Development': ['HIGH', 10, 18, 1, 2],
    Passing: ['CORE', 18, 28, 2, 2],
    Shooting: ['CORE', 20, 30, 2, 3],
    Finishing: ['CORE', 18, 28, 2, 2],
    'Offensive Concepts / Spacing': ['LOW', 0, 8, 0, 1],
    'Situational / SSG': ['CORE', 40, 60, 3, 3],
  },
  'U8-9-L3': {
    'Ball Mastery': ['HIGH', 12, 20, 2, 3],
    'Stationary Ball Handling': ['MODERATE', 8, 15, 1, 2],
    'Two-Ball Series': ['MODERATE', 4, 10, 0, 1],
    'Tennis Ball Reaction': ['MODERATE', 4, 10, 0, 1],
    'Moving Ball Handling': ['CORE', 18, 28, 2, 3],
    'Change of Direction': ['HIGH', 12, 20, 1, 2],
    'Combination Moves': ['MODERATE', 6, 12, 1, 1],
    Footwork: ['HIGH', 10, 18, 1, 2],
    'Triple Threat': ['HIGH', 8, 15, 1, 2],
    '1-on-1 Offensive Development': ['HIGH', 12, 22, 1, 2],
    Passing: ['CORE', 18, 28, 2, 2],
    Shooting: ['CORE', 20, 30, 2, 3],
    Finishing: ['CORE', 18, 28, 2, 2],
    'Offensive Concepts / Spacing': ['MODERATE', 4, 10, 0, 1],
    'Situational / SSG': ['CORE', 45, 65, 3, 3],
  },
  'U10-11-L1': {
    'Ball Mastery': ['HIGH', 12, 20, 2, 2],
    'Stationary Ball Handling': ['CORE', 15, 25, 2, 3],
    'Two-Ball Series': ['CONDITIONAL', 0, 8, 0, 1],
    'Tennis Ball Reaction': ['CONDITIONAL', 0, 8, 0, 1],
    'Moving Ball Handling': ['HIGH', 12, 20, 1, 2],
    'Change of Direction': ['MODERATE', 8, 15, 1, 2],
    'Combination Moves': ['LOW', 0, 8, 0, 1],
    Footwork: ['HIGH', 10, 18, 1, 2],
    'Triple Threat': ['HIGH', 8, 15, 1, 2],
    '1-on-1 Offensive Development': ['HIGH', 10, 18, 1, 2],
    Passing: ['CORE', 18, 28, 2, 2],
    Shooting: ['CORE', 22, 32, 2, 3],
    Finishing: ['CORE', 18, 28, 2, 2],
    'Offensive Concepts / Spacing': ['MODERATE', 4, 10, 0, 1],
    'Situational / SSG': ['CORE', 40, 60, 3, 3],
  },
  'U10-11-L2': {
    'Ball Mastery': ['HIGH', 10, 18, 1, 2],
    'Stationary Ball Handling': ['HIGH', 10, 18, 1, 2],
    'Two-Ball Series': ['MODERATE', 5, 12, 0, 2],
    'Tennis Ball Reaction': ['MODERATE', 5, 10, 0, 1],
    'Moving Ball Handling': ['CORE', 15, 25, 2, 3],
    'Change of Direction': ['HIGH', 12, 20, 1, 2],
    'Combination Moves': ['MODERATE', 8, 15, 1, 2],
    Footwork: ['HIGH', 10, 18, 1, 2],
    'Triple Threat': ['HIGH', 10, 18, 1, 2],
    '1-on-1 Offensive Development': ['HIGH', 12, 22, 1, 2],
    Passing: ['CORE', 20, 30, 2, 3],
    Shooting: ['CORE', 25, 35, 2, 3],
    Finishing: ['CORE', 20, 30, 2, 3],
    'Offensive Concepts / Spacing': ['MODERATE', 5, 12, 0, 2],
    'Situational / SSG': ['CORE', 45, 65, 3, 3],
  },
  'U10-11-L3': {
    'Ball Mastery': ['MODERATE', 8, 15, 1, 2],
    'Stationary Ball Handling': ['MODERATE', 8, 15, 1, 2],
    'Two-Ball Series': ['MODERATE', 5, 12, 0, 2],
    'Tennis Ball Reaction': ['MODERATE', 5, 10, 0, 1],
    'Moving Ball Handling': ['HIGH', 15, 25, 2, 3],
    'Change of Direction': ['HIGH', 12, 20, 1, 2],
    'Combination Moves': ['HIGH', 10, 18, 1, 2],
    Footwork: ['HIGH', 10, 18, 1, 2],
    'Triple Threat': ['HIGH', 10, 18, 1, 2],
    '1-on-1 Offensive Development': ['CORE', 15, 25, 2, 3],
    Passing: ['CORE', 20, 30, 2, 3],
    Shooting: ['CORE', 25, 35, 2, 3],
    Finishing: ['CORE', 20, 30, 2, 3],
    'Offensive Concepts / Spacing': ['MODERATE', 8, 15, 1, 2],
    'Situational / SSG': ['CORE', 50, 70, 3, 3],
  },
  'U12-13-L1': {
    'Ball Mastery': ['MODERATE', 8, 15, 1, 2],
    'Stationary Ball Handling': ['HIGH', 10, 18, 1, 2],
    'Two-Ball Series': ['CONDITIONAL', 0, 10, 0, 1],
    'Tennis Ball Reaction': ['CONDITIONAL', 0, 8, 0, 1],
    'Moving Ball Handling': ['HIGH', 12, 22, 1, 2],
    'Change of Direction': ['HIGH', 10, 18, 1, 2],
    'Combination Moves': ['MODERATE', 5, 10, 0, 1],
    Footwork: ['HIGH', 10, 18, 1, 2],
    'Triple Threat': ['HIGH', 10, 18, 1, 2],
    '1-on-1 Offensive Development': ['HIGH', 12, 22, 1, 2],
    Passing: ['CORE', 20, 30, 2, 3],
    Shooting: ['CORE', 25, 35, 2, 3],
    Finishing: ['CORE', 20, 30, 2, 3],
    'Offensive Concepts / Spacing': ['MODERATE', 8, 15, 1, 2],
    'Situational / SSG': ['CORE', 50, 70, 3, 3],
  },
  'U12-13-L2': {
    'Ball Mastery': ['LOW', 6, 12, 1, 2],
    'Stationary Ball Handling': ['MODERATE', 8, 15, 1, 2],
    'Two-Ball Series': ['MODERATE', 5, 12, 0, 2],
    'Tennis Ball Reaction': ['MODERATE', 5, 10, 0, 1],
    'Moving Ball Handling': ['HIGH', 15, 25, 2, 3],
    'Change of Direction': ['HIGH', 12, 22, 1, 2],
    'Combination Moves': ['HIGH', 10, 20, 1, 2],
    Footwork: ['HIGH', 10, 18, 1, 2],
    'Triple Threat': ['HIGH', 10, 18, 1, 2],
    '1-on-1 Offensive Development': ['CORE', 15, 25, 2, 3],
    Passing: ['CORE', 22, 32, 2, 3],
    Shooting: ['CORE', 28, 40, 2, 3],
    Finishing: ['CORE', 22, 32, 2, 3],
    'Offensive Concepts / Spacing': ['HIGH', 10, 20, 1, 2],
    'Situational / SSG': ['CORE', 55, 75, 3, 3],
  },
  'U12-13-L3': {
    'Ball Mastery': ['LOW', 5, 10, 0, 2],
    'Stationary Ball Handling': ['LOW', 5, 12, 0, 2],
    'Two-Ball Series': ['MODERATE', 5, 12, 0, 2],
    'Tennis Ball Reaction': ['MODERATE', 5, 10, 0, 1],
    'Moving Ball Handling': ['HIGH', 12, 22, 1, 2],
    'Change of Direction': ['HIGH', 12, 20, 1, 2],
    'Combination Moves': ['HIGH', 10, 20, 1, 2],
    Footwork: ['HIGH', 10, 18, 1, 2],
    'Triple Threat': ['HIGH', 10, 18, 1, 2],
    '1-on-1 Offensive Development': ['CORE', 18, 30, 2, 3],
    Passing: ['CORE', 20, 30, 2, 3],
    Shooting: ['CORE', 30, 42, 2, 3],
    Finishing: ['CORE', 22, 32, 2, 3],
    'Offensive Concepts / Spacing': ['HIGH', 12, 22, 1, 2],
    'Situational / SSG': ['CORE', 60, 80, 3, 3],
  },
};

const MODULE_CODE_TO_LABEL: Record<string, string> = {
  MOV: 'Movement Preparation',
  ATH: 'Movement Preparation',
  COORD: 'Coordination',
  SPD: 'Speed / Acceleration',
  AGI: 'Agility / Deceleration',
  REA: 'Reaction',
  BAL: 'Balance / Landing',
  MOB: 'Mobility',
  BM: 'Ball Mastery',
  SBH: 'Stationary Ball Handling',
  TB: 'Tennis Ball Reaction',
  TBR: 'Tennis Ball Reaction',
  '2BS': 'Two-Ball Series',
  TBS: 'Two-Ball Series',
  MBH: 'Moving Ball Handling',
  COD: 'Change of Direction',
  COM: 'Combination Moves',
  FW: 'Footwork',
  TT: 'Triple Threat',
  AOD: '1-on-1 Offensive Development',
  '1V1': '1-on-1 Offensive Development',
  PAS: 'Passing',
  PASS: 'Passing',
  SH: 'Shooting',
  SHOOT: 'Shooting',
  FIN: 'Finishing',
  OCS: 'Offensive Concepts / Spacing',
  SPC: 'Offensive Concepts / Spacing',
  SIT: 'Situational / SSG',
  SSG: 'Situational / SSG',
};

const PRIORITY_ROLES: Record<
  ModuleFrequencyPriority,
  ModuleDevelopmentRole[]
> = {
  CORE: ['PRIMARY', 'SECONDARY', 'APPLICATION', 'INTEGRATED'],
  HIGH: ['PRIMARY', 'SECONDARY', 'APPLICATION', 'INTEGRATED'],
  MODERATE: ['SECONDARY', 'MAINTENANCE', 'APPLICATION', 'INTEGRATED'],
  LOW: ['MAINTENANCE', 'INTEGRATED'],
  CONDITIONAL: ['MAINTENANCE', 'APPLICATION', 'INTEGRATED'],
};

const AGE_ATHLETIC_DATA: Record<WeeklyAgeBand, BasketballProfileData> = {
  'U8-9': {
    'Movement Preparation': ['CORE', 18, 25, 3, 3],
    'Speed / Acceleration': ['HIGH', 6, 12, 1, 2],
    'Agility / Deceleration': ['HIGH', 6, 12, 1, 2],
    Reaction: ['HIGH', 5, 10, 1, 2],
    Coordination: ['CORE', 12, 20, 2, 3],
    'Balance / Landing': ['HIGH', 5, 10, 1, 2],
    Mobility: ['CONDITIONAL', 0, 6, 0, 3],
  },
  'U10-11': {
    'Movement Preparation': ['CORE', 15, 22, 3, 3],
    'Speed / Acceleration': ['HIGH', 7, 12, 1, 2],
    'Agility / Deceleration': ['HIGH', 7, 13, 1, 2],
    Reaction: ['HIGH', 6, 12, 1, 2],
    Coordination: ['HIGH', 8, 15, 1, 3],
    'Balance / Landing': ['HIGH', 5, 10, 1, 2],
    Mobility: ['CONDITIONAL', 0, 6, 0, 3],
  },
  'U12-13': {
    'Movement Preparation': ['CORE', 14, 20, 3, 3],
    'Speed / Acceleration': ['HIGH', 7, 12, 1, 2],
    'Agility / Deceleration': ['HIGH', 7, 12, 1, 2],
    Reaction: ['HIGH', 6, 12, 1, 2],
    Coordination: ['MODERATE', 5, 10, 1, 2],
    'Balance / Landing': ['HIGH', 5, 10, 1, 2],
    Mobility: ['CONDITIONAL', 0, 6, 0, 3],
  },
};

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function stagesForProfile(
  ageBand: WeeklyAgeBand,
  level: SkillLevel,
): ProgressionStage[] {
  if (ageBand === 'U8-9' && level === 1) return FOUNDATION_STAGES;
  if (level === 3) return PERFORMANCE_STAGES;
  return DEVELOPMENT_STAGES;
}

function preferredDaysFor(label: string): number[] {
  if (
    label.includes('Ball Handling') ||
    label.includes('Ball Mastery') ||
    label.includes('Change of Direction') ||
    label.includes('Finishing')
  ) {
    return [1, 3];
  }
  if (
    label.includes('Passing') ||
    label.includes('Shooting') ||
    label.includes('Footwork')
  ) {
    return [2, 3];
  }
  return [1, 2, 3];
}

function makeTarget(
  profileKey: ModuleFrequencyProfileKey,
  areaGroup: DevelopmentAreaGroup,
  label: string,
  tuple: TargetTuple,
  stages: ProgressionStage[],
): ModuleFrequencyTarget {
  const [priority, targetMin, targetMax, frequencyMin, frequencyMax] = tuple;
  const roles = PRIORITY_ROLES[priority];
  const requiredWeeklyExposure =
    priority === 'CORE'
      ? 'YES'
      : priority === 'HIGH' || priority === 'CONDITIONAL'
        ? 'CONDITIONAL'
        : 'NO';
  return {
    moduleId: slug(label),
    label,
    areaGroup,
    minimumWeeklyMinutes:
      requiredWeeklyExposure === 'YES' ? Math.floor(targetMin * 0.65) : 0,
    targetWeeklyMinutesMin: targetMin,
    targetWeeklyMinutesMax: targetMax,
    maximumWeeklyMinutes: Math.ceil(targetMax * 1.2),
    targetFrequencyMin: frequencyMin,
    targetFrequencyMax: frequencyMax,
    priority,
    primaryEligible: roles.includes('PRIMARY'),
    secondaryEligible: roles.includes('SECONDARY'),
    maintenanceEligible: roles.includes('MAINTENANCE'),
    applicationEligible: roles.includes('APPLICATION'),
    integratedEligible: roles.includes('INTEGRATED'),
    roles: [...roles],
    allowedProgressionStages: [...stages],
    preferredPracticeDays: preferredDaysFor(label),
    ageLevelProfile: profileKey,
    requiredWeeklyExposure,
  };
}

function decisionTargets(
  ageBand: WeeklyAgeBand,
  level: SkillLevel,
): BasketballProfileData {
  const younger = ageBand === 'U8-9';
  const older = ageBand === 'U12-13';
  const advanced = level === 3;
  return {
    'Decision / Application': [
      'CORE',
      younger ? 25 : older ? (advanced ? 45 : 35) : 32,
      younger ? 45 : older ? (advanced ? 65 : 55) : 55,
      2,
      3,
    ],
    'Reaction-Based Skill': ['HIGH', 5, advanced ? 16 : 12, 1, 2],
    '1v1 Application': ['HIGH', younger ? 8 : 12, advanced ? 28 : 22, 1, 3],
    '2v1': ['HIGH', 6, 15, 1, 2],
    '2v2': ['HIGH', 8, 20, 1, 2],
    '3v2': [younger ? 'CONDITIONAL' : 'MODERATE', 0, 15, 0, 2],
    '3v3': ['HIGH', younger ? 5 : 10, advanced ? 30 : 24, 1, 2],
    '4v4': [
      younger ? 'CONDITIONAL' : older ? 'MODERATE' : 'CONDITIONAL',
      0,
      older ? 22 : 12,
      0,
      1,
    ],
    '5v5': ['CONDITIONAL', 0, older && advanced ? 15 : 8, 0, 1],
    Competition: ['MODERATE', 10, 35, 1, 3],
  };
}

function profileObjectives(
  ageBand: WeeklyAgeBand,
  level: SkillLevel,
): string[] {
  if (ageBand === 'U8-9' && level === 1) {
    return ['MOVE', 'CONTROL', 'EXPLORE', 'ENJOY', 'LEARN'];
  }
  if (ageBand === 'U12-13' && level === 3) {
    return ['QUALITY', 'READ', 'DECIDE', 'TRANSFER', 'COMPETE'];
  }
  return ['CONTROL', 'MOVE', 'PROGRESS', 'DECIDE', 'APPLY'];
}

function createProfile(
  key: ModuleFrequencyProfileKey,
  ageBand: WeeklyAgeBand,
  level: SkillLevel,
): ModuleFrequencyProfile {
  const stages = stagesForProfile(ageBand, level);
  const targets: Record<string, ModuleFrequencyTarget> = {};
  const groups: Array<[DevelopmentAreaGroup, BasketballProfileData]> = [
    ['ATHLETIC DEVELOPMENT', AGE_ATHLETIC_DATA[ageBand]],
    ['BASKETBALL DEVELOPMENT', BASKETBALL_PROFILE_DATA[key]],
    ['DECISION / APPLICATION', decisionTargets(ageBand, level)],
  ];
  for (const [areaGroup, data] of groups) {
    for (const [label, tuple] of Object.entries(data)) {
      const target = makeTarget(key, areaGroup, label, tuple, stages);
      targets[target.moduleId] = target;
    }
  }
  return {
    key,
    ageBand,
    bpdsLevel: level,
    profileLabel: ageBand + ' Level ' + level,
    objectives: profileObjectives(ageBand, level),
    baselinePracticesPerWeek: 3,
    baselinePracticeDuration: 90,
    baselineWeeklyMinutes: 270,
    targets,
  };
}

export const MODULE_FREQUENCY_MATRIX_V1: Record<
  ModuleFrequencyProfileKey,
  ModuleFrequencyProfile
> = {
  'U8-9-L1': createProfile('U8-9-L1', 'U8-9', 1),
  'U8-9-L2': createProfile('U8-9-L2', 'U8-9', 2),
  'U8-9-L3': createProfile('U8-9-L3', 'U8-9', 3),
  'U10-11-L1': createProfile('U10-11-L1', 'U10-11', 1),
  'U10-11-L2': createProfile('U10-11-L2', 'U10-11', 2),
  'U10-11-L3': createProfile('U10-11-L3', 'U10-11', 3),
  'U12-13-L1': createProfile('U12-13-L1', 'U12-13', 1),
  'U12-13-L2': createProfile('U12-13-L2', 'U12-13', 2),
  'U12-13-L3': createProfile('U12-13-L3', 'U12-13', 3),
};

export function moduleFrequencyProfileKeyV1(
  age: number,
  level: SkillLevel,
): ModuleFrequencyProfileKey {
  const ageBand: WeeklyAgeBand =
    age <= 9 ? 'U8-9' : age <= 11 ? 'U10-11' : 'U12-13';
  return (ageBand + '-L' + level) as ModuleFrequencyProfileKey;
}

export function getModuleFrequencyProfileV1(
  age: number,
  level: SkillLevel,
): ModuleFrequencyProfile {
  return MODULE_FREQUENCY_MATRIX_V1[moduleFrequencyProfileKeyV1(age, level)];
}

const FREQUENCY_SCALE: Record<WeeklyFrequency, number> = {
  1: 0.42,
  2: 0.72,
  3: 1,
  4: 1.18,
  5: 1.32,
  6: 1.45,
};

const DURATION_SCALE: Record<WeeklyDuration, number> = {
  30: 0.45,
  45: 0.62,
  60: 0.76,
  75: 0.9,
  90: 1,
  120: 1.18,
};

function goalMentions(label: string, goals: string[]): boolean {
  const normalizedLabel = label.toLowerCase();
  return goals.some((goal) => {
    const normalizedGoal = goal.toLowerCase();
    return (
      normalizedGoal.includes(normalizedLabel) ||
      normalizedLabel.includes(normalizedGoal) ||
      normalizedGoal
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 4)
        .some((token) => normalizedLabel.includes(token))
    );
  });
}

export function scaleModuleFrequencyTargetsV1(
  profile: ModuleFrequencyProfile,
  practicesPerWeek: WeeklyFrequency,
  practiceDuration: WeeklyDuration,
  manualPrimaryGoals: string[] = [],
  flexibilityPercent = 20,
): Record<string, ScaledModuleFrequencyTarget> {
  const baseFactor =
    FREQUENCY_SCALE[practicesPerWeek] * DURATION_SCALE[practiceDuration];
  const result: Record<string, ScaledModuleFrequencyTarget> = {};

  for (const target of Object.values(profile.targets)) {
    const lowPriorityReduction =
      practicesPerWeek <= 2 &&
      (target.priority === 'LOW' || target.priority === 'CONDITIONAL')
        ? 0.45
        : 1;
    const coreProtection =
      target.priority === 'CORE' && practicesPerWeek <= 2 ? 1.12 : 1;
    const primaryBoost = goalMentions(target.label, manualPrimaryGoals) ? 1.2 : 1;
    const scaleFactor = baseFactor * lowPriorityReduction * coreProtection * primaryBoost;
    const scaledMin = Math.max(
      0,
      Math.round(target.targetWeeklyMinutesMin * scaleFactor),
    );
    const scaledMax = Math.max(
      scaledMin,
      Math.round(target.targetWeeklyMinutesMax * scaleFactor),
    );
    const frequencyRatio = practicesPerWeek / 3;
    const frequencyMin =
      target.requiredWeeklyExposure === 'YES'
        ? Math.min(
            practicesPerWeek,
            Math.max(1, Math.round(target.targetFrequencyMin * frequencyRatio)),
          )
        : Math.min(
            practicesPerWeek,
            Math.round(target.targetFrequencyMin * frequencyRatio),
          );
    const frequencyMax = Math.min(
      practicesPerWeek,
      Math.max(frequencyMin, Math.ceil(target.targetFrequencyMax * frequencyRatio)),
    );

    result[target.moduleId] = {
      ...target,
      minimumWeeklyMinutes:
        target.requiredWeeklyExposure === 'YES'
          ? Math.min(
              scaledMin,
              Math.max(1, Math.round(target.minimumWeeklyMinutes * scaleFactor)),
            )
          : 0,
      targetWeeklyMinutesMin: scaledMin,
      targetWeeklyMinutesMax: scaledMax,
      maximumWeeklyMinutes: Math.max(
        scaledMax,
        Math.round(target.maximumWeeklyMinutes * scaleFactor),
      ),
      targetFrequencyMin: frequencyMin,
      targetFrequencyMax: frequencyMax,
      preferredPracticeDays: target.preferredPracticeDays.filter(
        (day) => day <= practicesPerWeek,
      ),
      sourceTargetWeeklyMinutesMin: target.targetWeeklyMinutesMin,
      sourceTargetWeeklyMinutesMax: target.targetWeeklyMinutesMax,
      scaleFactor,
      flexibilityPercent,
    };
  }
  return result;
}

function canonicalModuleLabel(moduleCode: string): string {
  const normalized = moduleCode.toUpperCase();
  return MODULE_CODE_TO_LABEL[normalized] ?? moduleCode;
}

function moduleIdForLabel(label: string): string {
  return slug(label);
}

function roleForBlock(block: WeeklyPracticeBlock): ModuleDevelopmentRole {
  if (block.type === 'PRIMARY' || block.type === 'ATHLETIC') return 'PRIMARY';
  if (block.type === 'SECONDARY') return 'SECONDARY';
  if (block.type === 'REVIEW') return 'MAINTENANCE';
  if (block.type === 'APPLICATION' || block.type === 'COMPETITION') {
    return 'APPLICATION';
  }
  return 'INTEGRATED';
}

function athleticLabelFromFocus(focus: string): string {
  const text = focus.toLowerCase();
  if (text.includes('speed') || text.includes('acceleration')) {
    return 'Speed / Acceleration';
  }
  if (text.includes('agility') || text.includes('deceleration')) {
    return 'Agility / Deceleration';
  }
  if (text.includes('reaction') || text.includes('quickness')) return 'Reaction';
  if (text.includes('coordination')) return 'Coordination';
  if (text.includes('balance') || text.includes('landing')) {
    return 'Balance / Landing';
  }
  if (text.includes('mobility')) return 'Mobility';
  return 'Movement Preparation';
}

export function resolveActivityRateV1(block: WeeklyPracticeBlock): number {
  const organizationRate = block.organization.activePlayerRatio;
  if (block.type === 'APPLICATION' || block.type === 'COMPETITION') {
    return clamp(Math.max(organizationRate, 0.82), 0, 1);
  }
  if (block.organization.format === 'PARTNERS') {
    return clamp(Math.max(organizationRate, 0.88), 0, 1);
  }
  if (block.organization.format === 'STATIONS') {
    return clamp(Math.max(organizationRate, 0.8), 0, 1);
  }
  return clamp(organizationRate, 0, 1);
}

export function effectiveDevelopmentMinutesV1(
  blockMinutes: number,
  activityRate: number,
  exposureCredit: number,
): number {
  return blockMinutes * clamp(activityRate, 0, 1) * Math.max(0, exposureCredit);
}

function makeCredit(
  label: string,
  role: ModuleDevelopmentRole,
  playerExposureMinutes: number,
  activityRate: number,
  weights: ExposureCreditWeights,
  drillId?: string,
  progressionStage?: ProgressionStage,
): DevelopmentExposureCredit {
  const exposureCredit = weights[role];
  return {
    moduleId: moduleIdForLabel(label),
    moduleLabel: label,
    role,
    exposureCredit,
    playerExposureMinutes,
    creditedMinutes: playerExposureMinutes * exposureCredit,
    activityRate,
    effectiveDevelopmentMinutes: effectiveDevelopmentMinutesV1(
      playerExposureMinutes,
      activityRate,
      exposureCredit,
    ),
    drillId,
    progressionStage,
  };
}

function focusToModuleLabel(focus: string): string | undefined {
  const text = focus.toLowerCase();
  const labels = [
    'Ball Mastery',
    'Stationary Ball Handling',
    'Moving Ball Handling',
    'Change of Direction',
    'Combination Moves',
    'Footwork',
    'Triple Threat',
    'Passing',
    'Shooting',
    'Finishing',
    'Offensive Concepts / Spacing',
    '1-on-1 Offensive Development',
  ];
  return labels.find((label) =>
    label
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 4)
      .some((token) => text.includes(token)),
  );
}

export function calculateWeeklyModuleExposureV1(
  plan: WeeklyDevelopmentPlan,
  weights: ExposureCreditWeights = DEFAULT_EXPOSURE_CREDIT_WEIGHTS,
): WeeklyModuleExposureReport {
  const blocks: BlockDevelopmentExposure[] = [];
  const modules: Record<string, ModuleExposureSummary> = {};
  let weakSideEffectiveMinutes = 0;

  for (const practice of plan.practicePlans) {
    for (const block of practice.blocks) {
      const activityRate = resolveActivityRateV1(block);
      const drillCount = Math.max(1, block.drills.length);
      const playerMinutesPerStationOrDrill = block.duration / drillCount;
      const credits: DevelopmentExposureCredit[] = [];
      const blockRole = roleForBlock(block);

      if (block.type === 'ATHLETIC') {
        credits.push(
          makeCredit(
            athleticLabelFromFocus(block.focus),
            'PRIMARY',
            block.duration,
            activityRate,
            weights,
          ),
        );
        credits.push(
          makeCredit(
            'Movement Preparation',
            'INTEGRATED',
            block.duration,
            activityRate,
            weights,
          ),
        );
      }

      for (const candidate of block.drills) {
        const primaryLabel = canonicalModuleLabel(candidate.drill.moduleCode);
        credits.push(
          makeCredit(
            primaryLabel,
            blockRole,
            playerMinutesPerStationOrDrill,
            activityRate,
            weights,
            candidate.drill.id,
            candidate.progressionStage,
          ),
        );
        for (const secondary of candidate.metadata.secondarySkills ?? []) {
          credits.push(
            makeCredit(
              secondary,
              'INTEGRATED',
              playerMinutesPerStationOrDrill,
              activityRate,
              weights,
              candidate.drill.id,
              candidate.progressionStage,
            ),
          );
        }
        if (
          candidate.metadata.bothHands ||
          candidate.drill.name.toLowerCase().includes('left') ||
          candidate.drill.name.toLowerCase().includes('weak')
        ) {
          weakSideEffectiveMinutes += effectiveDevelopmentMinutesV1(
            playerMinutesPerStationOrDrill,
            activityRate,
            weights.MAINTENANCE,
          );
        }
      }

      if (block.type === 'APPLICATION' || block.type === 'COMPETITION') {
        credits.push(
          makeCredit(
            'Situational / SSG',
            'APPLICATION',
            block.duration,
            activityRate,
            weights,
          ),
        );
        credits.push(
          makeCredit(
            'Decision / Application',
            'APPLICATION',
            block.duration,
            activityRate,
            weights,
          ),
        );
        const format = block.ssgConstraint?.format;
        if (format) {
          credits.push(
            makeCredit(
              format,
              'INTEGRATED',
              block.duration,
              activityRate,
              weights,
            ),
          );
        }
        const connectedModule = focusToModuleLabel(
          block.ssgConstraint?.goal ?? block.focus,
        );
        if (connectedModule) {
          credits.push(
            makeCredit(
              connectedModule,
              'INTEGRATED',
              block.duration,
              activityRate,
              weights,
            ),
          );
        }
      }

      blocks.push({
        weekId: plan.weekId,
        practiceNumber: practice.practiceNumber,
        blockId: block.id,
        blockMinutes: block.duration,
        playerMinutesPerStationOrDrill,
        activityRate,
        credits,
      });

      for (const credit of credits) {
        const current = modules[credit.moduleId] ?? {
          moduleId: credit.moduleId,
          moduleLabel: credit.moduleLabel,
          blockMinutes: 0,
          creditedMinutes: 0,
          effectiveDevelopmentMinutes: 0,
          frequency: 0,
          practiceNumbers: [],
          roles: [],
          progressionStages: [],
          drillIds: [],
        };
        current.blockMinutes += credit.playerExposureMinutes;
        current.creditedMinutes += credit.creditedMinutes;
        current.effectiveDevelopmentMinutes += credit.effectiveDevelopmentMinutes;
        current.practiceNumbers.push(practice.practiceNumber);
        current.roles.push(credit.role);
        if (credit.progressionStage) {
          current.progressionStages.push(credit.progressionStage);
        }
        if (credit.drillId) current.drillIds.push(credit.drillId);
        current.practiceNumbers = unique(current.practiceNumbers);
        current.frequency = current.practiceNumbers.length;
        current.roles = unique(current.roles);
        current.progressionStages = unique(current.progressionStages);
        current.drillIds = unique(current.drillIds);
        modules[credit.moduleId] = current;
      }
    }
  }

  const totalClockMinutes = blocks.reduce(
    (sum, block) => sum + block.blockMinutes,
    0,
  );
  const averageActivityRate = blocks.length
    ? blocks.reduce((sum, block) => sum + block.activityRate, 0) / blocks.length
    : 0;

  return {
    weekId: plan.weekId,
    totalClockMinutes,
    expectedClockMinutes: plan.practicesPerWeek * plan.practiceDuration,
    blocks,
    modules,
    weakSideEffectiveMinutes,
    averageActivityRate,
  };
}

function pushIssue(
  issues: ModuleFrequencyValidationIssue[],
  issue: ModuleFrequencyValidationIssue,
): void {
  if (
    !issues.some(
      (existing) =>
        existing.flag === issue.flag && existing.moduleId === issue.moduleId,
    )
  ) {
    issues.push(issue);
  }
}

function minutesFor(
  exposure: WeeklyModuleExposureReport,
  label: string,
): number {
  return exposure.modules[moduleIdForLabel(label)]?.creditedMinutes ?? 0;
}

function frequencyFor(
  exposure: WeeklyModuleExposureReport,
  label: string,
): number {
  return exposure.modules[moduleIdForLabel(label)]?.frequency ?? 0;
}

function targetLowerBound(target: ScaledModuleFrequencyTarget): number {
  return target.targetWeeklyMinutesMin * (1 - target.flexibilityPercent / 100);
}

function targetUpperBound(target: ScaledModuleFrequencyTarget): number {
  return Math.max(
    target.maximumWeeklyMinutes,
    target.targetWeeklyMinutesMax * (1 + target.flexibilityPercent / 100),
  );
}

export function validateModuleFrequencyWeekV1(
  plan: WeeklyDevelopmentPlan,
  exposure: WeeklyModuleExposureReport,
  scaledTargets: Record<string, ScaledModuleFrequencyTarget>,
): ModuleFrequencyValidation {
  const issues: ModuleFrequencyValidationIssue[] = [];

  for (const target of Object.values(scaledTargets)) {
    const actual = exposure.modules[target.moduleId]?.creditedMinutes ?? 0;
    const frequency = exposure.modules[target.moduleId]?.frequency ?? 0;
    if (
      target.requiredWeeklyExposure === 'YES' &&
      (actual < targetLowerBound(target) || frequency < target.targetFrequencyMin)
    ) {
      pushIssue(issues, {
        flag: 'UNDEREXPOSED_CORE_MODULE',
        moduleId: target.moduleId,
        message:
          target.label +
          ' is below the protected CORE development band (' +
          actual.toFixed(1) +
          ' min).',
        actualMinutes: actual,
        targetMinutesMin: target.targetWeeklyMinutesMin,
        targetMinutesMax: target.targetWeeklyMinutesMax,
        targetedRegeneration: 'WEEK',
      });
    }
    if (actual > targetUpperBound(target)) {
      pushIssue(issues, {
        flag: 'OVEREXPOSED_SINGLE_MODULE',
        moduleId: target.moduleId,
        message:
          target.label +
          ' exceeds its flexible weekly maximum (' +
          actual.toFixed(1) +
          ' min).',
        actualMinutes: actual,
        targetMinutesMin: target.targetWeeklyMinutesMin,
        targetMinutesMax: target.targetWeeklyMinutesMax,
        targetedRegeneration: 'BLOCK',
      });
    }
  }

  const specificChecks: Array<{
    label: string;
    flag: ModuleFrequencyQualityFlag;
  }> = [
    { label: 'Shooting', flag: 'INSUFFICIENT_SHOOTING_EXPOSURE' },
    { label: 'Passing', flag: 'INSUFFICIENT_PASSING_EXPOSURE' },
    { label: 'Finishing', flag: 'INSUFFICIENT_FINISHING_EXPOSURE' },
    { label: 'Situational / SSG', flag: 'INSUFFICIENT_SSG' },
  ];

  for (const check of specificChecks) {
    const id = moduleIdForLabel(check.label);
    const target = scaledTargets[id];
    if (
      target &&
      (minutesFor(exposure, check.label) < targetLowerBound(target) ||
        frequencyFor(exposure, check.label) < target.targetFrequencyMin)
    ) {
      pushIssue(issues, {
        flag: check.flag,
        moduleId: id,
        message: check.label + ' does not have enough meaningful weekly exposure.',
        actualMinutes: minutesFor(exposure, check.label),
        targetMinutesMin: target.targetWeeklyMinutesMin,
        targetMinutesMax: target.targetWeeklyMinutesMax,
        targetedRegeneration: 'WEEK',
      });
    }
  }

  const ballControlLabels = [
    'Ball Mastery',
    'Stationary Ball Handling',
    'Moving Ball Handling',
    'Change of Direction',
    'Combination Moves',
  ];
  const ballControlMinutes = ballControlLabels.reduce(
    (sum, label) => sum + minutesFor(exposure, label),
    0,
  );
  const ballControlTarget = Math.round(
    30 *
      FREQUENCY_SCALE[plan.practicesPerWeek] *
      DURATION_SCALE[plan.practiceDuration],
  );
  if (ballControlMinutes < ballControlTarget * 0.8) {
    pushIssue(issues, {
      flag: 'INSUFFICIENT_BALL_CONTROL',
      message: 'Combined ball-control exposure is below the protected weekly band.',
      actualMinutes: ballControlMinutes,
      targetMinutesMin: ballControlTarget,
      targetedRegeneration: 'WEEK',
    });
  }

  const stationary = minutesFor(exposure, 'Stationary Ball Handling');
  const stationaryTarget = scaledTargets[moduleIdForLabel('Stationary Ball Handling')];
  if (
    stationaryTarget &&
    (stationary > targetUpperBound(stationaryTarget) ||
      stationary > exposure.totalClockMinutes * 0.2)
  ) {
    pushIssue(issues, {
      flag: 'EXCESSIVE_STATIONARY_WORK',
      moduleId: stationaryTarget.moduleId,
      message: 'Stationary work displaces movement or application.',
      actualMinutes: stationary,
      targetMinutesMax: stationaryTarget.targetWeeklyMinutesMax,
      targetedRegeneration: 'BLOCK',
    });
  }

  const combination = minutesFor(exposure, 'Combination Moves');
  const combinationTarget = scaledTargets[moduleIdForLabel('Combination Moves')];
  if (combinationTarget && combination > targetUpperBound(combinationTarget)) {
    pushIssue(issues, {
      flag: 'EXCESSIVE_COMBINATION_WORK',
      moduleId: combinationTarget.moduleId,
      message: 'Combination volume is above the age-level development band.',
      actualMinutes: combination,
      targetMinutesMax: combinationTarget.targetWeeklyMinutesMax,
      targetedRegeneration: 'BLOCK',
    });
  }

  if (
    plan.ageBand === 'U8-9' &&
    (minutesFor(exposure, '4v4') > 0 || minutesFor(exposure, '5v5') > 0)
  ) {
    pushIssue(issues, {
      flag: 'AGE_INAPPROPRIATE_MODULE_VOLUME',
      message: 'Complex 4v4/5v5 volume is not appropriate for the U8-9 profile.',
      targetedRegeneration: 'BLOCK',
    });
  }

  if (
    plan.bpdsLevel === 1 &&
    (minutesFor(exposure, 'Two-Ball Series') >
      (scaledTargets[moduleIdForLabel('Two-Ball Series')]?.targetWeeklyMinutesMax ?? 0) ||
      combination >
        (scaledTargets[moduleIdForLabel('Combination Moves')]
          ?.targetWeeklyMinutesMax ?? 0))
  ) {
    pushIssue(issues, {
      flag: 'LEVEL_INAPPROPRIATE_MODULE_VOLUME',
      message: 'Advanced coordination or combination volume exceeds Level 1.',
      targetedRegeneration: 'BLOCK',
    });
  }

  const weakSideMinimum =
    5 *
    FREQUENCY_SCALE[plan.practicesPerWeek] *
    DURATION_SCALE[plan.practiceDuration];
  if (exposure.weakSideEffectiveMinutes < weakSideMinimum) {
    pushIssue(issues, {
      flag: 'MISSING_WEAK_SIDE_EXPOSURE',
      message: 'Weak-side development is below the internal youth minimum.',
      actualMinutes: exposure.weakSideEffectiveMinutes,
      targetMinutesMin: weakSideMinimum,
      targetedRegeneration: 'PRACTICE',
    });
  }

  const flags = unique(issues.map((issue) => issue.flag));
  return {
    valid: issues.length === 0,
    flags,
    issues,
    underexposedModules: unique(
      issues
        .filter((issue) =>
          [
            'UNDEREXPOSED_CORE_MODULE',
            'INSUFFICIENT_SHOOTING_EXPOSURE',
            'INSUFFICIENT_PASSING_EXPOSURE',
            'INSUFFICIENT_FINISHING_EXPOSURE',
            'INSUFFICIENT_BALL_CONTROL',
            'INSUFFICIENT_SSG',
          ].includes(issue.flag),
        )
        .map((issue) => issue.moduleId ?? issue.flag),
    ),
    overexposedModules: unique(
      issues
        .filter((issue) =>
          [
            'OVEREXPOSED_SINGLE_MODULE',
            'EXCESSIVE_STATIONARY_WORK',
            'EXCESSIVE_COMBINATION_WORK',
          ].includes(issue.flag),
        )
        .map((issue) => issue.moduleId ?? issue.flag),
    ),
  };
}

function autoGoalsForWeek(weekIndex: number): {
  primary: string[];
  secondary: string[];
  review: string[];
} {
  const rotations = [
    {
      primary: [
        'Ball Handling / Change of Direction',
        'Passing / Shooting',
        'Decision Making / 1v1',
      ],
      secondary: ['Finishing', 'Footwork', 'Shooting'],
      review: ['Ball Control quality', 'Moving Ball Handling', 'Finishing both sides'],
    },
    {
      primary: ['Shooting', 'Moving Ball Handling / COD', 'Passing / Finishing'],
      secondary: ['Passing', '1v1', 'Offensive Spacing'],
      review: ['Shot mechanics', 'Ball Handling in movement', 'Decision quality'],
    },
    {
      primary: ['Finishing / 1v1', 'Shooting / Footwork', 'Spacing / Decision'],
      secondary: ['Ball Control', 'Passing', 'Shooting'],
      review: ['Weak-side finishing', 'Passing decisions', 'Change of Direction'],
    },
    {
      primary: ['Passing / Spacing', 'Ball Handling / 1v1', 'Shooting / Finishing'],
      secondary: ['Shooting', 'Footwork', 'Decision Making'],
      review: ['Pass and cut', 'COD transfer', 'Finishing both sides'],
    },
  ];
  return rotations[weekIndex % rotations.length];
}

export function generateModuleMatrixWeekV1(
  drills: Drill[],
  input: WeeklyProgrammingInput,
  weekIndex = 0,
  weights: ExposureCreditWeights = DEFAULT_EXPOSURE_CREDIT_WEIGHTS,
): ModuleMatrixWeekResult {
  const profile = getModuleFrequencyProfileV1(
    input.chronologicalAge,
    input.bpdsLevel ?? 1,
  );
  const autoGoals =
    input.manualPrimaryGoals?.length || (input.focusPreset ?? 'AUTO') !== 'AUTO'
      ? undefined
      : autoGoalsForWeek(weekIndex);
  const effectiveInput: WeeklyProgrammingInput = {
    ...input,
    manualPrimaryGoals: input.manualPrimaryGoals ?? autoGoals?.primary,
    manualSecondaryGoals: input.manualSecondaryGoals ?? autoGoals?.secondary,
    manualReviewGoals: input.manualReviewGoals ?? autoGoals?.review,
  };
  const scaledTargets = scaleModuleFrequencyTargetsV1(
    profile,
    input.practicesPerWeek,
    input.practiceDuration,
    effectiveInput.manualPrimaryGoals,
  );
  const plan = generateWeeklyProgramV1(drills, effectiveInput);
  const exposure = calculateWeeklyModuleExposureV1(plan, weights);
  const moduleValidation = validateModuleFrequencyWeekV1(
    plan,
    exposure,
    scaledTargets,
  );
  return {
    engineVersion: MODULE_FREQUENCY_MINUTES_MATRIX_VERSION,
    activeInCoachApp: false,
    profile,
    scaledTargets,
    plan,
    exposure,
    moduleValidation,
  };
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function simulationPracticeSummary(
  plan: WeeklyDevelopmentPlan,
): SimulationPracticeSummary[] {
  return plan.practicePlans.map((practice) => ({
    practiceNumber: practice.practiceNumber,
    practiceRoles: [...practice.roles],
    athleticFocus: practice.athleticGoal,
    primaryGoal: practice.primaryGoal,
    secondaryGoal: practice.secondaryGoal,
    reviewGoal: practice.reviewGoal,
    blocks: practice.blocks.map((block) => ({
      blockId: block.id,
      blockType: block.type,
      focus: block.focus,
      duration: block.duration,
      selectedDrills: block.drills.map((candidate) => ({
        drillId: candidate.drill.id,
        drillName: candidate.drill.name,
        duration: block.drills.length
          ? block.duration / block.drills.length
          : block.duration,
        skillFamily: candidate.skillFamily,
        progressionStage: candidate.progressionStage,
      })),
      ssgFormat: block.ssgConstraint?.format,
    })),
    totalDuration: practice.blocks.reduce(
      (sum, block) => sum + block.duration,
      0,
    ),
  }));
}

function skillFamilyProgression(
  plan: WeeklyDevelopmentPlan,
): Record<string, ProgressionStage[]> {
  return Object.fromEntries(
    Object.entries(plan.skillFamilyExposures).map(([family, exposure]) => [
      family,
      [...exposure.stageHistory],
    ]),
  );
}

function moduleExposureForSummary(
  exposure: WeeklyModuleExposureReport,
): SimulationWeekSummary['weeklyModuleExposure'] {
  return Object.fromEntries(
    Object.values(exposure.modules)
      .filter((module) => module.creditedMinutes > 0)
      .map((module) => [
        module.moduleLabel,
        {
          creditedMinutes: Number(module.creditedMinutes.toFixed(1)),
          effectiveDevelopmentMinutes: Number(
            module.effectiveDevelopmentMinutes.toFixed(1),
          ),
          frequency: module.frequency,
        },
      ]),
  );
}

export function runU12Level2FourWeekSimulationV1(
  drills: Drill[],
  baseInput: WeeklyProgrammingInput,
): FourWeekSimulationResult {
  const weeks: SimulationWeekSummary[] = [];
  const previousPlans: WeeklyDevelopmentPlan[] = [];
  const history: DrillUsage[] = [];
  const allUsedDrillIds: string[] = [];
  const familyStages: Record<string, ProgressionStage[]> = {};
  const familyWeeks: Record<string, number[]> = {};

  for (let weekIndex = 0; weekIndex < 4; weekIndex += 1) {
    const referenceDate = addDays(
      baseInput.referenceDate ?? '2026-08-24T12:00:00.000Z',
      weekIndex * 7,
    );
    const input: WeeklyProgrammingInput = {
      ...baseInput,
      chronologicalAge: 12,
      bpdsLevel: 2,
      practicesPerWeek: 3,
      practiceDuration: 90,
      focusPreset: 'AUTO',
      weekId: 'u12-l2-simulation-week-' + (weekIndex + 1),
      referenceDate,
      previousWeeks: previousPlans.slice(-3),
      previousPracticeHistory: [...history],
      recentSkillFamilies: unique(Object.keys(familyStages)),
      manualPrimaryGoals: undefined,
      manualSecondaryGoals: undefined,
      manualReviewGoals: undefined,
    };
    const result = generateModuleMatrixWeekV1(drills, input, weekIndex);
    const weekCandidates = result.plan.practicePlans.flatMap((practice) =>
      practice.blocks.flatMap((block) => block.drills),
    );
    const weekDrillIds = unique(
      weekCandidates.map((candidate) => candidate.drill.id),
    );
    const repeated = unique(
      weekDrillIds.filter((drillId) => allUsedDrillIds.includes(drillId)),
    );
    for (const candidate of weekCandidates) {
      history.push({
        drillId: candidate.drill.id,
        skillFamily: candidate.skillFamily,
        usedAt: referenceDate,
        completed: true,
        successful: true,
      });
      familyStages[candidate.skillFamily] = unique([
        ...(familyStages[candidate.skillFamily] ?? []),
        candidate.progressionStage,
      ]);
      familyWeeks[candidate.skillFamily] = unique([
        ...(familyWeeks[candidate.skillFamily] ?? []),
        weekIndex + 1,
      ]);
    }
    allUsedDrillIds.push(...weekDrillIds);
    previousPlans.push(result.plan);

    weeks.push({
      weekNumber: weekIndex + 1,
      weekId: result.plan.weekId,
      practices: simulationPracticeSummary(result.plan),
      weeklyModuleExposure: moduleExposureForSummary(result.exposure),
      skillFamilyProgression: skillFamilyProgression(result.plan),
      exactDrillRepetitions: repeated,
      weeklyCoherence: result.plan.coherenceScore.total,
      qualityFlags: unique([
        ...result.plan.validation.flags,
        ...result.moduleValidation.flags,
      ]),
      underexposedModules: result.moduleValidation.underexposedModules,
      overexposedModules: result.moduleValidation.overexposedModules,
    });
  }

  const exactDrillRepeatCount = weeks.reduce(
    (sum, week) => sum + week.exactDrillRepetitions.length,
    0,
  );
  const continuedSkillFamilies = Object.entries(familyWeeks)
    .filter(([, weekNumbers]) => weekNumbers.length >= 2)
    .map(([family]) => family);
  const progressedSkillFamilies = Object.entries(familyStages)
    .filter(([, stages]) => {
      const indices = stages
        .map((stage) =>
          [
            'Technique',
            'Movement',
            'Speed',
            'Combination',
            'Reaction',
            'Defender',
            'Game',
          ].indexOf(stage),
        )
        .filter((index) => index >= 0);
      return indices.length >= 2 && Math.max(...indices) > Math.min(...indices);
    })
    .map(([family]) => family);
  const allQualityFlags = unique(weeks.flatMap((week) => week.qualityFlags));
  const underexposedModules = unique(
    weeks.flatMap((week) => week.underexposedModules),
  );
  const overexposedModules = unique(
    weeks.flatMap((week) => week.overexposedModules),
  );
  const structureKeys = weeks.map((week) =>
    week.practices.map((practice) => practice.primaryGoal).join('|'),
  );

  const methodologicalWeaknesses: string[] = [];
  if (underexposedModules.length) {
    methodologicalWeaknesses.push(
      'The current weekly selector does not yet guarantee every protected CORE exposure band.',
    );
  }
  if (overexposedModules.length) {
    methodologicalWeaknesses.push(
      'One or more modules can absorb too much credited exposure through repeated integration.',
    );
  }
  if (exactDrillRepeatCount > 8) {
    methodologicalWeaknesses.push(
      'Cross-week exact-drill novelty needs a stronger rolling penalty.',
    );
  }
  if (unique(structureKeys).length < 4) {
    methodologicalWeaknesses.push(
      'AUTO goals need more week-to-week structural variation.',
    );
  }
  if (!progressedSkillFamilies.length) {
    methodologicalWeaknesses.push(
      'Skill-family stage progression is not strong enough across the four-week window.',
    );
  }

  const recommendationsBeforeActivation = [
    'Keep the matrix as an advisory and validation layer until the four-week output is manually approved.',
    'Use targeted block regeneration for CORE underexposure instead of forcing every module.',
    'Retain the 20% flexibility band for coach goals and resource constraints.',
    'Do not activate coach-facing controls until cross-week history is persisted.',
  ];
  if (underexposedModules.length) {
    recommendationsBeforeActivation.push(
      'Add matrix-aware candidate bonuses for the specific underexposed CORE modules.',
    );
  }
  if (exactDrillRepeatCount > 8) {
    recommendationsBeforeActivation.push(
      'Increase the rolling 21-day exact-drill penalty before activation.',
    );
  }

  return {
    engineVersion: MODULE_FREQUENCY_MINUTES_MATRIX_VERSION,
    activeInCoachApp: false,
    profile: 'U12-13-L2',
    weeks,
    exactDrillRepeatCount,
    continuedSkillFamilies,
    progressedSkillFamilies,
    allQualityFlags,
    underexposedModules,
    overexposedModules,
    methodologicalWeaknesses,
    recommendationsBeforeActivation,
  };
}

export function formatFourWeekSimulationSummaryV1(
  simulation: FourWeekSimulationResult,
): string {
  const lines: string[] = [
    'BPDS U12 LEVEL 2 - FOUR WEEK DETERMINISTIC SIMULATION',
    'Engine active in coach app: NO',
  ];
  for (const week of simulation.weeks) {
    lines.push(
      'WEEK ' +
        week.weekNumber +
        ' | coherence ' +
        week.weeklyCoherence +
        '/100 | exact cross-week repeats ' +
        week.exactDrillRepetitions.length,
    );
    for (const practice of week.practices) {
      lines.push(
        '  P' +
          practice.practiceNumber +
          ' ' +
          practice.practiceRoles.join('/') +
          ' | ' +
          practice.athleticFocus +
          ' | primary ' +
          practice.primaryGoal +
          ' | secondary ' +
          practice.secondaryGoal +
          ' | review ' +
          practice.reviewGoal +
          ' | ' +
          practice.totalDuration +
          ' min',
      );
      for (const block of practice.blocks) {
        lines.push(
          '    ' +
            block.blockType +
            ' ' +
            block.duration +
            ' min | ' +
            block.focus +
            (block.ssgFormat ? ' | SSG ' + block.ssgFormat : '') +
            ' | drills: ' +
            (block.selectedDrills
              .map(
                (drill) =>
                  drill.drillId +
                  ' (' +
                  drill.duration.toFixed(1) +
                  'm, ' +
                  drill.skillFamily +
                  ', ' +
                  drill.progressionStage +
                  ')',
              )
              .join(', ') || 'none'),
        );
      }
    }
    const exposureSummary = Object.entries(week.weeklyModuleExposure)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([moduleLabel, exposure]) =>
          moduleLabel +
          ' ' +
          exposure.creditedMinutes.toFixed(1) +
          ' credited/' +
          exposure.effectiveDevelopmentMinutes.toFixed(1) +
          ' effective min, f' +
          exposure.frequency,
      )
      .join('; ');
    const progressionSummary = Object.entries(week.skillFamilyProgression)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([family, stages]) =>
          family + ': ' + (stages.join(' > ') || 'no stage'),
      )
      .join('; ');
    lines.push(
      '  EXPOSURE: ' + (exposureSummary || 'none'),
      '  PROGRESSION: ' + (progressionSummary || 'none'),
      '  EXACT REPEATS: ' +
        (week.exactDrillRepetitions.join(', ') || 'none'),
    );
    lines.push(
      '  FLAGS: ' + (week.qualityFlags.join(', ') || 'none'),
      '  UNDER: ' + (week.underexposedModules.join(', ') || 'none'),
      '  OVER: ' + (week.overexposedModules.join(', ') || 'none'),
    );
  }
  lines.push(
    'ALL FLAGS: ' + (simulation.allQualityFlags.join(', ') || 'none'),
    'CONTINUED FAMILIES: ' +
      (simulation.continuedSkillFamilies.join(', ') || 'none'),
    'PROGRESSED FAMILIES: ' +
      (simulation.progressedSkillFamilies.join(', ') || 'none'),
    'WEAKNESSES: ' +
      (simulation.methodologicalWeaknesses.join(' | ') || 'none'),
    'RECOMMENDATIONS: ' +
      simulation.recommendationsBeforeActivation.join(' | '),
  );
  return lines.join('\n');
}

