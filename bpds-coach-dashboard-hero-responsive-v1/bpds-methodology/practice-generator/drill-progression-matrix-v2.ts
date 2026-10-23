import type { Drill } from '@predrag-miletic/bpds-methodology.entities.methodology';
import { normalizeDrillGeneratorMetadata, PROGRESSION_STAGE_ORDER } from './generator-engine-v1.js';

/**
 * BPDS Coach Drill Progression Matrix V2 — execution ordering only.
 * This does not activate Engine V1, alter eligibility, prescribe dosage, or
 * assign clinical/AI-derived scores. Missing metadata is kept neutral.
 */
export const DRILL_PROGRESSION_MATRIX_VERSION = '2.0.0-audit';
export type ProgressionEvidence = {
  drillId: string;
  moduleCode: string;
  level: number;
  stage: number | null;
  movement: number | null;
  cognitive: number | null;
  defense: number;
  intensity: number | null;
  manualRank: number | null;
  needsReview: boolean;
};
const intensityOrder: Record<string, number> = { Low: 0, Medium: 1, High: 2 };
const cognitiveOrder: Record<string, number> = { Low: 0, Medium: 1, High: 2 };
const movementOrder: Record<string, number> = { Stationary: 0, Moving: 1 };
/**
 * Coach-approved order for an exact drill trio. These are NOT general
 * complexity scores for all Shooting drills. Unknown drills stay reviewable.
 */
const approvedSequence: Record<string, number> = {
  'sh-l1-001': 10, // Form Shooting / One Hand
  'sh-ft-001': 20, // Pressure Free Throws
  'sh-l2-003': 30, // Catch and Shoot off the Pass
};
export function progressionEvidence(drill: Drill): ProgressionEvidence {
  const meta = normalizeDrillGeneratorMetadata(drill);
  const stageIndex = PROGRESSION_STAGE_ORDER.indexOf(meta.progressionStage);
  const manualRank = approvedSequence[drill.id] ?? null;
  const movement = movementOrder[meta.movementMode] ?? null;
  const cognitive = cognitiveOrder[meta.cognitiveLoad] ?? null;
  const intensity = intensityOrder[drill.intensity] ?? null;
  return {
    drillId: drill.id, moduleCode: drill.moduleCode, level: drill.level,
    stage: stageIndex < 0 ? null : stageIndex, movement, cognitive,
    defense: drill.withDefense ? 1 : 0, intensity, manualRank,
    needsReview: manualRank === null &&
      (stageIndex < 0 || movement === null || cognitive === null),
  };
}
/** Sort only within the same module; keep selection order for true ties. */
export function compareDrillExecutionProgression(a: Drill, b: Drill): number {
  if (a.moduleCode !== b.moduleCode) return 0;
  const x = progressionEvidence(a), y = progressionEvidence(b);
  if (x.manualRank !== null && y.manualRank !== null)
    return x.manualRank - y.manualRank;
  return x.level - y.level ||
    (x.stage ?? 0) - (y.stage ?? 0) ||
    (x.movement ?? 0) - (y.movement ?? 0) ||
    (x.defense - y.defense) ||
    (x.cognitive ?? 0) - (y.cognitive ?? 0) ||
    (x.intensity ?? 0) - (y.intensity ?? 0);
}
