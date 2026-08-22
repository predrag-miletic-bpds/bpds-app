import type {
  AthleticFocus,
  CognitiveLoad,
  ContactLevel,
  Drill,
  ProgressionStage,
} from '@predrag-miletic/bpds-methodology.entities.methodology';
import type { SkillLevel } from '@predrag-miletic/bpds-storage.entities.shared-types';
import {
  evaluateDrillV1,
  normalizeDrillGeneratorMetadata,
  orderDrillsMethodicallyV1,
  PROGRESSION_STAGE_ORDER,
  type DrillCandidate,
  type GeneratorBlock,
  type GeneratorBlockSpec,
  type GeneratorEngineContext,
  type GeneratorEngineConfig,
} from './generator-engine-v1.js';

/**
 * BPDS Practice Generator AGE x LEVEL MATRIX v1.0.
 *
 * This file is an opt-in methodological layer for Generator Engine v1.
 * It is deliberately not connected to the coach-facing Generate screen yet.
 */
export const AGE_LEVEL_MATRIX_VERSION = '1.0.0';

export type AgeBandId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type ConfiguredAgeBandId = 'A' | 'B' | 'C';

export type AgeBandDefinition = {
  id: AgeBandId;
  label: string;
  minimumAge: number;
  maximumAge: number | null;
  developmentPhase: string;
  configured: boolean;
};

export const AGE_BAND_ARCHITECTURE_V1: AgeBandDefinition[] = [
  {
    id: 'A',
    label: 'U8-U9',
    minimumAge: 8,
    maximumAge: 9,
    developmentPhase: 'Foundation / Explore',
    configured: true,
  },
  {
    id: 'B',
    label: 'U10-U11',
    minimumAge: 10,
    maximumAge: 11,
    developmentPhase: 'Skill Acquisition',
    configured: true,
  },
  {
    id: 'C',
    label: 'U12-U13',
    minimumAge: 12,
    maximumAge: 13,
    developmentPhase: 'Skill Application',
    configured: true,
  },
  {
    id: 'D',
    label: 'U14-U16',
    minimumAge: 14,
    maximumAge: 16,
    developmentPhase: 'Advanced Application',
    configured: false,
  },
  {
    id: 'E',
    label: 'U17-U19',
    minimumAge: 17,
    maximumAge: 19,
    developmentPhase: 'Performance Preparation',
    configured: false,
  },
  {
    id: 'F',
    label: 'Senior / Professional',
    minimumAge: 20,
    maximumAge: null,
    developmentPhase: 'Performance',
    configured: false,
  },
];

export const AGE_SAFETY_HIERARCHY_V1 = [
  'Age appropriateness',
  'Prerequisites',
  'BPDS Level',
  'Development need',
  'Weekly context',
  'Drill score',
] as const;

export type BothHandsPriority = 'Introduction' | 'Balanced' | 'Integrated';

export type AgeLevelProfile = {
  id: string;
  ageBand: ConfiguredAgeBandId;
  level: SkillLevel;
  title: string;
  emphasis: string[];
  maxDifficultyScore: number;
  stageWeights: Record<ProgressionStage, number>;
  preferredModules: string[];
  blockedModules: string[];
  maxCognitiveLoad: CognitiveLoad;
  maxContactLevel: ContactLevel;
  maxCombinationElements: number;
  allowOffDribbleShooting: boolean;
  maxTacticalComplexity: 1 | 2 | 3;
  maxSmallSidedPlayersPerTeam: number;
  bothHandsPriority: BothHandsPriority;
};

function stages(
  technique: number,
  movement: number,
  speed: number,
  combination: number,
  reaction: number,
  defender: number,
  game: number,
): Record<ProgressionStage, number> {
  return {
    Technique: technique,
    Movement: movement,
    Speed: speed,
    Combination: combination,
    Reaction: reaction,
    Defender: defender,
    Game: game,
  };
}

