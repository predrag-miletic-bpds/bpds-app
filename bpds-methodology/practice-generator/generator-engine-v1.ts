import type {
  CognitiveLoad,
  ContactLevel,
  Drill,
  DrillGeneratorMetadata,
  DrillMovementMode,
  DrillSpaceRequirement,
  DrillTrainingFormat,
  ProgressionStage,
} from '@predrag-miletic/bpds-methodology.entities.methodology';
import { modulesForFocus } from '@predrag-miletic/bpds-methodology.drill-catalog';
import type { GeneratorContext } from '@predrag-miletic/bpds-practices.entities.practice';
import {
  AGE_GROUPS,
  type AgeGroup,
  type SkillLevel,
} from '@predrag-miletic/bpds-storage.entities.shared-types';

export const GENERATOR_ENGINE_VERSION = '1.0.0';

export type SkillDevelopmentStatus =
  | 'New'
  | 'Learning'
  | 'Needs review'
  | 'Stable'
  | 'Ready to progress';

export type GeneratorPracticeType =
  | 'Development'
  | 'Review'
  | 'Game preparation'
  | 'Recovery';

export type DrillUsage = {
  drillId: string;
  usedAt: string;
  completed?: boolean;
  successful?: boolean;
  skillFamily?: string;
};

export type GeneratorEngineContext = GeneratorContext & {
  bpdsLevel?: SkillLevel;
  practicesPerWeek?: number;
  currentTrainingDay?: number;
  practiceType?: GeneratorPracticeType;
  reviewFocus?: string;
  developmentStatus?: Record<string, SkillDevelopmentStatus>;
  completedDrillIds?: string[];
  previousPracticeHistory?: DrillUsage[];
  strictPrerequisites?: boolean;
  referenceDate?: string;
};

export type GeneratorScoreWeights = {
  ageFit: number;
  levelFit: number;
  primaryFocus: number;
  secondaryFocus: number;
  reviewFocus: number;
  weeklyPriority: number;
  prerequisites: number;
  novelty: number;
  resources: number;
  progression: number;
  developmentStatus: number;
};

export type GeneratorPenalties = {
  tooDifficult: number;
  tooEasy: number;
  usedWithinThreeDays: number;
  repeatedThisWeek: number;
  sameFamilyInBlock: number;
  stableSkill: number;
};

export type GeneratorEngineConfig = {
  weights: GeneratorScoreWeights;
  penalties: GeneratorPenalties;
  recentlyUsedDays: number;
  sameWeekDays: number;
  strictPrerequisitesByDefault: boolean;
};

export const DEFAULT_GENERATOR_ENGINE_CONFIG: GeneratorEngineConfig = {
  weights: {
    ageFit: 20,
    levelFit: 20,
    primaryFocus: 20,
    secondaryFocus: 10,
    reviewFocus: 8,
    weeklyPriority: 15,
    prerequisites: 10,
    novelty: 10,
    resources: 5,
    progression: 6,
    developmentStatus: 6,
  },
  penalties: {
    tooDifficult: 25,
    tooEasy: 6,
    usedWithinThreeDays: 18,
    repeatedThisWeek: 10,
    sameFamilyInBlock: 8,
    stableSkill: 5,
  },
  recentlyUsedDays: 3,
  sameWeekDays: 7,
  strictPrerequisitesByDefault: false,
};

export type GeneratorReasonCode =
  | 'age-fit'
  | 'level-fit'
  | 'primary-focus'
  | 'secondary-focus'
  | 'review-focus'
  | 'weekly-priority'
  | 'prerequisites'
  | 'novelty'
  | 'resources'
  | 'progression'
  | 'development-status'
  | 'too-difficult'
  | 'too-easy'
  | 'recently-used'
  | 'repeated-this-week'
  | 'same-family'
  | 'stable-skill';

export type GeneratorReason = {
  code: GeneratorReasonCode;
  label: string;
  points: number;
};

export type GeneratorExclusionCode =
  | 'unpublished'
  | 'age'
  | 'difficulty'
  | 'players'
  | 'baskets'
  | 'equipment'
  | 'space'
  | 'defense'
  | 'training-format'
  | 'prerequisites';

