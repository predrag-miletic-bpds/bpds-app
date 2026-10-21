/** Coach Athletic staging integration gate. No UI or generator imports this module.
 * Legacy library identities remain authoritative; canonical IDs are staged.
 */
import { getAthleticCoachPrescription, ATHLETIC_ADAPTER_GENERATOR_ACTIVE } from './athletic-prescription-adapter-v1.js';
export const ATHLETIC_STAGING_ONLY = true as const;
export const ATHLETIC_GENERATOR_ENABLED = ATHLETIC_ADAPTER_GENERATOR_ACTIVE;
export const COACH_ATHLETIC_LEGACY_CODES = Object.freeze([
  'WUP-ATH-REACT-001','WUP-ATH-SPEED-001','WUP-ATH-REACT-002',
  'WUP-ATH-DECEL-001','WUP-ATH-DECEL-002','WUP-ATH-REACT-003'
] as const);
export const UNRESOLVED_LEGACY_CODES = Object.freeze([
  'WUP-ATH-SPEED-001','WUP-ATH-DECEL-001'
] as const);
export function lookupCoachAthleticStaging(legacyCode: string, age: string) {
  if (!COACH_ATHLETIC_LEGACY_CODES.includes(legacyCode.toUpperCase() as typeof COACH_ATHLETIC_LEGACY_CODES[number])) return null;
  const result = getAthleticCoachPrescription(legacyCode,age);
  return result ? { ...result, generatorEnabled: false as const, stagingOnly: true as const } : null;
}
