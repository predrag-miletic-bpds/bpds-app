import type { DevelopmentDoseType } from './methodology-foundation-v1-1.js';
import type { DoseIntent, DoseScope, DoseTarget } from './development-dose-architecture-v1.js';

export const DEVELOPMENT_DOSE_RECOMMENDATION_VERSION = '1.0' as const;

/** BPDS recommends. Coach decides. This module has no Generator integration. */
export const DEVELOPMENT_DOSE_RECOMMENDATION_PIPELINE = [
  'DEVELOPMENT_NEED', 'LEARNING_OBJECTIVE', 'SKILL_STAGE', 'BLOCK_PURPOSE',
  'MEANINGFUL_DEVELOPMENT_EXPOSURES', 'DRILL_FAMILY', 'EXACT_DRILL',
  'DOSE_TYPE_SCOPE_INTENT', 'BPDS_RECOMMENDED_DOSE', 'ORGANIZATION_AND_ROLES',
  'TIME_BUDGET', 'PRACTICE_DURATION_CHECK', 'COACH_OVERRIDE', 'FINAL_PLAN',
] as const;

export type RecommendationCalibrationStatus =
  | 'EVIDENCE_SUPPORTED'
  | 'BPDS_DERIVED'
  | 'CALIBRATED';

export interface RecommendationCalibration {
  status: RecommendationCalibrationStatus;
  pilotCalibrationRequired?: boolean;
  evidenceReference?: string;
}

export interface NumericTargetRange {
  min?: number;
  max?: number;
  unit?: string;
}

export interface RecommendedDoseTarget extends Omit<DoseTarget, 'quantity'> {
  target?: NumericTargetRange;
}

export interface RecommendationApplicability {
  drillFamilies: readonly string[];
  developmentNeed?: string;
  learningObjective?: string;
  skillStage?: string;
  blockPurpose?: string;
  organization?: string;
}

export interface DevelopmentDoseRecommendationProfile {
  id: string;
  applicability: RecommendationApplicability;
  primary: RecommendedDoseTarget;
  secondary?: readonly RecommendedDoseTarget[];
  calibration?: RecommendationCalibration;
  rationale?: string;
  notes?: string;
}

export type MainDevelopmentBlock =
  | 'BALL_MASTERY'
  | 'STATIONARY_BALL_HANDLING'
  | 'MOVING_BALL_HANDLING'
  | 'CHANGE_OF_DIRECTION'
  | 'FOOTWORK'
  | 'TRIPLE_THREAT'
  | 'PASSING'
  | 'SHOOTING'
  | 'FINISHING'
  | 'ONE_V_ONE'
  | 'TWO_V_ONE'
  | 'TWO_V_TWO'
  | 'THREE_V_TWO'
  | 'THREE_V_THREE'
  | 'FOUR_V_FOUR'
  | 'FIVE_V_FIVE';

export interface MeaningfulExposureProfile {
  block: MainDevelopmentBlock;
  target: NumericTargetRange;
  calibration: RecommendationCalibration;
  rationale: 'EVERY_DRILL_EARNS_ITS_PLACE';
}

export interface CompleteRoleCyclePlan {
  requiredStartingRoles: readonly string[];
  completeRoleCycleExpected: boolean;
}

export type PossessionStructure = 'SINGLE_PHASE' | 'MULTI_PHASE' | 'CONTINUOUS';
export type StopConditionKind = 'TIME_LIMIT' | 'DOSE_TARGET' | 'ROLE_CYCLE_COMPLETE' | 'COACH_DECISION';

export interface StopCondition {
  kind: StopConditionKind;
  note?: string;
}

export interface TargetEventPlan {
  targetEvents: readonly string[];
  /** Planned situation creation, never success or actual execution. */
  planningOnly: true;
}

export interface SmallestSufficientGamePlan {
  minimumFormat: 'ONE_V_ONE' | 'TWO_V_TWO' | 'THREE_V_THREE' | 'FOUR_V_FOUR' | 'FIVE_V_FIVE';
  requiredRelationships: readonly string[];
  rationale?: string;
}

export interface SsgPlanningProfile {
  format: 'ONE_V_ONE' | 'TWO_V_ONE' | 'TWO_V_TWO' | 'THREE_V_TWO' | 'THREE_V_THREE' | 'FOUR_V_FOUR' | 'FIVE_V_FIVE';
  primaryDoseType: DevelopmentDoseType;
  supportingDoseTypes: readonly DevelopmentDoseType[];
  possessionStructure: PossessionStructure;
  completeRoleCycle?: CompleteRoleCyclePlan;
  targetEvents?: TargetEventPlan;
  stopConditions?: readonly StopCondition[];
  smallestSufficientGame?: SmallestSufficientGamePlan;
}

