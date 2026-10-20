import type { AgeGroup } from '@predrag-miletic/bpds-storage.entities.shared-types';

export type CoachPrescriptionRangeV1 = { min: number; max: number };

/** A locked Coach dosage record. Ranges remain ranges until the methodology supplies a precise value. */
export type CoachDrillPrescriptionV1 = {
  canonicalId: string;
  legacyDrillIds: readonly string[];
  name: string;
  module: string;
  level: 1 | 2 | 3;
  ageGroup: AgeGroup;
  allocatedMinutes: number;
  bouts: CoachPrescriptionRangeV1;
  workSeconds: CoachPrescriptionRangeV1;
  restSeconds: CoachPrescriptionRangeV1;
  workText: string;
  restText: string;
  allocationText: string;
  sideMode: 'both-directions' | 'none' | 'left-right' | 'unresolved';
  sourceStatus: 'LOCKED';
};

/**
 * Verified legacy-to-canonical Coach mapping.
 *
 * BM-L1-001 is the first released adapter record. The values below are copied
 * from the locked Coach Age/Dosage Workbook; no Home values are used here.
 */
const BODY_WRAPS_BY_AGE: Record<Extract<AgeGroup, 'U8' | 'U10' | 'U12' | 'U14' | 'U16'>, Omit<CoachDrillPrescriptionV1, 'ageGroup'>> = {
  U8: {
    canonicalId: 'BM-001', legacyDrillIds: ['bm-l1-001'], name: 'Body Wraps – Stationary', module: 'BM', level: 1,
    allocatedMinutes: 3, bouts: { min: 2, max: 3 }, workSeconds: { min: 15, max: 20 }, restSeconds: { min: 15, max: 25 },
    workText: '2 × 15–20 s', restText: '15–25 s', allocationText: '3 min allocated group drill time', sideMode: 'both-directions', sourceStatus: 'LOCKED',
  },
  U10: {
    canonicalId: 'BM-001', legacyDrillIds: ['bm-l1-001'], name: 'Body Wraps – Stationary', module: 'BM', level: 1,
    allocatedMinutes: 4, bouts: { min: 2, max: 3 }, workSeconds: { min: 20, max: 25 }, restSeconds: { min: 15, max: 25 },
    workText: '2 × 20–25 s', restText: '15–25 s', allocationText: '4 min allocated group drill time', sideMode: 'both-directions', sourceStatus: 'LOCKED',
  },
  U12: {
    canonicalId: 'BM-001', legacyDrillIds: ['bm-l1-001'], name: 'Body Wraps – Stationary', module: 'BM', level: 1,
    allocatedMinutes: 4, bouts: { min: 2, max: 3 }, workSeconds: { min: 20, max: 25 }, restSeconds: { min: 15, max: 25 },
    workText: '3 × 20–25 s', restText: '15–25 s', allocationText: '4 min allocated group drill time', sideMode: 'both-directions', sourceStatus: 'LOCKED',
  },
  U14: {
    canonicalId: 'BM-001', legacyDrillIds: ['bm-l1-001'], name: 'Body Wraps – Stationary', module: 'BM', level: 1,
    allocatedMinutes: 4, bouts: { min: 2, max: 3 }, workSeconds: { min: 25, max: 30 }, restSeconds: { min: 15, max: 25 },
    workText: '3 × 25–30 s', restText: '15–25 s', allocationText: '4 min allocated group drill time', sideMode: 'both-directions', sourceStatus: 'LOCKED',
  },
  U16: {
    canonicalId: 'BM-001', legacyDrillIds: ['bm-l1-001'], name: 'Body Wraps – Stationary', module: 'BM', level: 1,
    allocatedMinutes: 3, bouts: { min: 2, max: 3 }, workSeconds: { min: 30, max: 30 }, restSeconds: { min: 15, max: 25 },
    workText: '2–3 × 30 s', restText: '15–25 s', allocationText: '3 min allocated group drill time', sideMode: 'both-directions', sourceStatus: 'LOCKED',
  },
};

export const COACH_PRESCRIPTION_AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16'] as const;

export function resolveCoachPrescriptionV1(drillId: string | undefined, ageGroup: AgeGroup | undefined): CoachDrillPrescriptionV1 | undefined {
  if (drillId !== 'bm-l1-001' || !ageGroup || !(ageGroup in BODY_WRAPS_BY_AGE)) return undefined;
  return { ...BODY_WRAPS_BY_AGE[ageGroup as keyof typeof BODY_WRAPS_BY_AGE], ageGroup };
}

export function coachPrescriptionForDrillV1(drillId: string | undefined): readonly CoachDrillPrescriptionV1[] {
  if (drillId !== 'bm-l1-001') return [];
  return COACH_PRESCRIPTION_AGE_GROUPS.map((ageGroup) => resolveCoachPrescriptionV1(drillId, ageGroup)!);
}

/** Calculates a transparent range for active work plus between-bout rest. */
export function prescriptionActiveDurationRangeSecondsV1(prescription: CoachDrillPrescriptionV1): CoachPrescriptionRangeV1 {
  const restIntervals = { min: Math.max(0, prescription.bouts.min - 1), max: Math.max(0, prescription.bouts.max - 1) };
  return {
    min: prescription.bouts.min * prescription.workSeconds.min + restIntervals.min * prescription.restSeconds.min,
    max: prescription.bouts.max * prescription.workSeconds.max + restIntervals.max * prescription.restSeconds.max,
  };
}

export function formatCoachPrescriptionV1(prescription: CoachDrillPrescriptionV1): string {
  const active = prescriptionActiveDurationRangeSecondsV1(prescription);
  return `${prescription.workText}; ${prescription.restText} rest between bouts; active execution ${active.min}–${active.max} s; ${prescription.allocationText}.`;
}