export const AGE_LEVEL_PROFILES_V1: Record<string, AgeLevelProfile> = {
  'A-L1': {
    id: 'A-L1',
    ageBand: 'A',
    level: 1,
    title: 'U8-U9 Level 1 Foundation',
    emphasis: [
      'movement literacy',
      'ball familiarity',
      'single-skill control',
      'guided 1v1 and 2v2 play',
    ],
    maxDifficultyScore: 4,
    stageWeights: stages(35, 25, 10, 0, 0, 0, 15),
    preferredModules: ['WUP', 'BM', 'SBH', 'FIN', 'PAS', 'SH', 'SSG'],
    blockedModules: ['PNR', 'ADV', 'TRD', 'TOC', 'TOF', 'OBM', 'OBS'],
    maxCognitiveLoad: 'Low',
    maxContactLevel: 'None',
    maxCombinationElements: 1,
    allowOffDribbleShooting: false,
    maxTacticalComplexity: 1,
    maxSmallSidedPlayersPerTeam: 2,
    bothHandsPriority: 'Introduction',
  },
  'A-L2': {
    id: 'A-L2',
    ageBand: 'A',
    level: 2,
    title: 'U8-U9 Level 2 Development',
    emphasis: [
      'bilateral control',
      'technique into movement',
      'short speed exposure',
      'simple guided decisions',
    ],
    maxDifficultyScore: 6,
    stageWeights: stages(30, 25, 15, 10, 5, 0, 15),
    preferredModules: ['WUP', 'BM', 'SBH', 'MBH', 'COD', 'FIN', 'PAS', 'SH', 'SSG'],
    blockedModules: ['ADV', 'TRD', 'TOC', 'TOF', 'OBM', 'OBS'],
    maxCognitiveLoad: 'Medium',
    maxContactLevel: 'Guided',
    maxCombinationElements: 2,
    allowOffDribbleShooting: false,
    maxTacticalComplexity: 1,
    maxSmallSidedPlayersPerTeam: 2,
    bothHandsPriority: 'Balanced',
  },
  'A-L3': {
    id: 'A-L3',
    ageBand: 'A',
    level: 3,
    title: 'U8-U9 Level 3 Age-Capped Performance',
    emphasis: [
      'advanced execution without adult complexity',
      'reaction after stable technique',
      'creative 1v1 and 2v2 play',
    ],
    maxDifficultyScore: 7,
    stageWeights: stages(25, 25, 15, 15, 10, 5, 15),
    preferredModules: ['WUP', 'BM', 'SBH', 'MBH', 'COD', 'COM', 'FIN', 'PAS', 'SH', 'SSG'],
    blockedModules: ['ADV', 'TRD', 'TOC', 'TOF', 'OBM', 'OBS'],
    maxCognitiveLoad: 'Medium',
    maxContactLevel: 'Guided',
    maxCombinationElements: 2,
    allowOffDribbleShooting: false,
    maxTacticalComplexity: 2,
    maxSmallSidedPlayersPerTeam: 2,
    bothHandsPriority: 'Integrated',
  },
  'B-L1': {
    id: 'B-L1',
    ageBand: 'B',
    level: 1,
    title: 'U10-U11 Level 1 Foundation',
    emphasis: [
      'rebuild correct technique',
      'balance and stopping',
      'simple movement transfer',
      'small-sided confidence',
    ],
    maxDifficultyScore: 4,
    stageWeights: stages(35, 25, 10, 5, 0, 0, 15),
    preferredModules: ['WUP', 'BM', 'SBH', 'MBH', 'FW', 'FIN', 'PAS', 'SH', 'SSG'],
    blockedModules: ['ADV', 'TRD', 'TOC', 'TOF'],
    maxCognitiveLoad: 'Low',
    maxContactLevel: 'Guided',
    maxCombinationElements: 1,
    allowOffDribbleShooting: false,
    maxTacticalComplexity: 1,
    maxSmallSidedPlayersPerTeam: 3,
    bothHandsPriority: 'Introduction',
  },
  'B-L2': {
    id: 'B-L2',
    ageBand: 'B',
    level: 2,
    title: 'U10-U11 Level 2 Skill Acquisition',
    emphasis: [
      'technique at movement speed',
      'change of direction',
      'two-element combinations',
      'guided reads and 1v1 to 3v3',
    ],
    maxDifficultyScore: 7,
    stageWeights: stages(25, 25, 15, 15, 10, 5, 15),
    preferredModules: ['WUP', 'BM', 'SBH', 'MBH', 'COD', 'COM', 'FIN', 'FW', 'PAS', 'SH', 'SSG'],
    blockedModules: ['ADV', 'TRD', 'TOC', 'TOF'],
    maxCognitiveLoad: 'Medium',
    maxContactLevel: 'Guided',
    maxCombinationElements: 2,
    allowOffDribbleShooting: true,
    maxTacticalComplexity: 2,
    maxSmallSidedPlayersPerTeam: 3,
    bothHandsPriority: 'Balanced',
  },
  'B-L3': {
    id: 'B-L3',
    ageBand: 'B',
    level: 3,
    title: 'U10-U11 Level 3 Performance',
    emphasis: [
      'fast stable execution',
      'reaction and defender reads',
      'three-element combinations',
      'competitive 1v1 to 3v3',
    ],
    maxDifficultyScore: 8,
    stageWeights: stages(20, 20, 15, 15, 15, 10, 20),
    preferredModules: ['WUP', 'BM', 'SBH', 'MBH', 'COD', 'COM', 'FIN', 'FW', 'ATT', 'PAS', 'SH', 'SSG'],
    blockedModules: ['ADV', 'TRD', 'TOC', 'TOF'],
    maxCognitiveLoad: 'High',
    maxContactLevel: 'Guided',
    maxCombinationElements: 3,
    allowOffDribbleShooting: true,
    maxTacticalComplexity: 2,
    maxSmallSidedPlayersPerTeam: 3,
    bothHandsPriority: 'Integrated',
  },
  'C-L1': {
    id: 'C-L1',
    ageBand: 'C',
    level: 1,
    title: 'U12-U13 Level 1 Foundation',
    emphasis: [
      'technical correction',
      'movement quality',
      'controlled application',
      'simple 1v1 to 3v3 decisions',
    ],
    maxDifficultyScore: 4,
    stageWeights: stages(30, 25, 15, 10, 5, 0, 15),
    preferredModules: ['WUP', 'BM', 'SBH', 'MBH', 'FW', 'FIN', 'PAS', 'SH', 'SSG'],
    blockedModules: ['ADV', 'TRD', 'TOC', 'TOF'],
    maxCognitiveLoad: 'Medium',
    maxContactLevel: 'Guided',
    maxCombinationElements: 2,
    allowOffDribbleShooting: false,
    maxTacticalComplexity: 2,
    maxSmallSidedPlayersPerTeam: 3,
    bothHandsPriority: 'Introduction',
  },
  'C-L2': {
    id: 'C-L2',
    ageBand: 'C',
    level: 2,
    title: 'U12-U13 Level 2 Skill Application',
    emphasis: [
      'movement and speed transfer',
      'combination skills',
      'reaction and defender reads',
      '1v1 to 4v4 application',
    ],
    maxDifficultyScore: 7,
    stageWeights: stages(20, 20, 15, 15, 15, 10, 20),
    preferredModules: ['WUP', 'BM', 'SBH', 'MBH', 'COD', 'COM', 'FIN', 'FW', 'ATT', 'PAS', 'SH', 'OFD', 'SSG'],
    blockedModules: ['ADV', 'TRD', 'TOC', 'TOF'],
    maxCognitiveLoad: 'High',
    maxContactLevel: 'Live',
    maxCombinationElements: 3,
    allowOffDribbleShooting: true,
    maxTacticalComplexity: 2,
    maxSmallSidedPlayersPerTeam: 4,
    bothHandsPriority: 'Balanced',
  },
  'C-L3': {
    id: 'C-L3',
    ageBand: 'C',
    level: 3,
    title: 'U12-U13 Level 3 Performance',
    emphasis: [
      'efficient technical maintenance',
      'speed, reaction and pressure',
      'advanced combinations',
      'live reads and game transfer',
    ],
    maxDifficultyScore: 10,
    stageWeights: stages(15, 15, 15, 15, 15, 15, 25),
    preferredModules: ['WUP', 'BM', 'SBH', 'MBH', 'COD', 'COM', 'FIN', 'FW', 'ATT', 'PAS', 'SH', 'OFD', 'OCS', 'SSG'],
    blockedModules: ['ADV', 'TRD'],
    maxCognitiveLoad: 'High',
    maxContactLevel: 'Live',
    maxCombinationElements: 4,
    allowOffDribbleShooting: true,
    maxTacticalComplexity: 3,
    maxSmallSidedPlayersPerTeam: 5,
    bothHandsPriority: 'Integrated',
  },
};