export interface RecommendationResolutionContext {
  drillFamily: string;
  developmentNeed?: string;
  learningObjective?: string;
  skillStage?: string;
  blockPurpose?: string;
  organization?: string;
}

export interface RecommendationValidationIssue {
  code:
    | 'INVALID_RANGE'
    | 'MISSING_CALIBRATION'
    | 'INVALID_CALIBRATION'
    | 'EVIDENCE_REFERENCE_REQUIRED'
    | 'INVALID_ROLE_CYCLE'
    | 'INVALID_POSSESSION_STRUCTURE'
    | 'INVALID_STOP_CONDITION'
    | 'INVALID_MEANINGFUL_EXPOSURE'
    | 'INVALID_DOSE_TYPE'
    | 'INVALID_SCOPE'
    | 'INVALID_INTENT';
  path: string;
  message: string;
}

export interface RecommendationValidationResult {
  errors: RecommendationValidationIssue[];
  warnings: RecommendationValidationIssue[];
}

const doseTypes: readonly DevelopmentDoseType[] = [
  'TIME', 'TIME_PER_SIDE', 'QUALITY_REPS', 'QUALITY_REPS_PER_SIDE',
  'QUALITY_SEQUENCE_REPS', 'DISTANCE', 'QUALITY_ATTEMPTS', 'MAKES',
  'POSSESSIONS', 'DECISION_EXPOSURES', 'ROLE_EXPOSURES', 'GAME_TIME', 'TARGET_EVENTS',
];
const scopes: readonly DoseScope[] = ['PER_PLAYER', 'PER_SIDE', 'PER_ROLE', 'GROUP_TOTAL'];
const intents: readonly DoseIntent[] = ['PRESCRIPTIVE', 'EXPOSURE_TARGET'];
const possessionStructures: readonly PossessionStructure[] = ['SINGLE_PHASE', 'MULTI_PHASE', 'CONTINUOUS'];
const stopConditionKinds: readonly StopConditionKind[] = ['TIME_LIMIT', 'DOSE_TARGET', 'ROLE_CYCLE_COMPLETE', 'COACH_DECISION'];

const clone = <T,>(value: T): T => {
  if (Array.isArray(value)) return value.map(clone) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, clone(child)])) as T;
  }
  return value;
};

/** No profile means no recommendation. This never supplies a default target. */
export const resolveApplicableRecommendation = (
  profiles: readonly DevelopmentDoseRecommendationProfile[],
  context: RecommendationResolutionContext,
): DevelopmentDoseRecommendationProfile | undefined => {
  const profile = profiles.find(candidate => {
    const applicable = candidate.applicability;
    return applicable.drillFamilies.includes(context.drillFamily)
      && (applicable.developmentNeed === undefined || applicable.developmentNeed === context.developmentNeed)
      && (applicable.learningObjective === undefined || applicable.learningObjective === context.learningObjective)
      && (applicable.skillStage === undefined || applicable.skillStage === context.skillStage)
      && (applicable.blockPurpose === undefined || applicable.blockPurpose === context.blockPurpose)
      && (applicable.organization === undefined || applicable.organization === context.organization);
  });
  return profile ? clone(profile) : undefined;
};

export const resolveMeaningfulExposureProfile = (
  defaults: readonly MeaningfulExposureProfile[],
  block: MainDevelopmentBlock,
): MeaningfulExposureProfile | undefined => {
  const profile = defaults.find(candidate => candidate.block === block);
  return profile ? clone(profile) : undefined;
};

const issue = (code: RecommendationValidationIssue['code'], path: string, message: string): RecommendationValidationIssue => ({ code, path, message });
const hasNumericTarget = (target?: NumericTargetRange): boolean => target?.min !== undefined || target?.max !== undefined;

export const validateNumericTargetRange = (target: NumericTargetRange | undefined, path: string): RecommendationValidationIssue[] => {
  if (!target) return [];
  const errors: RecommendationValidationIssue[] = [];
  if ((target.min !== undefined && (!Number.isFinite(target.min) || target.min < 0))
    || (target.max !== undefined && (!Number.isFinite(target.max) || target.max < 0))
    || (target.min !== undefined && target.max !== undefined && target.min > target.max)) {
    errors.push(issue('INVALID_RANGE', path, 'Recommendation range values must be finite, non-negative, and ordered.'));
  }
  return errors;
};

