/** BPDS Coach Athletic prescription adapter V1.
 * Source: BPDS_Athletic_Development_V1_FINAL_LOCKED_2026-10-04.xlsx
 * sheet 07_Age_Dosage; four owner-verified legacy-to-canonical mappings only.
 * STAGING ONLY: generator integration and automatic activation are forbidden.
 * All durations are GROUP ALLOCATIONS, never individual execution timers.
 */
export const ATHLETIC_ADAPTER_GENERATOR_ACTIVE = false as const;
export type AthleticAge = 'U8' | 'U10' | 'U12' | 'U14' | 'U16';
export type AthleticPrescription = Readonly<{
  legacyCode: string; canonicalId: string; age: AthleticAge;
  eligible: boolean; groupMinutes: number | null;
  workOrReps: string | null; distanceOrSpace: string | null;
  rest: string | null; source: 'LOCKED_ATHLETIC_V1';
}>;
const LEGACY_TO_CANONICAL: Readonly<Record<string,string>> = {
  "WUP-ATH-REACT-001": "ATH-REA-001",
  "WUP-ATH-REACT-002": "ATH-REA-007",
  "WUP-ATH-REACT-003": "ATH-REA-008",
  "WUP-ATH-DECEL-002": "ATH-MIX-015"
};
const AGE: readonly AthleticAge[] = ['U8','U10','U12','U14','U16'];
/** Rows ordered U8/U10/U12/U14/U16: eligible, allocated minutes, reps, space, rest. */
const LOCKED: Readonly<Record<string, readonly (readonly [string,number|null,string|null,string|null,string|null])[]>> = {
  "ATH-REA-001": [
    [
      "YES",
      4,
      "5 reaction reps",
      "3-4 m",
      "25-35 s"
    ],
    [
      "YES",
      4.5,
      "6 reps",
      "4-5 m",
      "30-40 s"
    ],
    [
      "YES",
      5,
      "6 reps",
      "5-6 m",
      "35-50 s"
    ],
    [
      "YES",
      5.5,
      "6-8 reps",
      "5-8 m",
      "40-60 s"
    ],
    [
      "YES",
      6,
      "6-8 reps",
      "6-10 m",
      "45-75 s"
    ]
  ],
  "ATH-REA-007": [
    [
      "HOLD",
      null,
      null,
      null,
      null
    ],
    [
      "YES",
      4.5,
      "5 x 4-5 m",
      "4-5 m",
      "30-40 s"
    ],
    [
      "YES",
      5,
      "6 x 5-6 m",
      "5-6 m",
      "35-50 s"
    ],
    [
      "YES",
      5.5,
      "6 x 6-8 m",
      "6-8 m",
      "40-60 s"
    ],
    [
      "YES",
      6,
      "6 x 8-10 m",
      "8-10 m",
      "45-75 s"
    ]
  ],
  "ATH-REA-008": [
    [
      "YES",
      4,
      "4 x 8 s",
      "3-5 m mirror box",
      "20-30 s"
    ],
    [
      "YES",
      4.5,
      "4 x 10 s",
      "3-5 m mirror box",
      "25-35 s"
    ],
    [
      "YES",
      5,
      "5 x 10-12 s",
      "3-5 m mirror box",
      "30-40 s"
    ],
    [
      "YES",
      5.5,
      "5 x 12 s",
      "3-5 m mirror box",
      "35-45 s"
    ],
    [
      "YES",
      6,
      "5 x 12-15 s",
      "3-5 m mirror box",
      "40-50 s"
    ]
  ],
  "ATH-MIX-015": [
    [
      "YES",
      4,
      "4-5 quality reps",
      "4-6 m",
      "20-30 s"
    ],
    [
      "YES",
      4.5,
      "5-6",
      "5-8 m",
      "30-40 s"
    ],
    [
      "YES",
      5,
      "5-6",
      "8-10 m",
      "40-60 s"
    ],
    [
      "YES",
      5.5,
      "5-6",
      "10-12 m",
      "45-75 s"
    ],
    [
      "YES",
      6,
      "5-6",
      "10-15 m",
      "50-90 s"
    ]
  ]
};
export function getAthleticCoachPrescription(legacyCode: string, age: string): AthleticPrescription | null {
  if (!AGE.includes(age as AthleticAge)) return null; // U19 not locked
  const canonicalId = LEGACY_TO_CANONICAL[legacyCode.toUpperCase()];
  if (!canonicalId) return null; // unresolved mappings stay unresolved
  const row = LOCKED[canonicalId]?.[AGE.indexOf(age as AthleticAge)];
  if (!row) return null;
  return Object.freeze({
    legacyCode: legacyCode.toUpperCase(), canonicalId, age: age as AthleticAge,
    eligible: row[0] === 'YES', groupMinutes: row[1],
    workOrReps: row[2], distanceOrSpace: row[3], rest: row[4],
    source: 'LOCKED_ATHLETIC_V1' as const
  });
}
export function getVerifiedAthleticLegacyMappings(): Readonly<Record<string,string>> {
  return LEGACY_TO_CANONICAL;
}