export type PracticeDistribution = {
  movementAthletic: number;
  ballHandling: number;
  technicalSkills: number;
  skillApplicationDecision: number;
  smallSidedGames: number;
  competitionReview: number;
};

const DISTRIBUTION_KEYS: Array<keyof PracticeDistribution> = [
  'movementAthletic',
  'ballHandling',
  'technicalSkills',
  'skillApplicationDecision',
  'smallSidedGames',
  'competitionReview',
];

export const BASE_90_MINUTE_DISTRIBUTIONS_V1: Record<
  ConfiguredAgeBandId,
  PracticeDistribution
> = {
  A: {
    movementAthletic: 18,
    ballHandling: 20,
    technicalSkills: 22,
    skillApplicationDecision: 15,
    smallSidedGames: 20,
    competitionReview: 5,
  },
  B: {
    movementAthletic: 15,
    ballHandling: 15,
    technicalSkills: 30,
    skillApplicationDecision: 15,
    smallSidedGames: 20,
    competitionReview: 5,
  },
  C: {
    movementAthletic: 13,
    ballHandling: 12,
    technicalSkills: 30,
    skillApplicationDecision: 20,
    smallSidedGames: 20,
    competitionReview: 5,
  },
};

const LEVEL_DISTRIBUTION_MODIFIERS: Record<SkillLevel, PracticeDistribution> = {
  1: {
    movementAthletic: 0,
    ballHandling: 3,
    technicalSkills: 5,
    skillApplicationDecision: -4,
    smallSidedGames: -4,
    competitionReview: 0,
  },
  2: {
    movementAthletic: 2,
    ballHandling: 0,
    technicalSkills: 0,
    skillApplicationDecision: 2,
    smallSidedGames: -2,
    competitionReview: -2,
  },
  3: {
    movementAthletic: 0,
    ballHandling: -2,
    technicalSkills: -4,
    skillApplicationDecision: 3,
    smallSidedGames: 3,
    competitionReview: 0,
  },
};

export type PracticeDistributionContext = {
  chronologicalAge: number;
  bpdsLevel: SkillLevel;
  duration: number;
  currentTrainingDay?: number;
  practiceType?: GeneratorEngineContext['practiceType'];
  primaryFocus?: string;
};

function zeroDistribution(): PracticeDistribution {
  return {
    movementAthletic: 0,
    ballHandling: 0,
    technicalSkills: 0,
    skillApplicationDecision: 0,
    smallSidedGames: 0,
    competitionReview: 0,
  };
}

function addDistribution(
  target: PracticeDistribution,
  modifier: Partial<PracticeDistribution>,
): void {
  DISTRIBUTION_KEYS.forEach((key) => {
    target[key] += modifier[key] ?? 0;
  });
}

function normalizeDistribution(
  distribution: PracticeDistribution,
): PracticeDistribution {
  const positive = zeroDistribution();
  DISTRIBUTION_KEYS.forEach((key) => {
    positive[key] = Math.max(1, distribution[key]);
  });
  const total = DISTRIBUTION_KEYS.reduce((sum, key) => sum + positive[key], 0);
  const raw = DISTRIBUTION_KEYS.map((key) => ({
    key,
    value: (positive[key] * 100) / total,
  }));
  const normalized = zeroDistribution();
  raw.forEach(({ key, value }) => {
    normalized[key] = Math.floor(value);
  });
  let remainder =
    100 - DISTRIBUTION_KEYS.reduce((sum, key) => sum + normalized[key], 0);
  raw
    .slice()
    .sort((a, b) => b.value % 1 - (a.value % 1))
    .forEach(({ key }) => {
      if (remainder > 0) {
        normalized[key] += 1;
        remainder -= 1;
      }
    });
  return normalized;
}

export function getAgeBandForAgeV1(age: number): AgeBandDefinition | undefined {
  return AGE_BAND_ARCHITECTURE_V1.find(
    (band) =>
      age >= band.minimumAge &&
      (band.maximumAge === null || age <= band.maximumAge),
  );
}

export function getAgeLevelProfileV1(
  chronologicalAge: number,
  level: SkillLevel,
): AgeLevelProfile | undefined {
  const band = getAgeBandForAgeV1(chronologicalAge);
  if (!band?.configured) return undefined;
  return AGE_LEVEL_PROFILES_V1[band.id + '-L' + level];
}

function focusDistributionModifier(primaryFocus?: string): PracticeDistribution {
  const modifier = zeroDistribution();
  const focus = (primaryFocus ?? '').toLowerCase();
  if (/ball|handle|dribbl/.test(focus)) {
    addDistribution(modifier, {
      ballHandling: 5,
      technicalSkills: -2,
      competitionReview: -1,
      smallSidedGames: -2,
    });
  } else if (/shoot|pass|finish|footwork/.test(focus)) {
    addDistribution(modifier, {
      technicalSkills: 5,
      ballHandling: -2,
      competitionReview: -1,
      smallSidedGames: -2,
    });
  } else if (/decision|game|small sided|1v1|2v2|3v3/.test(focus)) {
    addDistribution(modifier, {
      skillApplicationDecision: 4,
      smallSidedGames: 3,
      ballHandling: -2,
      technicalSkills: -4,
      competitionReview: -1,
    });
  } else if (/speed|agility|athletic|movement/.test(focus)) {
    addDistribution(modifier, {
      movementAthletic: 5,
      technicalSkills: -2,
      smallSidedGames: -2,
      competitionReview: -1,
    });
  }
  return modifier;
}

