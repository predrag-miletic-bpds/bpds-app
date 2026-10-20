import { describe, expect, it } from 'vitest';
import { resolveCoachPrescriptionV1, prescriptionActiveDurationRangeSecondsV1 } from './coach-prescriptions-v1';

describe('locked Coach Body Wraps adapter', () => {
  it.each([
    ['U8', 3, '2 × 15–20 s'], ['U10', 4, '2 × 20–25 s'], ['U12', 4, '3 × 20–25 s'],
    ['U14', 4, '3 × 25–30 s'], ['U16', 3, '2–3 × 30 s'],
  ] as const)('%s resolves the workbook record', (age, allocation, workText) => {
    const prescription = resolveCoachPrescriptionV1('bm-l1-001', age);
    expect(prescription?.canonicalId).toBe('BM-001');
    expect(prescription?.allocatedMinutes).toBe(allocation);
    expect(prescription?.workText).toBe(workText);
    expect(prescriptionActiveDurationRangeSecondsV1(prescription!)).toEqual(expect.objectContaining({ min: expect.any(Number), max: expect.any(Number) }));
  });
});
