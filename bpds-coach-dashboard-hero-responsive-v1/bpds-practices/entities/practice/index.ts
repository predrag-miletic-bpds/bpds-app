export type { Practice, PracticeItem, GeneratorContext, HistoryEntry } from './practice.js';
export { practiceDuration, drillCount, phaseBreakdown, toHistoryEntry } from './practice.js';
export {
  attachPlannedDoseRecommendationV1,
  applyCoachDoseOverrideToPracticeItemV1,
  removeCoachDoseOverrideFromPracticeItemV1,
  clonePracticeItemV1,
  createPlannedDoseEnvelopeV1,
  resolvePracticeCompatibleDurationMinutesV1,
} from './planned-dose-v1.js';
export type { PlannedDoseEnvelopeV1 } from './planned-dose-v1.js';