export function resolvePracticeDistributionV1(
  context: PracticeDistributionContext,
): PracticeDistribution {
  const band = getAgeBandForAgeV1(context.chronologicalAge);
  if (!band?.configured) {
    throw new Error('AGE x LEVEL Matrix v1 is configured only for ages 8-13.');
  }
  const distribution = {
    ...BASE_90_MINUTE_DISTRIBUTIONS_V1[band.id as ConfiguredAgeBandId],
  };
  addDistribution(distribution, LEVEL_DISTRIBUTION_MODIFIERS[context.bpdsLevel]);
  addDistribution(distribution, focusDistributionModifier(context.primaryFocus));

  if (context.duration < 60) {
    addDistribution(distribution, {
      movementAthletic: 2,
      technicalSkills: 2,
      smallSidedGames: -2,
      competitionReview: -2,
    });
  } else if (context.duration >= 105) {
    addDistribution(distribution, {
      ballHandling: -2,
      technicalSkills: -2,
      skillApplicationDecision: 2,
      smallSidedGames: 2,
    });
  }

  if (context.practiceType === 'Review') {
    addDistribution(distribution, {
      technicalSkills: 2,
      skillApplicationDecision: 2,
      smallSidedGames: -2,
      competitionReview: -2,
    });
  } else if (context.practiceType === 'Game preparation') {
    addDistribution(distribution, {
      ballHandling: -3,
      technicalSkills: -3,
      skillApplicationDecision: 3,
      smallSidedGames: 4,
      competitionReview: -1,
    });
  } else if (context.practiceType === 'Recovery') {
    addDistribution(distribution, {
      movementAthletic: 2,
      ballHandling: 2,
      technicalSkills: 2,
      skillApplicationDecision: -2,
      smallSidedGames: -3,
      competitionReview: -1,
    });
  }

  if ((context.currentTrainingDay ?? 1) === 3) {
    addDistribution(distribution, {
      ballHandling: -2,
      technicalSkills: -2,
      skillApplicationDecision: 2,
      smallSidedGames: 2,
    });
  }

  return normalizeDistribution(distribution);
}

export function distributionToMinutesV1(
  distribution: PracticeDistribution,
  duration: number,
): PracticeDistribution {
  const raw = DISTRIBUTION_KEYS.map((key) => ({
    key,
    value: (distribution[key] * duration) / 100,
  }));
  const minutes = zeroDistribution();
  raw.forEach(({ key, value }) => {
    minutes[key] = Math.floor(value);
  });
  let remainder =
    duration - DISTRIBUTION_KEYS.reduce((sum, key) => sum + minutes[key], 0);
  raw
    .slice()
    .sort((a, b) => b.value % 1 - (a.value % 1))
    .forEach(({ key }) => {
      if (remainder > 0) {
        minutes[key] += 1;
        remainder -= 1;
      }
    });
  return minutes;
}

export type AthleticRotationSlot = {
  day: 1 | 2 | 3;
  focus: Exclude<AthleticFocus, 'None'>;
  examples: string[];
};

const ATHLETIC_EXAMPLES: Record<
  ConfiguredAgeBandId,
  Record<1 | 2 | 3, string[]>
> = {
  A: {
    1: ['running mechanics', 'short accelerations', 'chase games'],
    2: ['balance holds', 'jump stops', 'two-step lateral slides'],
    3: ['mirror games', 'colour calls', 'ball-and-body coordination'],
  },
  B: {
    1: ['acceleration mechanics', '5-10 metre sprints', 'first-step races'],
    2: ['deceleration', 'landing control', 'planned change of direction'],
    3: ['mirror reaction', 'visual cues', 'multi-direction coordination'],
  },
  C: {
    1: ['acceleration quality', 'short competitive sprints', 'first-step speed'],
    2: ['deceleration under control', 'reactive balance', 'change of direction'],
    3: ['reaction starts', 'perception-action cues', 'basketball coordination'],
  },
};

export function resolveAthleticRotationV1(
  currentTrainingDay: number,
  ageBand: ConfiguredAgeBandId,
): AthleticRotationSlot {
  const day = ((((currentTrainingDay || 1) - 1) % 3) + 1) as 1 | 2 | 3;
  const focuses: Record<1 | 2 | 3, Exclude<AthleticFocus, 'None'>> = {
    1: 'Speed / Acceleration',
    2: 'Agility / Balance / Deceleration',
    3: 'Reaction / Coordination',
  };
  return {
    day,
    focus: focuses[day],
    examples: ATHLETIC_EXAMPLES[ageBand][day],
  };
}

export type BallHandlingRotationSlot = {
  day: 1 | 2 | 3;
  families: string[];
  integratedModules: string[];
};

export function resolveBallHandlingRotationV1(
  currentTrainingDay: number,
): BallHandlingRotationSlot {
  const day = ((((currentTrainingDay || 1) - 1) % 3) + 1) as 1 | 2 | 3;
  if (day === 1) {
    return {
      day,
      families: ['Low Pound', 'Crossover', 'Behind the Back'],
      integratedModules: ['SBH'],
    };
  }
  if (day === 2) {
    return {
      day,
      families: ['Between the Legs', 'V Side', 'V Front', 'In and Out'],
      integratedModules: ['SBH'],
    };
  }
  return {
    day,
    families: ['Moving Ball Handling', 'Change of Direction', 'Combination', 'Reaction', '1v1'],
    integratedModules: ['MBH', 'COD', 'COM', 'OCS', 'SSG'],
  };
}