export type GeneratorExclusion = {
  code: GeneratorExclusionCode;
  message: string;
};

export type NormalizedDrillGeneratorMetadata = DrillGeneratorMetadata;

export type DrillCandidate = {
  drill: Drill;
  metadata: NormalizedDrillGeneratorMetadata;
  eligible: boolean;
  score: number;
  reasons: GeneratorReason[];
  exclusions: GeneratorExclusion[];
  explanation: string;
};

export type GeneratorBlockSpec = {
  id: string;
  focus: string;
  secondaryFocus?: string;
  duration: number;
  targetDrills: number;
  lockedDrillIds?: string[];
};

export type GeneratorBlock = {
  id: string;
  focus: string;
  secondaryFocus?: string;
  duration: number;
  lockedDrillIds: string[];
  items: DrillCandidate[];
};

export const PROGRESSION_STAGE_ORDER: ProgressionStage[] = [
  'Technique',
  'Movement',
  'Speed',
  'Combination',
  'Reaction',
  'Defender',
  'Game',
];

export const METHODOLOGICAL_MODULE_ORDER = [
  'WUP',
  'BM',
  'SBH',
  'MBH',
  'COD',
  'COM',
  'FIN',
  'FW',
  'TT',
  'ATT',
  'PAS',
  'SH',
  'DFW',
  'OBD',
  'OFD',
  'REB',
  'OCS',
  'OBM',
  'OBS',
  'PNR',
  'TOC',
  'TOF',
  'TRD',
  'ADV',
  'SSG',
];

const LEVEL_BY_COACH_SKILL: Record<GeneratorContext['skillLevel'], SkillLevel> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Elite: 3,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function firstNumber(value: string, fallback: number): number {
  const match = value.replace(',', '.').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : fallback;
}

function secondsFromText(value: string, fallback: number): number {
  const amount = firstNumber(value, fallback);
  return /minute|min\b/i.test(value) ? amount * 60 : amount;
}

function normalizedAgeRange(drill: Drill): {
  minimumAge: AgeGroup;
  maximumAge: AgeGroup;
} {
  const supported = AGE_GROUPS.filter((age) => drill.suitableAges.includes(age));
  return {
    minimumAge: supported[0] ?? 'U8',
    maximumAge: supported[supported.length - 1] ?? 'Professional',
  };
}

function typicalIntroductionAge(drill: Drill, minimumAge: AgeGroup): AgeGroup {
  return AGE_GROUPS.find((age) => drill.typicalIntroduction.includes(age)) ?? minimumAge;
}

function inferMovementMode(drill: Drill): DrillMovementMode {
  const value = [drill.name, drill.category, ...drill.tags].join(' ').toLowerCase();
  if (drill.moduleCode === 'SBH' || /stationary|in place|pound/.test(value)) return 'Stationary';
  if (/moving|movement|walk|run|sprint|slide|drive|cut|transition/.test(value)) return 'Moving';
  return 'Both';
}

function inferProgressionStage(
  drill: Drill,
  movementMode: DrillMovementMode,
): ProgressionStage {
  const value = [drill.name, drill.category, ...drill.tags, ...drill.reads].join(' ').toLowerCase();
  if (drill.moduleCode === 'SSG' || /small-sided|game/.test(value)) return 'Game';
  if (drill.withDefense) return 'Defender';
  if (/reaction|react|read|decision|signal/.test(value)) return 'Reaction';
  if (drill.moduleCode === 'COM' || /combination|combo/.test(value)) return 'Combination';
  if (/speed|sprint|fast/.test(value) || drill.level === 3) return 'Speed';
  if (movementMode === 'Moving') return 'Movement';
  return 'Technique';
}

function inferTrainingFormat(drill: Drill): DrillTrainingFormat {
  if (drill.grouping === 'Both') return 'Both';
  return drill.grouping === 'Group' ? 'Team' : 'Individual';
}

