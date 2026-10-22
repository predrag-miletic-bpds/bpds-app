import { describe, it, expect } from 'vitest';
import { getAthleticPrescription, getLegacyAthleticPrescription, listAthleticCatalog, listAthleticDosages, validateAthleticStaging, ATHLETIC_GENERATOR_ACTIVE } from './athletic-adapter-v2';
describe('locked Athletic staging', () => {
 it('stays generator-inactive', () => expect(ATHLETIC_GENERATOR_ACTIVE).toBe(false));
 it('has 129 catalog and 645 dosage rows', () => {expect(listAthleticCatalog()).toHaveLength(129);expect(listAthleticDosages()).toHaveLength(645)});
 it('has no missing or duplicate entries', () => expect(validateAthleticStaging()).toEqual([]));
 it('rejects U19 and unknown drills', () => {expect(getAthleticPrescription('ATH-FM-001','U19')).toBeNull();expect(getAthleticPrescription('UNKNOWN','U10')).toBeNull()});
 it('preserves HOLD and CONDITIONAL states', () => {expect(listAthleticDosages().filter(d=>d.Eligible==='HOLD')).toHaveLength(67);expect(listAthleticDosages().filter(d=>d.Eligible==='CONDITIONAL')).toHaveLength(3)});
 it('maps verified legacy codes and leaves two unresolved', () => {expect(getLegacyAthleticPrescription('WUP-ATH-REACT-001','U10')?.proposedDrillId).toBe('ATH-REA-001');expect(getLegacyAthleticPrescription('WUP-ATH-SPEED-001','U10')).toBeNull();expect(getLegacyAthleticPrescription('WUP-ATH-DECEL-001','U10')).toBeNull()});
 it('never treats group minutes as a countdown timer', () => {const d=getAthleticPrescription('ATH-FM-001','U8');expect(d?.groupAllocatedMinutes).toBe(3);expect(d?.canAutoGenerate).toBe(false)});
});