export function inferFineSkillFamilyV1(drill: Drill): string {
  const text = [
    drill.name,
    drill.category,
    drill.objective,
    ...(drill.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();
  if (/low pound/.test(text)) return 'Low Pound';
  if (/crossover|cross over/.test(text)) return 'Crossover';
  if (/behind/.test(text)) return 'Behind the Back';
  if (/between/.test(text)) return 'Between the Legs';
  if (/v[- ]?side/.test(text)) return 'V Side';
  if (/v[- ]?front/.test(text)) return 'V Front';
  if (/in\s*(and|&)\s*out/.test(text)) return 'In and Out';
  if (drill.moduleCode === 'MBH') return 'Moving Ball Handling';
  if (drill.moduleCode === 'COD') return 'Change of Direction';
  if (drill.moduleCode === 'COM') return 'Combination';
  if (drill.moduleCode === 'SSG') return 'Small-Sided Game';
  return normalizeDrillGeneratorMetadata(drill).skillFamily;
}

export type MatrixSafetyCode =
  | 'unsupported-age-band'
  | 'age-level-difficulty'
  | 'progression-stage'
  | 'cognitive-load'
  | 'contact-level'
  | 'combination-complexity'
  | 'off-dribble-shooting'
  | 'tactical-complexity'
  | 'small-sided-size'
  | 'blocked-module';

export type MatrixSafetyExclusion = {
  code: MatrixSafetyCode;
  message: string;
};

const COGNITIVE_ORDER: CognitiveLoad[] = ['Low', 'Medium', 'High'];
const CONTACT_ORDER: ContactLevel[] = ['None', 'Guided', 'Live'];

function inferCombinationElements(drill: Drill): number {
  const metadata = normalizeDrillGeneratorMetadata(drill);
  if (metadata.combinationElements !== undefined) {
    return metadata.combinationElements;
  }
  const text = (drill.name + ' ' + drill.category).toLowerCase();
  if (/three|triple/.test(text)) return 3;
  if (/combo|combination|two ball|double/.test(text)) return 2;
  return 1;
}

function inferOffDribbleShooting(drill: Drill): boolean {
  const metadata = normalizeDrillGeneratorMetadata(drill);
  if (metadata.offDribbleShooting !== undefined) {
    return metadata.offDribbleShooting;
  }
  return (
    drill.moduleCode === 'SH' &&
    /off dribble|pull[- ]?up|dribble shot/i.test(
      drill.name + ' ' + drill.objective,
    )
  );
}

function inferTacticalComplexity(drill: Drill): 1 | 2 | 3 {
  const metadata = normalizeDrillGeneratorMetadata(drill);
  if (metadata.tacticalComplexity !== undefined) {
    return metadata.tacticalComplexity;
  }
  if (metadata.progressionStage === 'Game') return 3;
  if (
    metadata.progressionStage === 'Reaction' ||
    metadata.progressionStage === 'Defender'
  ) {
    return 2;
  }
  return 1;
}

function inferSmallSidedPlayersPerTeam(drill: Drill): number {
  const metadata = normalizeDrillGeneratorMetadata(drill);
  if (metadata.smallSidedPlayersPerTeam !== undefined) {
    return metadata.smallSidedPlayersPerTeam;
  }
  const match = (drill.name + ' ' + drill.category).match(/([1-5])\s*v\s*([1-5])/i);
  if (match) return Math.max(Number(match[1]), Number(match[2]));
  return metadata.progressionStage === 'Game' ? 3 : 1;
}

function inferAthleticFocus(drill: Drill): AthleticFocus {
  const metadata = normalizeDrillGeneratorMetadata(drill);
  if (metadata.athleticFocus) return metadata.athleticFocus;
  const text = [
    drill.name,
    drill.objective,
    drill.category,
    ...(drill.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();
  if (/reaction|mirror|coordination|visual cue|colour call/.test(text)) {
    return 'Reaction / Coordination';
  }
  if (/agility|balance|deceleration|landing|change of direction/.test(text)) {
    return 'Agility / Balance / Deceleration';
  }
  if (/speed|acceleration|sprint|first step/.test(text)) {
    return 'Speed / Acceleration';
  }
  return 'None';
}

export function assessAgeLevelSafetyV1(
  drill: Drill,
  chronologicalAge: number,
  level: SkillLevel,
): MatrixSafetyExclusion[] {
  const profile = getAgeLevelProfileV1(chronologicalAge, level);
  if (!profile) {
    return [
      {
        code: 'unsupported-age-band',
        message: 'The AGE x LEVEL Matrix is not configured for this age yet.',
      },
    ];
  }
  const metadata = normalizeDrillGeneratorMetadata(drill);
  const exclusions: MatrixSafetyExclusion[] = [];

  if (metadata.difficultyScore > profile.maxDifficultyScore) {
    exclusions.push({
      code: 'age-level-difficulty',
      message: 'Difficulty exceeds the safe ceiling for this age and BPDS level.',
    });
  }
  if (profile.stageWeights[metadata.progressionStage] <= 0) {
    exclusions.push({
      code: 'progression-stage',
      message: 'Progression stage is not suitable for this age and level.',
    });
  }
  if (
    COGNITIVE_ORDER.indexOf(metadata.cognitiveLoad) >
    COGNITIVE_ORDER.indexOf(profile.maxCognitiveLoad)
  ) {
    exclusions.push({
      code: 'cognitive-load',
      message: 'Cognitive load is too high for this age and level profile.',
    });
  }
  if (
    CONTACT_ORDER.indexOf(metadata.contactLevel) >
    CONTACT_ORDER.indexOf(profile.maxContactLevel)
  ) {
    exclusions.push({
      code: 'contact-level',
      message: 'Contact level is too high for this age and level profile.',
    });
  }
  if (inferCombinationElements(drill) > profile.maxCombinationElements) {
    exclusions.push({
      code: 'combination-complexity',
      message: 'The combination contains too many linked elements.',
    });
  }
  if (!profile.allowOffDribbleShooting && inferOffDribbleShooting(drill)) {
    exclusions.push({
      code: 'off-dribble-shooting',
      message: 'Off-dribble shooting is not introduced in this profile.',
    });
  }
  if (inferTacticalComplexity(drill) > profile.maxTacticalComplexity) {
    exclusions.push({
      code: 'tactical-complexity',
      message: 'Tactical complexity exceeds the profile ceiling.',
    });
  }
  if (
    inferSmallSidedPlayersPerTeam(drill) >
    profile.maxSmallSidedPlayersPerTeam
  ) {
    exclusions.push({
      code: 'small-sided-size',
      message: 'The small-sided format is too large for this profile.',
    });
  }
  if (profile.blockedModules.includes(drill.moduleCode)) {
    exclusions.push({
      code: 'blocked-module',
      message: 'This module is reserved for a later development phase.',
    });
  }
  return exclusions;
}

export type IndividualDevelopmentProfile = {
  playerId: string;
  bpdsLevel: SkillLevel;
  skillFamilyLevels?: Record<string, SkillLevel>;
};

export type AgeLevelMatrixContext = GeneratorEngineContext & {
  chronologicalAge: number;
  coachPriorityDrillIds?: string[];
  individualDevelopmentProfiles?: IndividualDevelopmentProfile[];
};

export type AgeLevelMatrixWeights = {
  profileFit: number;
  weeklyNeed: number;
  coherence: number;
  coachPriority: number;
};

export type AgeLevelMatrixPenalties = {
  sameFamilySameStage: number;
  incoherentRegression: number;
};

export type AgeLevelMatrixConfig = {
  weights: AgeLevelMatrixWeights;
  penalties: AgeLevelMatrixPenalties;
  baseEngine?: Partial<GeneratorEngineConfig>;
};

export const DEFAULT_AGE_LEVEL_MATRIX_CONFIG: AgeLevelMatrixConfig = {
  weights: {
    profileFit: 18,
    weeklyNeed: 12,
    coherence: 10,
    coachPriority: 8,
  },
  penalties: {
    sameFamilySameStage: 5,
    incoherentRegression: 8,
  },
};

export type MatrixReasonCode =
  | 'age-level-profile'
  | 'weekly-athletic-rotation'
  | 'weekly-ball-handling-rotation'
  | 'coherent-progression'
  | 'coach-priority'
  | 'same-stage-repetition'
  | 'progression-regression';

export type MatrixReason = {
  code: MatrixReasonCode;
  label: string;
  points: number;
};

export type PrerequisiteStatus = 'not-required' | 'satisfied' | 'missing';

export type InternalSelectionData = {
  selectedDrillId: string;
  practiceBlock?: string;
  selectionScore: number;
  ageFit: number;
  levelFit: number;
  goalMatch: number;
  weeklyNeed: number;
  historyScore: number;
  prerequisiteStatus: PrerequisiteStatus;
  resourceFit: number;
  coherenceBonus: number;
  selectionReasons: string[];
};

export type AgeLevelMatrixCandidate = DrillCandidate & {
  matrixReasons: MatrixReason[];
  matrixExclusions: MatrixSafetyExclusion[];
  selectionData: InternalSelectionData;
};

export type AgeLevelMatrixBlockSpec = GeneratorBlockSpec & {
  priorDrillIds?: string[];
};

export type AgeLevelMatrixBlock = Omit<GeneratorBlock, 'items'> & {
  items: AgeLevelMatrixCandidate[];
};

function resolvedMatrixConfig(
  override?: Partial<AgeLevelMatrixConfig>,
): AgeLevelMatrixConfig {
  return {
    ...DEFAULT_AGE_LEVEL_MATRIX_CONFIG,
    ...override,
    weights: {
      ...DEFAULT_AGE_LEVEL_MATRIX_CONFIG.weights,
      ...override?.weights,
    },
    penalties: {
      ...DEFAULT_AGE_LEVEL_MATRIX_CONFIG.penalties,
      ...override?.penalties,
    },
  };
}

function percentageAgeFit(age: number, profile: AgeLevelProfile): number {
  const band = AGE_BAND_ARCHITECTURE_V1.find(
    (item) => item.id === profile.ageBand,
  );
  if (!band || band.maximumAge === null) return 0;
  const midpoint = (band.minimumAge + band.maximumAge) / 2;
  return Math.max(0, Math.round(100 - Math.abs(age - midpoint) * 15));
}

function percentageLevelFit(
  difficultyScore: number,
  profile: AgeLevelProfile,
): number {
  const target = Math.min(profile.maxDifficultyScore, profile.level * 3);
  return Math.max(0, Math.round(100 - Math.abs(difficultyScore - target) * 15));
}

function textMatchesFocus(drill: Drill, focus?: string): boolean {
  if (!focus) return false;
  const needle = focus.toLowerCase();
  return [
    drill.name,
    drill.category,
    drill.moduleCode,
    drill.objective,
    inferFineSkillFamilyV1(drill),
    ...(drill.tags ?? []),
  ]
    .join(' ')
    .toLowerCase()
    .includes(needle);
}

function percentageGoalMatch(
  drill: Drill,
  context: AgeLevelMatrixContext,
): number {
  let score = 0;
  if (textMatchesFocus(drill, context.primaryFocus)) score += 70;
  if (textMatchesFocus(drill, context.secondaryFocus)) score += 30;
  if (textMatchesFocus(drill, context.reviewFocus)) score += 20;
  return Math.min(100, score);
}

function daysSince(usedAt: string, referenceDate: string): number {
  return Math.floor(
    Math.abs(new Date(referenceDate).getTime() - new Date(usedAt).getTime()) /
      86_400_000,
  );
}

function percentageHistoryScore(
  drill: Drill,
  context: AgeLevelMatrixContext,
): number {
  const uses = (context.previousPracticeHistory ?? []).filter(
    (usage) => usage.drillId === drill.id,
  );
  if (!uses.length) return 100;
  const reference = context.referenceDate ?? new Date().toISOString();
  const mostRecent = Math.min(
    ...uses.map((usage) => daysSince(usage.usedAt, reference)),
  );
  if (mostRecent <= 3) return 0;
  if (mostRecent <= 7) return 35;
  return 70;
}

function prerequisiteStatus(
  drill: Drill,
  context: AgeLevelMatrixContext,
  selectedDrills: Drill[],
): PrerequisiteStatus {
  const metadata = normalizeDrillGeneratorMetadata(drill);
  if (!metadata.prerequisiteDrillIds.length) return 'not-required';
  const completed = new Set(context.completedDrillIds ?? []);
  selectedDrills.forEach((selected) => completed.add(selected.id));
  return metadata.prerequisiteDrillIds.every((id) => completed.has(id))
    ? 'satisfied'
    : 'missing';
}

function resourceFit(candidate: DrillCandidate): number {
  const resourceCodes = new Set([
    'players',
    'baskets',
    'equipment',
    'space',
    'defense',
    'training-format',
  ]);
  return candidate.exclusions.some((item) => resourceCodes.has(item.code))
    ? 0
    : 100;
}

function profileFitPercentage(
  drill: Drill,
  profile: AgeLevelProfile,
): number {
  const metadata = normalizeDrillGeneratorMetadata(drill);
  const maximumStageWeight = Math.max(
    ...Object.values(profile.stageWeights),
  );
  let score =
    (profile.stageWeights[metadata.progressionStage] / maximumStageWeight) * 85;
  if (profile.preferredModules.includes(drill.moduleCode)) score += 15;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function weeklyNeedPercentage(
  drill: Drill,
  context: AgeLevelMatrixContext,
  profile: AgeLevelProfile,
): {
  percentage: number;
  reasons: MatrixReason[];
} {
  const reasons: MatrixReason[] = [];
  let percentage = 0;
  const athletic = inferAthleticFocus(drill);
  const athleticRotation = resolveAthleticRotationV1(
    context.currentTrainingDay ?? 1,
    profile.ageBand,
  );
  if (athletic !== 'None' && athletic === athleticRotation.focus) {
    percentage = Math.max(percentage, 100);
    reasons.push({
      code: 'weekly-athletic-rotation',
      label: 'the planned athletic focus for this training day',
      points: 0,
    });
  }

  const ballRotation = resolveBallHandlingRotationV1(
    context.currentTrainingDay ?? 1,
  );
  const family = inferFineSkillFamilyV1(drill);
  const ballMatch =
    ballRotation.families.includes(family) ||
    (ballRotation.day === 3 &&
      ballRotation.integratedModules.includes(drill.moduleCode));
  if (ballMatch) {
    percentage = Math.max(percentage, 100);
    reasons.push({
      code: 'weekly-ball-handling-rotation',
      label: 'the planned ball-handling family for this training day',
      points: 0,
    });
  }
  return { percentage, reasons };
}

function coherenceAssessment(
  drill: Drill,
  selectedDrills: Drill[],
  config: AgeLevelMatrixConfig,
): {
  points: number;
  bonus: number;
  reasons: MatrixReason[];
} {
  const reasons: MatrixReason[] = [];
  if (!selectedDrills.length) return { points: 0, bonus: 0, reasons };
  const metadata = normalizeDrillGeneratorMetadata(drill);
  const currentFamily = inferFineSkillFamilyV1(drill);
  const previous = selectedDrills[selectedDrills.length - 1];
  const previousMetadata = normalizeDrillGeneratorMetadata(previous);
  const previousFamily = inferFineSkillFamilyV1(previous);
  const currentStage = PROGRESSION_STAGE_ORDER.indexOf(
    metadata.progressionStage,
  );
  const previousStage = PROGRESSION_STAGE_ORDER.indexOf(
    previousMetadata.progressionStage,
  );

  const explicitlyCompatible =
    previousMetadata.compatibleNextDrillIds.includes(drill.id);
  const sameFamily = currentFamily === previousFamily;
  if (
    explicitlyCompatible ||
    (sameFamily && currentStage > previousStage) ||
    (drill.moduleCode === previous.moduleCode && currentStage > previousStage)
  ) {
    const bonus = explicitlyCompatible
      ? config.weights.coherence
      : Math.round(config.weights.coherence * (sameFamily ? 1 : 0.6));
    reasons.push({
      code: 'coherent-progression',
      label: 'a coherent Technique-to-Game skill chain',
      points: bonus,
    });
    return { points: bonus, bonus, reasons };
  }
  if (sameFamily && currentStage === previousStage) {
    reasons.push({
      code: 'same-stage-repetition',
      label: 'unnecessary same-stage family repetition',
      points: -config.penalties.sameFamilySameStage,
    });
    return {
      points: -config.penalties.sameFamilySameStage,
      bonus: 0,
      reasons,
    };
  }
  if (sameFamily && currentStage < previousStage) {
    reasons.push({
      code: 'progression-regression',
      label: 'a backwards step inside the same skill chain',
      points: -config.penalties.incoherentRegression,
    });
    return {
      points: -config.penalties.incoherentRegression,
      bonus: 0,
      reasons,
    };
  }
  return { points: 0, bonus: 0, reasons };
}

export function evaluateDrillWithAgeLevelMatrixV1(
  drill: Drill,
  context: AgeLevelMatrixContext,
  selectedDrills: Drill[] = [],
  configOverride?: Partial<AgeLevelMatrixConfig>,
  practiceBlock?: string,
): AgeLevelMatrixCandidate {
  const config = resolvedMatrixConfig(configOverride);
  const base = evaluateDrillV1(
    drill,
    {
      ...context,
      strictPrerequisites: context.strictPrerequisites ?? true,
    },
    selectedDrills,
    config.baseEngine,
  );
  const profile = getAgeLevelProfileV1(
    context.chronologicalAge,
    context.bpdsLevel ?? drill.level,
  );
  const matrixExclusions = assessAgeLevelSafetyV1(
    drill,
    context.chronologicalAge,
    context.bpdsLevel ?? drill.level,
  );
  const matrixReasons: MatrixReason[] = [];
  const metadata = normalizeDrillGeneratorMetadata(drill);
  const profileFit = profile ? profileFitPercentage(drill, profile) : 0;
  const profilePoints = Math.round(
    (profileFit * config.weights.profileFit) / 100,
  );
  if (profilePoints > 0) {
    matrixReasons.push({
      code: 'age-level-profile',
      label: 'the configured age and BPDS level profile',
      points: profilePoints,
    });
  }

  const weekly = profile
    ? weeklyNeedPercentage(drill, context, profile)
    : { percentage: 0, reasons: [] };
  const weeklyPoints = Math.round(
    (weekly.percentage * config.weights.weeklyNeed) / 100,
  );
  weekly.reasons.forEach((reason) => {
    matrixReasons.push({ ...reason, points: weeklyPoints });
  });

  const coherence = coherenceAssessment(drill, selectedDrills, config);
  matrixReasons.push(...coherence.reasons);

  if (context.coachPriorityDrillIds?.includes(drill.id)) {
    matrixReasons.push({
      code: 'coach-priority',
      label: 'the coach priority override',
      points: config.weights.coachPriority,
    });
  }

  const matrixScore = matrixReasons.reduce(
    (sum, reason) => sum + reason.points,
    0,
  );
  const score = Math.round((base.score + matrixScore) * 100) / 100;
  const prerequisites = prerequisiteStatus(drill, context, selectedDrills);
  const eligible =
    base.eligible &&
    matrixExclusions.length === 0 &&
    prerequisites !== 'missing';
  const selectionReasons = [
    ...base.reasons
      .filter((reason) => reason.points > 0)
      .map((reason) => reason.label),
    ...matrixReasons
      .filter((reason) => reason.points > 0)
      .map((reason) => reason.label),
  ];

  return {
    ...base,
    eligible,
    score,
    matrixReasons,
    matrixExclusions,
    explanation: eligible
      ? 'Selected because it provides ' +
        selectionReasons.slice(0, 4).join(', ') +
        '.'
      : 'Excluded by the AGE x LEVEL safety hierarchy.',
    selectionData: {
      selectedDrillId: drill.id,
      practiceBlock,
      selectionScore: score,
      ageFit: profile ? percentageAgeFit(context.chronologicalAge, profile) : 0,
      levelFit: profile ? percentageLevelFit(metadata.difficultyScore, profile) : 0,
      goalMatch: percentageGoalMatch(drill, context),
      weeklyNeed: weekly.percentage,
      historyScore: percentageHistoryScore(drill, context),
      prerequisiteStatus: prerequisites,
      resourceFit: resourceFit(base),
      coherenceBonus: coherence.bonus,
      selectionReasons,
    },
  };
}

export function rankDrillsWithAgeLevelMatrixV1(
  drills: Drill[],
  context: AgeLevelMatrixContext,
  selectedDrills: Drill[] = [],
  configOverride?: Partial<AgeLevelMatrixConfig>,
): AgeLevelMatrixCandidate[] {
  return drills
    .map((drill) =>
      evaluateDrillWithAgeLevelMatrixV1(
        drill,
        context,
        selectedDrills,
        configOverride,
      ),
    )
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      if (b.score !== a.score) return b.score - a.score;
      return a.drill.code.localeCompare(b.drill.code);
    });
}

export function generateBlockWithAgeLevelMatrixV1(
  allDrills: Drill[],
  context: AgeLevelMatrixContext,
  spec: AgeLevelMatrixBlockSpec,
  alreadySelectedIds: string[] = [],
  configOverride?: Partial<AgeLevelMatrixConfig>,
): AgeLevelMatrixBlock {
  const selectedIds = new Set(alreadySelectedIds);
  const priorDrills = allDrills.filter((drill) =>
    (spec.priorDrillIds ?? []).includes(drill.id),
  );
  const selected: Drill[] = [...priorDrills];

  (spec.lockedDrillIds ?? []).forEach((id) => {
    const locked = allDrills.find((drill) => drill.id === id);
    if (!locked || selectedIds.has(locked.id)) return;
    const evaluated = evaluateDrillWithAgeLevelMatrixV1(
      locked,
      context,
      selected,
      configOverride,
      spec.id,
    );
    if (evaluated.eligible) {
      selected.push(locked);
      selectedIds.add(locked.id);
    }
  });

  while (selected.length - priorDrills.length < spec.targetDrills) {
    const ranked = rankDrillsWithAgeLevelMatrixV1(
      allDrills.filter((drill) => !selectedIds.has(drill.id)),
      {
        ...context,
        primaryFocus: spec.focus,
        secondaryFocus: spec.secondaryFocus ?? context.secondaryFocus,
      },
      selected,
      configOverride,
    );
    const next = ranked.find((candidate) => candidate.eligible);
    if (!next) break;
    selected.push(next.drill);
    selectedIds.add(next.drill.id);
  }

  const blockDrills = selected.filter(
    (drill) => !priorDrills.some((prior) => prior.id === drill.id),
  );
  const ordered = orderDrillsMethodicallyV1(blockDrills);
  const evaluated: AgeLevelMatrixCandidate[] = [];
  ordered.forEach((drill) => {
    const previous = [...priorDrills, ...evaluated.map((item) => item.drill)];
    evaluated.push(
      evaluateDrillWithAgeLevelMatrixV1(
        drill,
        {
          ...context,
          primaryFocus: spec.focus,
          secondaryFocus: spec.secondaryFocus ?? context.secondaryFocus,
        },
        previous,
        configOverride,
        spec.id,
      ),
    );
  });

  return {
    id: spec.id,
    focus: spec.focus,
    secondaryFocus: spec.secondaryFocus,
    duration: spec.duration,
    lockedDrillIds: evaluated
      .filter((item) => spec.lockedDrillIds?.includes(item.drill.id))
      .map((item) => item.drill.id),
    items: evaluated,
  };
}

export type GeneratedAgeLevelPractice = {
  matrixVersion: string;
  profile: AgeLevelProfile;
  distribution: PracticeDistribution;
  distributionMinutes: PracticeDistribution;
  athleticRotation: AthleticRotationSlot;
  ballHandlingRotation: BallHandlingRotationSlot;
  blocks: AgeLevelMatrixBlock[];
};

export function generatePracticeWithAgeLevelMatrixV1(
  allDrills: Drill[],
  context: AgeLevelMatrixContext,
  blockSpecs: AgeLevelMatrixBlockSpec[],
  configOverride?: Partial<AgeLevelMatrixConfig>,
): GeneratedAgeLevelPractice {
  const level = context.bpdsLevel ?? 1;
  const profile = getAgeLevelProfileV1(context.chronologicalAge, level);
  if (!profile) {
    throw new Error('AGE x LEVEL Matrix v1 is configured only for ages 8-13.');
  }
  const distribution = resolvePracticeDistributionV1({
    chronologicalAge: context.chronologicalAge,
    bpdsLevel: level,
    duration: context.duration,
    currentTrainingDay: context.currentTrainingDay,
    practiceType: context.practiceType,
    primaryFocus: context.primaryFocus,
  });
  const blocks: AgeLevelMatrixBlock[] = [];
  const selectedIds: string[] = [];
  blockSpecs.forEach((spec) => {
    const priorDrillIds =
      spec.priorDrillIds ?? blocks.flatMap((block) =>
        block.items.map((item) => item.drill.id),
      );
    const block = generateBlockWithAgeLevelMatrixV1(
      allDrills,
      context,
      { ...spec, priorDrillIds },
      selectedIds,
      configOverride,
    );
    blocks.push(block);
    selectedIds.push(...block.items.map((item) => item.drill.id));
  });
  return {
    matrixVersion: AGE_LEVEL_MATRIX_VERSION,
    profile,
    distribution,
    distributionMinutes: distributionToMinutesV1(
      distribution,
      context.duration,
    ),
    athleticRotation: resolveAthleticRotationV1(
      context.currentTrainingDay ?? 1,
      profile.ageBand,
    ),
    ballHandlingRotation: resolveBallHandlingRotationV1(
      context.currentTrainingDay ?? 1,
    ),
    blocks,
  };
}