function inferSpaceRequirement(drill: Drill): DrillSpaceRequirement {
  if (drill.courtArea.length !== 1) return 'Any';
  const area = drill.courtArea[0].toLowerCase();
  if (area.includes('full')) return 'Full court';
  if (area.includes('half')) return 'Half court';
  if (area.includes('small') || area.includes('home')) return 'Small space';
  return 'Any';
}

function inferBasketsRequired(drill: Drill): number {
  return ['SH', 'FIN', 'REB', 'SSG'].includes(drill.moduleCode) ? 1 : 0;
}

function inferCognitiveLoad(drill: Drill, reaction: boolean): CognitiveLoad {
  if (drill.moduleCode === 'SSG' || drill.withDefense) return 'High';
  if (reaction || drill.level >= 2) return 'Medium';
  return 'Low';
}

function inferContactLevel(drill: Drill): ContactLevel {
  const value = [drill.name, ...drill.tags].join(' ').toLowerCase();
  if (/contact|live/.test(value)) return 'Live';
  if (drill.withDefense) return 'Guided';
  return 'None';
}

function inferBothHands(drill: Drill): boolean {
  const value = [drill.name, ...drill.execution, ...drill.tags].join(' ').toLowerCase();
  return /both hand|each hand|left and right|each side|two-ball|2 ball/.test(value);
}

export function normalizeDrillGeneratorMetadata(
  drill: Drill,
): NormalizedDrillGeneratorMetadata {
  const ageRange = normalizedAgeRange(drill);
  const movementMode = drill.generator?.movementMode ?? inferMovementMode(drill);
  const reaction =
    drill.generator?.reaction ??
    [drill.name, ...drill.tags, ...drill.reads].some((value) =>
      /reaction|react|read|decision|signal/i.test(value),
    );

  return {
    schemaVersion: 1,
    minimumAge: drill.generator?.minimumAge ?? ageRange.minimumAge,
    maximumAge: drill.generator?.maximumAge ?? ageRange.maximumAge,
    typicalIntroductionAge:
      drill.generator?.typicalIntroductionAge ??
      typicalIntroductionAge(drill, ageRange.minimumAge),
    difficultyScore: clamp(drill.generator?.difficultyScore ?? drill.level * 3, 1, 10),
    primarySkill: drill.generator?.primarySkill ?? drill.moduleCode,
    secondarySkills: drill.generator?.secondarySkills ?? drill.tags,
    skillFamily: drill.generator?.skillFamily ?? drill.moduleCode,
    movementMode,
    progressionStage:
      drill.generator?.progressionStage ?? inferProgressionStage(drill, movementMode),
    trainingFormat: drill.generator?.trainingFormat ?? inferTrainingFormat(drill),
    minPlayers: drill.generator?.minPlayers ?? drill.minPlayers,
    maxPlayers: drill.generator?.maxPlayers ?? drill.maxPlayers,
    basketsRequired: drill.generator?.basketsRequired ?? inferBasketsRequired(drill),
    spaceRequired: drill.generator?.spaceRequired ?? inferSpaceRequirement(drill),
    equipmentRequired: drill.generator?.equipmentRequired ?? drill.equipment,
    workSeconds: drill.generator?.workSeconds ?? secondsFromText(drill.workTime, 30),
    restSeconds: drill.generator?.restSeconds ?? secondsFromText(drill.restTime, 20),
    repetitions:
      drill.generator?.repetitions ?? Math.round(firstNumber(drill.repetitions, 4)),
    sets: drill.generator?.sets ?? Math.round(firstNumber(drill.repetitions, 1)),
    intensity: drill.generator?.intensity ?? drill.intensity,
    cognitiveLoad:
      drill.generator?.cognitiveLoad ?? inferCognitiveLoad(drill, reaction),
    reaction,
    defender: drill.generator?.defender ?? drill.withDefense,
    contactLevel: drill.generator?.contactLevel ?? inferContactLevel(drill),
    bothHands: drill.generator?.bothHands ?? inferBothHands(drill),
    prerequisiteDrillIds:
      drill.generator?.prerequisiteDrillIds ?? drill.prerequisiteDrills,
    progressionDrillIds:
      drill.generator?.progressionDrillIds ?? drill.followUpDrills,
    regressionDrillIds: drill.generator?.regressionDrillIds ?? [],
    compatibleNextDrillIds:
      drill.generator?.compatibleNextDrillIds ??
      Array.from(new Set([...drill.followUpDrills, ...drill.relatedDrills])),
    weeklyPriority: clamp(drill.generator?.weeklyPriority ?? 3, 1, 5),
    preferredPracticesPerWeek: drill.generator?.preferredPracticesPerWeek ?? [],
    objective: drill.generator?.objective ?? drill.objective,
    execution: drill.generator?.execution ?? drill.execution,
    coachingPoints: drill.generator?.coachingPoints ?? drill.coachingPoints,
    commonMistakes: drill.generator?.commonMistakes ?? drill.commonMistakes,
    corrections: drill.generator?.corrections ?? drill.corrections,
    performanceStandard:
      drill.generator?.performanceStandard ?? drill.performanceOptions[0] ?? '',
    gameTransfer: drill.generator?.gameTransfer ?? drill.gameApplication,
    videoUrl: drill.generator?.videoUrl ?? drill.videoUrl,
  };
}