const validateDoseTarget = (target: RecommendedDoseTarget, path: string, errors: RecommendationValidationIssue[]) => {
  if (!doseTypes.includes(target.type)) errors.push(issue('INVALID_DOSE_TYPE', path + '.type', 'Use an existing Step 3A DevelopmentDoseType.'));
  if (!scopes.includes(target.scope)) errors.push(issue('INVALID_SCOPE', path + '.scope', 'Use an existing Step 3B-1 DoseScope.'));
  if (!intents.includes(target.intent)) errors.push(issue('INVALID_INTENT', path + '.intent', 'Use PRESCRIPTIVE or EXPOSURE_TARGET.'));
  errors.push(...validateNumericTargetRange(target.target, path + '.target'));
};

const validateCalibration = (
  calibration: RecommendationCalibration | undefined,
  hasNumericRecommendation: boolean,
  path: string,
  errors: RecommendationValidationIssue[],
) => {
  if (!hasNumericRecommendation) return;
  if (!calibration) {
    errors.push(issue('MISSING_CALIBRATION', path, 'Numeric recommendation requires explicit calibration metadata.'));
    return;
  }
  if (calibration.status === 'BPDS_DERIVED' && calibration.pilotCalibrationRequired !== true) {
    errors.push(issue('INVALID_CALIBRATION', path, 'BPDS-derived numeric recommendations require pilot calibration.'));
  }
  if (calibration.status === 'EVIDENCE_SUPPORTED' && !calibration.evidenceReference) {
    errors.push(issue('EVIDENCE_REFERENCE_REQUIRED', path, 'Evidence-supported numeric recommendations require a source reference.'));
  }
};

/** Validates recommendation data only; it neither changes values nor makes a recommendation mandatory. */
export const validateDevelopmentDoseRecommendationProfile = (
  profile: DevelopmentDoseRecommendationProfile | undefined,
): RecommendationValidationResult => {
  const errors: RecommendationValidationIssue[] = [];
  if (!profile) return { errors, warnings: [] };
  validateDoseTarget(profile.primary, 'primary', errors);
  profile.secondary?.forEach((target, index) => validateDoseTarget(target, 'secondary[' + index + ']', errors));
  validateCalibration(profile.calibration, hasNumericTarget(profile.primary.target) || profile.secondary?.some(target => hasNumericTarget(target.target)) === true, 'calibration', errors);
  if (!profile.applicability.drillFamilies.length) errors.push(issue('INVALID_MEANINGFUL_EXPOSURE', 'applicability.drillFamilies', 'A recommendation must name at least one drill family.'));
  return { errors, warnings: [] };
};

export const validateCompleteRoleCyclePlan = (plan: CompleteRoleCyclePlan | undefined): RecommendationValidationResult => {
  const errors: RecommendationValidationIssue[] = [];
  if (plan?.completeRoleCycleExpected && (!plan.requiredStartingRoles.length || plan.requiredStartingRoles.some(role => !role.trim()))) {
    errors.push(issue('INVALID_ROLE_CYCLE', 'completeRoleCycle', 'Expected complete role cycle requires non-empty starting roles.'));
  }
  return { errors, warnings: [] };
};

export const validatePossessionStructure = (structure: PossessionStructure | undefined): RecommendationValidationResult => ({
  errors: structure !== undefined && !possessionStructures.includes(structure)
    ? [issue('INVALID_POSSESSION_STRUCTURE', 'possessionStructure', 'Use SINGLE_PHASE, MULTI_PHASE, or CONTINUOUS.')]
    : [],
  warnings: [],
});

export const validateStopConditions = (conditions: readonly StopCondition[] | undefined): RecommendationValidationResult => {
  const errors: RecommendationValidationIssue[] = [];
  conditions?.forEach((condition, index) => {
    if (!stopConditionKinds.includes(condition.kind)) errors.push(issue('INVALID_STOP_CONDITION', 'stopConditions[' + index + ']', 'Use a supported planning stop condition.'));
  });
  return { errors, warnings: [] };
};

/** Recommendation-level semantic checks for SSG planning; no runtime role tracking occurs here. */
export const validateSsgPlanningProfile = (profile: SsgPlanningProfile | undefined): RecommendationValidationResult => {
  const errors: RecommendationValidationIssue[] = [];
  if (!profile) return { errors, warnings: [] };
  errors.push(...validatePossessionStructure(profile.possessionStructure).errors);
  errors.push(...validateCompleteRoleCyclePlan(profile.completeRoleCycle).errors);
  errors.push(...validateStopConditions(profile.stopConditions).errors);
  return { errors, warnings: [] };
};

/** These are planned opportunities, not actual decisions, successful events, or completed role cycles. */
export const isPlannedOpportunityOnly = (): true => true;
