# BPDS Correct Production Source — Recovered 2026-10-03

This package is reconstructed from the exact frontend currently used by `https://bpds-app.vercel.app/`.

## Proof
- Current production loads JS: `assets/index-aeiKHX6d.js`.
- Exact JS SHA-256: `1fb8b6311f6e216d4b000cef0d7675b1fe55c2bdb1ce9d737bb75c1efee36100`.
- Current production loads CSS: `assets/index-DhWx8RPM-practice-fix-v2.css`.
- Exact CSS SHA-256: `c3cb0c93462d1adbaf1f77a238a193b6a3d6d8fea8f0aa7ed4e1eec3bd9883dc`.
- Both hashes match `BPDS-FINAL-APPROVED-CHECKPOINT-2026-09-25`.

## Source recovery
The accepted direct-build archive contains `index-aeiKHX6d.js.map` with `sourcesContent` for 52 BPDS runtime source files from `/home/user/bpds`. Those files were restored verbatim here and overlaid on the project scaffold.

The production CSS source files were not embedded in the JS sourcemap. To avoid approximating the UI, this recovery uses the exact approved compiled CSS verbatim (`theme/current-production.css`) and generated stable CSS-module class maps parsed from the exact approved JS. This preserves the approved UI rather than rebuilding it from older CSS module source.

## Important
This is the correct baseline for restoring an editable version of the CURRENT approved production frontend. It is not the October 2 Practice Review checkpoint and it is not the old GitHub August UI branches.

Before merging Practice Review + PDF/Print V1, build and preview this baseline first and visually compare it to production. Do not modify production or Supabase during verification.