function targetLevel(context: GeneratorEngineContext): SkillLevel {
  return context.bpdsLevel ?? LEVEL_BY_COACH_SKILL[context.skillLevel];
}

function focusMatches(
  drill: Drill,
  metadata: NormalizedDrillGeneratorMetadata,
  focus: string | undefined,
): boolean {
  if (!focus) return false;
  const modules = modulesForFocus(focus);
  const normalized = focus.toLowerCase();
  return (
    modules.includes(drill.moduleCode) ||
    metadata.primarySkill.toLowerCase() === normalized ||
    metadata.secondarySkills.some((skill) => skill.toLowerCase() === normalized)
  );
}

function hasRequiredEquipment(
  required: string[],
  available: string[],
): boolean {
  return required.every(
    (item) => item === 'No additional equipment' || available.includes(item),
  );
}

function spaceFits(
  requirement: DrillSpaceRequirement,
  courtSize: string,
): boolean {
  if (requirement === 'Any') return true;
  const court = courtSize.toLowerCase();
  if (court.includes('full')) return true;
  if (court.includes('half')) {
    return requirement === 'Half court' || requirement === 'Small space';
  }
  return requirement === 'Small space';
}

function trainingFormatFits(
  format: DrillTrainingFormat,
  context: GeneratorEngineContext,
): boolean {
  if (format === 'Both') return true;
  if (context.trainingType === 'Individual') return format === 'Individual';
  if (context.trainingType === 'Small group') return format !== 'Team';
  return true;
}

function daysSince(usedAt: string, referenceDate: string): number {
  const used = new Date(usedAt).getTime();
  const reference = new Date(referenceDate).getTime();
  if (!Number.isFinite(used) || !Number.isFinite(reference)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((reference - used) / 86_400_000));
}

function resolvedConfig(
  override?: Partial<GeneratorEngineConfig>,
): GeneratorEngineConfig {
  return {
    ...DEFAULT_GENERATOR_ENGINE_CONFIG,
    ...override,
    weights: {
      ...DEFAULT_GENERATOR_ENGINE_CONFIG.weights,
      ...override?.weights,
    },
    penalties: {
      ...DEFAULT_GENERATOR_ENGINE_CONFIG.penalties,
      ...override?.penalties,
    },
  };
}

