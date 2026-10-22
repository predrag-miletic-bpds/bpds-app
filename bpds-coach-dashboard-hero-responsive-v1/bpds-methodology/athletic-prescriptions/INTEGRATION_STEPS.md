# BPDS Coach Athletic V2 — read-only staging integration

Target branch: bpds-coach-athletic-prescription-adapter-v1
Target directory: bpds-coach-dashboard-hero-responsive-v1/bpds-methodology/athletic-prescriptions/

Copy `athletic-locked-v1.json`, `athletic-adapter-v2.ts`, `athletic-adapter-v2.test.ts` and `verify-staging.cjs` into target directory. Do not overwrite `athletic-prescription-adapter-v1.ts` until its consumers are audited.

1. Verify SHA256 of JSON against this archive manifest.
2. Run `node verify-staging.cjs` in target directory.
3. Run TS checks and project build; add isolated read-only library viewer only after mapping and schema QA.
4. Verify current six legacy drills remain the only active legacy ATH library entries; do not register all 129 with the active drill catalog.
5. Validate collision of all proposed IDs with existing catalog IDs, prerequisite graph, age eligibility, and video references.
6. Confirm U19 returns null and HOLD/CONDITIONAL never auto-select.
7. Owner approval is required for unresolved legacy IDs WUP-ATH-SPEED-001 and WUP-ATH-DECEL-001 and for generator activation.

NO generator changes, NO existing UI changes, NO production deploy.
