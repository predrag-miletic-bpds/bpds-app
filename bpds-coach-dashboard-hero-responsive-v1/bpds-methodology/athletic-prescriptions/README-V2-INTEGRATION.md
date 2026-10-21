# Athletic Adapter V2 integration gate (STAGING ONLY)

Source: BPDS_Athletic_Development_V1_FINAL_LOCKED_2026-10-04.xlsx (01_Drill_Catalog, 07_Age_Dosage).

The V2 staging package contains 129 canonical rows and 645 age-dose rows (U8-U16), and is maintained as a separately verified artifact until the full JSON payload is committed. Do not import this README as an adapter and do not claim V2 is wired into Coach.

The existing V1 adapter remains disabled. Do not activate Generator Engine V1 or Athletic generator selection. Do not alter legacy IDs, video, saved practices, Coach UI or production.

Acceptance gates before enabling: (1) add the exact locked JSON + typed read-only adapter, (2) validate counts/uniqueness/eligibility and U19 guard, (3) collision checks against live catalog, (4) prerequisite graph resolution, (5) review two unresolved legacy mappings, (6) test build, age eligibility, saved practice compatibility and Drill Library, (7) owner approval.

The locked workbook explicitly sets generator OFF. Group allocated minutes are not individual timers. HOLD and CONDITIONAL do not auto-generate.
