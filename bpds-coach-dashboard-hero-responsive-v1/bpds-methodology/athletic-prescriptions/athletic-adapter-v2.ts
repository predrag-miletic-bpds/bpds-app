/** BPDS Athletic staging adapter V2 — Generator OFF.
 * Import athletic-locked-v1.json generated from locked workbook 2026-10-04.
 * Canonical key is staging identity; proposedDrillId is NOT an approved active drill ID.
 */
import source from './athletic-locked-v1.json';
export const ATHLETIC_GENERATOR_ACTIVE = false as const;
export type Age = 'U8'|'U10'|'U12'|'U14'|'U16';
export type Eligibility = 'YES'|'HOLD'|'CONDITIONAL';
type Catalog = (typeof source.catalog)[number];
type Dosage = (typeof source.dosages)[number];
const ages: readonly string[] = ['U8','U10','U12','U14','U16'];
const catalogById = new Map(source.catalog.map(d => [d.proposedDrillId,d] as const));
const dosageByIdAge = new Map(source.dosages.map(d => [`${d['Drill ID']}|${d.Age}`,d] as const));
const legacyMap: Readonly<Record<string,string>> = Object.freeze({
 'WUP-ATH-REACT-001':'ATH-REA-001',
 'WUP-ATH-REACT-002':'ATH-REA-007',
 'WUP-ATH-REACT-003':'ATH-REA-008',
 'WUP-ATH-DECEL-002':'ATH-MIX-015',
});
export type AthleticResult = Readonly<{
  canonicalKey: string; proposedDrillId: string; displayName: string;
  age: Age; eligibility: Eligibility; canAutoGenerate: false;
  groupAllocatedMinutes: number | null;
  setsOrBouts: string | null; workOrReps: string | null;
  distanceOrSpace: string | null; rest: string | null;
  intensity: string | null; dosageStatus: string | null;
}>;
export function getAthleticPrescription(proposedId: string, age: string): AthleticResult | null {
  if (!ages.includes(age)) return null;
  const drill = catalogById.get(proposedId);
  const dosage = dosageByIdAge.get(`${proposedId}|${age}`);
  if (!drill || !dosage) return null;
  const eligibility = dosage.Eligible as Eligibility;
  return Object.freeze({
    canonicalKey: drill.canonicalKey, proposedDrillId: proposedId,
    displayName: drill.displayName, age: age as Age,
    eligibility, canAutoGenerate: false,
    groupAllocatedMinutes: typeof dosage['Total Drill Min'] === 'number' ? dosage['Total Drill Min'] : null,
    setsOrBouts: dosage['Sets / Bouts'], workOrReps: dosage['Work / Reps'],
    distanceOrSpace: dosage['Distance / Space'], rest: dosage.Rest,
    intensity: dosage.Intensity, dosageStatus: dosage['Dose Status'],
  });
}
export function getLegacyAthleticPrescription(legacyCode: string, age: string): AthleticResult | null {
  const id = legacyMap[legacyCode.toUpperCase()];
  return id ? getAthleticPrescription(id,age) : null;
}
export function listAthleticCatalog(): readonly Catalog[] { return source.catalog; }
export function listAthleticDosages(): readonly Dosage[] { return source.dosages; }
export function validateAthleticStaging(): string[] {
  const issues: string[] = [];
  if (source.catalog.length !== 129) issues.push('Catalog count mismatch');
  if (source.dosages.length !== 645) issues.push('Dosage count mismatch');
  if (catalogById.size !== 129) issues.push('Duplicate proposed drill IDs');
  if (dosageByIdAge.size !== 645) issues.push('Duplicate drill-age prescriptions');
  for (const drill of source.catalog) for (const age of ages)
    if (!dosageByIdAge.has(`${drill.proposedDrillId}|${age}`)) issues.push(`Missing ${drill.proposedDrillId}/${age}`);
  return issues;
}