function selectionExplanation(
  eligible: boolean,
  reasons: GeneratorReason[],
  exclusions: GeneratorExclusion[],
): string {
  if (!eligible) {
    return exclusions.map((item) => item.message).join(' ');
  }
  const positives = reasons
    .filter((reason) => reason.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
    .map((reason) => reason.label);
  return positives.length
    ? `Selected because it provides ${positives.join(', ')}.`
    : 'Selected as the best available methodical fit.';
}

export function evaluateDrillV1(
  drill: Drill,
  context: GeneratorEngineContext,
  selectedDrills: Drill[] = [],
  configOverride?: Partial<GeneratorEngineConfig>,
): DrillCandidate {
  const config = resolvedConfig(configOverride);
  const metadata = normalizeDrillGeneratorMetadata(drill);
  const exclusions: GeneratorExclusion[] = [];
  const reasons: GeneratorReason[] = [];
  const completed = new Set(context.completedDrillIds ?? []);
  selectedDrills.forEach((item) => completed.add(item.id));
  const strictPrerequisites =
    context.strictPrerequisites ?? config.strictPrerequisitesByDefault;
  const level = targetLevel(context);
  const targetDifficulty = level * 3;
  const referenceDate = context.referenceDate ?? new Date().toISOString();
  const history = context.previousPracticeHistory ?? [];
  const usages = history
    .filter((usage) => usage.drillId === drill.id)
    .map((usage) => daysSince(usage.usedAt, referenceDate));
  const mostRecentUse = usages.length ? Math.min(...usages) : Number.POSITIVE_INFINITY;

  if (!drill.published) {
    exclusions.push({ code: 'unpublished', message: 'Drill is not published.' });
  }
  if (!drill.suitableAges.includes(context.ageGroup)) {
    exclusions.push({ code: 'age', message: 'Drill does not fit the selected age group.' });
  }
  if (metadata.difficultyScore > targetDifficulty + 1) {
    exclusions.push({ code: 'difficulty', message: 'Drill is too advanced for the selected BPDS level.' });
  }
  if (
    context.playerCount < metadata.minPlayers ||
    context.playerCount > metadata.maxPlayers
  ) {
    exclusions.push({ code: 'players', message: 'Available player count does not fit this drill.' });
  }
  if (metadata.basketsRequired > context.baskets) {
    exclusions.push({ code: 'baskets', message: 'Not enough baskets are available.' });
  }
  if (!hasRequiredEquipment(metadata.equipmentRequired, context.equipment)) {
    exclusions.push({ code: 'equipment', message: 'Required equipment is not available.' });
  }
  if (!spaceFits(metadata.spaceRequired, context.courtSize)) {
    exclusions.push({ code: 'space', message: 'Available court space does not fit this drill.' });
  }
  if (!context.withDefense && metadata.defender) {
    exclusions.push({ code: 'defense', message: 'The session does not allow live defense.' });
  }
  if (!trainingFormatFits(metadata.trainingFormat, context)) {
    exclusions.push({ code: 'training-format', message: 'Drill format does not fit the selected training type.' });
  }

  const prerequisitesSatisfied = metadata.prerequisiteDrillIds.every((id) =>
    completed.has(id),
  );
  if (strictPrerequisites && !prerequisitesSatisfied) {
    exclusions.push({
      code: 'prerequisites',
      message: 'All prerequisite drills must be completed first.',
    });
  }

  const ageDistance = Math.abs(
    AGE_GROUPS.indexOf(context.ageGroup) -
      AGE_GROUPS.indexOf(metadata.typicalIntroductionAge),
  );
  reasons.push({
    code: 'age-fit',
    label: 'a strong age fit',
    points: Math.max(0, config.weights.ageFit - ageDistance * 3),
  });

  const difficultyGap = Math.abs(metadata.difficultyScore - targetDifficulty);
  reasons.push({
    code: 'level-fit',
    label: 'the correct BPDS difficulty',
    points: Math.max(0, config.weights.levelFit - difficultyGap * 4),
  });

  if (focusMatches(drill, metadata, context.primaryFocus)) {
    reasons.push({
      code: 'primary-focus',
      label: 'the primary training objective',
      points: config.weights.primaryFocus,
    });
  }
  if (focusMatches(drill, metadata, context.secondaryFocus)) {
    reasons.push({
      code: 'secondary-focus',
      label: 'the secondary training objective',
      points: config.weights.secondaryFocus,
    });
  }
  if (focusMatches(drill, metadata, context.reviewFocus)) {
    reasons.push({
      code: 'review-focus',
      label: 'the review objective',
      points: config.weights.reviewFocus,
    });
  }

  reasons.push({
    code: 'weekly-priority',
    label: 'the weekly development priority',
    points:
      ((metadata.weeklyPriority - 1) / 4) * config.weights.weeklyPriority,
  });
  reasons.push({
    code: 'prerequisites',
    label: 'the completed prerequisite chain',
    points:
      metadata.prerequisiteDrillIds.length === 0 || prerequisitesSatisfied
        ? config.weights.prerequisites
        : 0,
  });

  const noveltyFactor =
    mostRecentUse === Number.POSITIVE_INFINITY
      ? 1
      : clamp(mostRecentUse / Math.max(1, config.sameWeekDays), 0, 1);
  reasons.push({
    code: 'novelty',
    label: 'useful novelty',
    points: noveltyFactor * config.weights.novelty,
  });
  reasons.push({
    code: 'resources',
    label: 'the available players, baskets, space and equipment',
    points: exclusions.some((item) =>
      ['players', 'baskets', 'equipment', 'space', 'training-format'].includes(item.code),
    )
      ? 0
      : config.weights.resources,
  });

  const previous = selectedDrills[selectedDrills.length - 1];
  if (
    previous &&
    normalizeDrillGeneratorMetadata(previous).compatibleNextDrillIds.includes(drill.id)
  ) {
    reasons.push({
      code: 'progression',
      label: 'a direct methodological progression',
      points: config.weights.progression,
    });
  }

  const status =
    context.developmentStatus?.[drill.id] ??
    context.developmentStatus?.[metadata.skillFamily];
  if (status === 'Learning' || status === 'Needs review') {
    reasons.push({
      code: 'development-status',
      label: status === 'Learning' ? 'continued skill learning' : 'planned review',
      points: config.weights.developmentStatus,
    });
  } else if (status === 'Ready to progress') {
    reasons.push({
      code: 'development-status',
      label: 'readiness for the next development step',
      points: config.weights.developmentStatus / 2,
    });
  }

  if (metadata.difficultyScore > targetDifficulty) {
    reasons.push({
      code: 'too-difficult',
      label: 'a small difficulty overload',
      points: -config.penalties.tooDifficult,
    });
  }
  if (targetDifficulty - metadata.difficultyScore >= 3) {
    reasons.push({
      code: 'too-easy',
      label: 'difficulty below the current level',
      points: -config.penalties.tooEasy,
    });
  }
  if (mostRecentUse <= config.recentlyUsedDays) {
    reasons.push({
      code: 'recently-used',
      label: 'very recent use',
      points: -config.penalties.usedWithinThreeDays,
    });
  }
  if (usages.filter((days) => days <= config.sameWeekDays).length > 1) {
    reasons.push({
      code: 'repeated-this-week',
      label: 'excessive repetition in the same week',
      points: -config.penalties.repeatedThisWeek,
    });
  }
  if (
    selectedDrills.some(
      (item) =>
        normalizeDrillGeneratorMetadata(item).skillFamily === metadata.skillFamily,
    )
  ) {
    reasons.push({
      code: 'same-family',
      label: 'repetition of the same skill family in one block',
      points: -config.penalties.sameFamilyInBlock,
    });
  }
  if (status === 'Stable') {
    reasons.push({
      code: 'stable-skill',
      label: 'a skill already marked stable',
      points: -config.penalties.stableSkill,
    });
  }

  const eligible = exclusions.length === 0;
  const score = eligible
    ? reasons.reduce((total, reason) => total + reason.points, 0)
    : Number.NEGATIVE_INFINITY;

  return {
    drill,
    metadata,
    eligible,
    score,
    reasons,
    exclusions,
    explanation: selectionExplanation(eligible, reasons, exclusions),
  };
}

export function rankDrillsV1(
  drills: Drill[],
  context: GeneratorEngineContext,
  selectedDrills: Drill[] = [],
  configOverride?: Partial<GeneratorEngineConfig>,
): DrillCandidate[] {
  return drills
    .map((drill) =>
      evaluateDrillV1(drill, context, selectedDrills, configOverride),
    )
    .filter((candidate) => candidate.eligible)
    .sort(
      (a, b) =>
        b.score - a.score ||
        PROGRESSION_STAGE_ORDER.indexOf(a.metadata.progressionStage) -
          PROGRESSION_STAGE_ORDER.indexOf(b.metadata.progressionStage) ||
        a.metadata.difficultyScore - b.metadata.difficultyScore ||
        a.drill.code.localeCompare(b.drill.code),
    );
}

export function selectNextDrillsV1(
  drills: Drill[],
  context: GeneratorEngineContext,
  count: number,
  selectedDrillIds: string[] = [],
  configOverride?: Partial<GeneratorEngineConfig>,
): DrillCandidate[] {
  const chosen = drills.filter((drill) => selectedDrillIds.includes(drill.id));
  const result: DrillCandidate[] = [];

  while (result.length < count) {
    const used = new Set([...selectedDrillIds, ...result.map((item) => item.drill.id)]);
    const ranked = rankDrillsV1(
      drills.filter((drill) => !used.has(drill.id)),
      context,
      [...chosen, ...result.map((item) => item.drill)],
      configOverride,
    );
    if (!ranked[0]) break;
    result.push(ranked[0]);
  }

  return result;
}

export function orderDrillsMethodicallyV1(drills: Drill[]): Drill[] {
  return [...drills].sort((a, b) => {
    const moduleA = METHODOLOGICAL_MODULE_ORDER.indexOf(a.moduleCode);
    const moduleB = METHODOLOGICAL_MODULE_ORDER.indexOf(b.moduleCode);
    const normalizedModuleA =
      moduleA === -1 ? METHODOLOGICAL_MODULE_ORDER.length : moduleA;
    const normalizedModuleB =
      moduleB === -1 ? METHODOLOGICAL_MODULE_ORDER.length : moduleB;
    return (
      normalizedModuleA - normalizedModuleB ||
      PROGRESSION_STAGE_ORDER.indexOf(
        normalizeDrillGeneratorMetadata(a).progressionStage,
      ) -
        PROGRESSION_STAGE_ORDER.indexOf(
          normalizeDrillGeneratorMetadata(b).progressionStage,
        ) ||
      a.level - b.level ||
      a.code.localeCompare(b.code)
    );
  });
}

export function generateBlockV1(
  drills: Drill[],
  context: GeneratorEngineContext,
  spec: GeneratorBlockSpec,
  existingDrillIds: string[] = [],
  configOverride?: Partial<GeneratorEngineConfig>,
): GeneratorBlock {
  const lockedDrillIds = spec.lockedDrillIds ?? [];
  const locked = existingDrillIds
    .filter((id) => lockedDrillIds.includes(id))
    .map((id) => drills.find((drill) => drill.id === id))
    .filter((drill): drill is Drill => Boolean(drill));
  const blockContext: GeneratorEngineContext = {
    ...context,
    primaryFocus: spec.focus,
    secondaryFocus: spec.secondaryFocus ?? context.secondaryFocus,
  };
  const additions = selectNextDrillsV1(
    drills,
    blockContext,
    Math.max(0, spec.targetDrills - locked.length),
    locked.map((drill) => drill.id),
    configOverride,
  );
  const ordered = orderDrillsMethodicallyV1([
    ...locked,
    ...additions.map((item) => item.drill),
  ]);

  return {
    id: spec.id,
    focus: spec.focus,
    secondaryFocus: spec.secondaryFocus,
    duration: spec.duration,
    lockedDrillIds,
    items: ordered.map((drill) =>
      evaluateDrillV1(
        drill,
        blockContext,
        ordered.slice(0, ordered.indexOf(drill)),
        configOverride,
      ),
    ),
  };
}

export const generatorEngineV1 = {
  version: GENERATOR_ENGINE_VERSION,
  config: DEFAULT_GENERATOR_ENGINE_CONFIG,
  normalize: normalizeDrillGeneratorMetadata,
  evaluate: evaluateDrillV1,
  rank: rankDrillsV1,
  selectNext: selectNextDrillsV1,
  orderMethodically: orderDrillsMethodicallyV1,
  generateBlock: generateBlockV1,
};
