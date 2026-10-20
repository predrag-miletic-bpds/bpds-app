import {
  validateDevelopmentDoseRecommendationProfile,
  type DevelopmentDoseRecommendationProfile,
  type RecommendedDoseTarget,
} from './development-dose-recommendation-v1.js';

export interface CoachDoseOverrideV1 {
  readonly primary?: RecommendedDoseTarget;
  readonly secondary?: readonly RecommendedDoseTarget[];
}

export type EffectivePlannedDoseValueSourceV1 =
  | 'BPDS_RECOMMENDATION'
  | 'COACH_OVERRIDE';

export interface EffectivePlannedDoseProvenanceV1 {
  readonly primary: EffectivePlannedDoseValueSourceV1;
  readonly secondary: EffectivePlannedDoseValueSourceV1;
}

/** A separate resolved plan; it never changes the BPDS recommendation input. */
export interface EffectivePlannedDoseV1
  extends DevelopmentDoseRecommendationProfile {
  readonly provenance: EffectivePlannedDoseProvenanceV1;
}

export type CoachDoseOverrideValidationCodeV1 =
  | 'INVALID_OVERRIDE'
  | 'UNSUPPORTED_OVERRIDE_FIELD'
  | 'INVALID_OVERRIDE_VALUE';

export interface CoachDoseOverrideValidationIssueV1 {
  readonly code: CoachDoseOverrideValidationCodeV1;
  readonly path: string;
  readonly message: string;
}

export interface CoachDoseOverrideValidationResultV1 {
  readonly errors: readonly CoachDoseOverrideValidationIssueV1[];
}

export class CoachDoseOverrideValidationErrorV1 extends Error {
  readonly issues: readonly CoachDoseOverrideValidationIssueV1[];

  constructor(issues: readonly CoachDoseOverrideValidationIssueV1[]) {
    super('Coach dose override validation failed.');
    this.name = 'CoachDoseOverrideValidationErrorV1';
    this.issues = issues;
  }
}

const clone = <Value>(value: Value): Value =>
  JSON.parse(JSON.stringify(value)) as Value;

const hasOwn = (value: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const validateTarget = (
  target: RecommendedDoseTarget,
  path: string,
): CoachDoseOverrideValidationIssueV1[] =>
  validateDevelopmentDoseRecommendationProfile({
    id: 'coach-dose-override-validation',
        calibration: { status: 'BPDS_DERIVED', pilotCalibrationRequired: true },
applicability: { drillFamilies: ['COACH_OVERRIDE_VALIDATION'] },
    primary: target,
  }).errors.map(error => ({
    code: 'INVALID_OVERRIDE_VALUE',
    path,
    message: error.message,
  }));

/** Runtime validation keeps the override closed and reuses B2 dose validation. */
export const validateCoachDoseOverrideV1 = (
  override: unknown,
): CoachDoseOverrideValidationResultV1 => {
  const errors: CoachDoseOverrideValidationIssueV1[] = [];

  if (!isRecord(override)) {
    return {
      errors: [{
        code: 'INVALID_OVERRIDE',
        path: 'override',
        message: 'Coach override must be an object.',
      }],
    };
  }

  for (const key of Object.keys(override)) {
    if (key !== 'primary' && key !== 'secondary') {
      errors.push({
        code: 'UNSUPPORTED_OVERRIDE_FIELD',
        path: key,
        message: 'Coach override does not support "' + key + '".',
      });
    }
  }

  if (hasOwn(override, 'primary')) {
    if (override.primary === undefined) {
      errors.push({
        code: 'INVALID_OVERRIDE_VALUE',
        path: 'primary',
        message: 'Primary override must be a recommended dose target.',
      });
    } else {
      errors.push(...validateTarget(
        override.primary as RecommendedDoseTarget,
        'primary',
      ));
    }
  }

  if (hasOwn(override, 'secondary')) {
    if (!Array.isArray(override.secondary)) {
      errors.push({
        code: 'INVALID_OVERRIDE_VALUE',
        path: 'secondary',
        message: 'Secondary override must be an array of recommended dose targets.',
      });
    } else {
      override.secondary.forEach((target, index) => {
        errors.push(...validateTarget(
          target as RecommendedDoseTarget,
          'secondary[' + index + ']',
        ));
      });
    }
  }

  return { errors };
};

/** Resolves a B2 recommendation into a new effective planned dose. */
export const resolveEffectivePlannedDoseV1 = (
  recommendation: DevelopmentDoseRecommendationProfile,
  override?: CoachDoseOverrideV1,
): EffectivePlannedDoseV1 => {
  if (override !== undefined) {
    const validation = validateCoachDoseOverrideV1(override);
    if (validation.errors.length > 0) {
      throw new CoachDoseOverrideValidationErrorV1(validation.errors);
    }
  }

  const primaryOverridden = override !== undefined && hasOwn(override, 'primary');
  const secondaryOverridden = override !== undefined && hasOwn(override, 'secondary');
  const effective: EffectivePlannedDoseV1 = {
    ...clone(recommendation),
    primary: primaryOverridden
      ? clone(override.primary as RecommendedDoseTarget)
      : clone(recommendation.primary),
    provenance: {
      primary: primaryOverridden ? 'COACH_OVERRIDE' : 'BPDS_RECOMMENDATION',
      secondary: secondaryOverridden ? 'COACH_OVERRIDE' : 'BPDS_RECOMMENDATION',
    },
  };

  if (secondaryOverridden) {
    effective.secondary = clone(
      override.secondary as readonly RecommendedDoseTarget[],
    );
  } else if (recommendation.secondary !== undefined) {
    effective.secondary = clone(recommendation.secondary);
  }

  return effective;
};
