import {
  CoachDoseOverrideValidationErrorV1,
  resolveEffectivePlannedDoseV1,
  validateDevelopmentDoseRecommendationProfile,
  type CoachDoseOverrideV1,
  type DevelopmentDoseRecommendationProfile,
  type EffectivePlannedDoseV1,
} from '@predrag-miletic/bpds-methodology.entities.methodology';
import type { PracticeItem } from './practice.js';

/** Persistent separation between BPDS recommendation, coach intent and effective plan. */
export interface PlannedDoseEnvelopeV1 {
  readonly recommendation: DevelopmentDoseRecommendationProfile;
  readonly override?: CoachDoseOverrideV1;
  readonly effective: EffectivePlannedDoseV1;
}

export class DevelopmentDoseRecommendationValidationErrorV1 extends Error {
  readonly issues: ReturnType<typeof validateDevelopmentDoseRecommendationProfile>['errors'];

  constructor(issues: ReturnType<typeof validateDevelopmentDoseRecommendationProfile>['errors']) {
    super('Development dose recommendation validation failed.');
    this.name = 'DevelopmentDoseRecommendationValidationErrorV1';
    this.issues = issues;
  }
}

const clone = <Value>(value: Value): Value =>
  JSON.parse(JSON.stringify(value)) as Value;

const assertRecommendation = (
  recommendation: DevelopmentDoseRecommendationProfile,
): void => {
  const validation = validateDevelopmentDoseRecommendationProfile(recommendation);
  if (validation.errors.length > 0) {
    throw new DevelopmentDoseRecommendationValidationErrorV1(validation.errors);
  }
};

const assertDrillItem = (item: PracticeItem): void => {
  if (item.kind !== 'drill' || !item.drillId) {
    throw new Error('Planned dose can only be attached to a practice drill item.');
  }
};

/**
 * Creates a detached envelope from the original recommendation.
 * Override resolution always starts from recommendation, never from prior effective state.
 */
export const createPlannedDoseEnvelopeV1 = (
  recommendation: DevelopmentDoseRecommendationProfile,
  override?: CoachDoseOverrideV1,
): PlannedDoseEnvelopeV1 => {
  assertRecommendation(recommendation);
  const recommendationCopy = clone(recommendation);
  const effective = resolveEffectivePlannedDoseV1(recommendationCopy, override);
  return {
    recommendation: recommendationCopy,
    ...(override === undefined ? {} : { override: clone(override) }),
    effective,
  };
};

/**
 * Returns a practice-compatible duration only for an exact group-total minute target.
 * Per-player, per-side, ranges, seconds, reps, attempts and all other doses are not converted.
 */
export const resolvePracticeCompatibleDurationMinutesV1 = (
  effective: EffectivePlannedDoseV1,
): number | undefined => {
  const primary = effective.primary;
  const target = primary.target;
  if (
    primary.type !== 'TIME' ||
    primary.observationKind !== 'TIME' ||
    primary.scope !== 'GROUP_TOTAL' ||
    primary.intent !== 'PRESCRIPTIVE' ||
    target?.unit !== 'minutes' ||
    target.min === undefined ||
    target.max === undefined ||
    target.min !== target.max
  ) {
    return undefined;
  }
  return target.min;
};

const withEnvelope = (
  item: PracticeItem,
  plannedDose: PlannedDoseEnvelopeV1,
): PracticeItem => {
  assertDrillItem(item);
  const duration = resolvePracticeCompatibleDurationMinutesV1(plannedDose.effective);
  return {
    ...clone(item),
    ...(duration === undefined ? {} : { duration }),
    plannedDose: clone(plannedDose),
  };
};

/** Attaches a validated recommendation without inventing a catalog-wide mapping. */
export const attachPlannedDoseRecommendationV1 = (
  item: PracticeItem,
  recommendation: DevelopmentDoseRecommendationProfile,
): PracticeItem =>
  withEnvelope(item, createPlannedDoseEnvelopeV1(recommendation));

/** Replaces explicit coach intent and recomputes effective dose from the original recommendation. */
export const applyCoachDoseOverrideToPracticeItemV1 = (
  item: PracticeItem,
  override: CoachDoseOverrideV1,
): PracticeItem => {
  if (!item.plannedDose) {
    throw new Error('Practice item has no BPDS dose recommendation.');
  }
  return withEnvelope(
    item,
    createPlannedDoseEnvelopeV1(item.plannedDose.recommendation, override),
  );
};

/** Removes coach intent and restores an effective result resolved from recommendation. */
export const removeCoachDoseOverrideFromPracticeItemV1 = (
  item: PracticeItem,
): PracticeItem => {
  if (!item.plannedDose) {
    throw new Error('Practice item has no BPDS dose recommendation.');
  }
  return withEnvelope(
    item,
    createPlannedDoseEnvelopeV1(item.plannedDose.recommendation),
  );
};

/** Detached copy used by save/edit/duplicate paths with nested planned-dose data. */
export const clonePracticeItemV1 = (item: PracticeItem): PracticeItem => clone(item);

export { CoachDoseOverrideValidationErrorV1 };
