/** BPDS Foundation Planner V1 — staging only. Never activates the legacy or Engine V1 generator. */
import { getAthleticPrescription, type Age } from '../athletic-prescriptions/athletic-adapter-v2';

export const FOUNDATION_PLANNER_GENERATOR_ACTIVE = false as const;
export type FoundationBlock = 'WARM_UP' | 'ATHLETIC' | 'BALL_MASTERY';
export type FoundationAllocation = Readonly<{ age: Age; warmUpMinutes: number; athleticMinutes: number; ballMasteryMaxDrills: 4; totalFoundationMinutes: number; order: readonly FoundationBlock[] }>;
const LOCKED_MINUTES: Readonly<Record<Age, readonly [number, number]>> = {
  U8: [8, 15], U10: [8, 15], U12: [8, 13], U14: [10, 12], U16: [10, 10],
};
const ORDER = Object.freeze(['WARM_UP', 'ATHLETIC', 'BALL_MASTERY'] as const);
export function getFoundationAllocation(age: string): FoundationAllocation | null {
  if (!Object.prototype.hasOwnProperty.call(LOCKED_MINUTES, age)) return null;
  const [warmUpMinutes, athleticMinutes] = LOCKED_MINUTES[age as Age];
  return Object.freeze({ age: age as Age, warmUpMinutes, athleticMinutes,
    ballMasteryMaxDrills: 4, totalFoundationMinutes: warmUpMinutes + athleticMinutes,
    order: ORDER });
}
/** Eligibility is read-only; HOLD and CONDITIONAL are not automatically selectable. */
export function isAthleticEligibleForAutoSelection(drillId: string, age: string): boolean {
  const prescription = getAthleticPrescription(drillId, age);
  return prescription?.eligibility === 'YES';
}
