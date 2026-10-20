# BPDS Landing Page V1 — Approved / Locked

Date:
`2026-10-05`

Status:
`APPROVED / LOCKED`

Approved preview:
`https://bpds-home-landing-preview-2026-10-05-pi79dz2hk.vercel.app/`

Workspace:
`/workspace/scratch/ccbdd0fef2bc/bpds-home-landing-preview`

Build status:
`PASS`

## Approved Features

- premium Coach + Parent landing
- sticky navigation
- both CTAs visible above fold
- Coach section
- BPDS Home section
- Indoor Home
- Outdoor Court
- Parent workflow
- connected Coach–Player–Home concept
- pricing
- `/home` temporary Parent shell
- existing `/login` Coach flow preserved

## Locked Design Decisions

- black / white / orange BPDS identity
- “Every rep has a purpose.”
- Coach + Parent unified BPDS platform
- one scrolling landing page
- Coach remains primary professional product
- Parent/BPDS Home remains part of the same BPDS ecosystem
- Indoor Home and Outdoor Court remain distinct environments
- pricing currently displayed as:
  - Coach €69/month
  - Club €249/month for up to 5 coaches
  - Additional Coach +€39/month
  - BPDS Home €9.99/month

## Do Not Change Without Explicit Approval

- hero structure
- Coach / Parent architecture
- BPDS Home positioning
- pricing values
- connected player-development concept
- visual direction
- Coach `/login` behavior

## Next Product Phase

`BPDS Home V1 functional implementation`

Planned flow:

Parent entry  
→ child selection  
→ Indoor Home / Outdoor Court  
→ time selection  
→ equipment selection  
→ generated Home Practice  
→ Child Mode  
→ video + cues + timer  
→ Complete & Next  
→ Parent feedback  
→ Home Practice History

## Checkpoint Contents

- Application source: `bpds/bpds-prototype/`
- Landing source: `bpds/bpds-prototype/pages/home.tsx`
- Landing styles: `bpds/bpds-prototype/theme/current-production.css`
- Route entry: `bpds/bpds-prototype/bpds-prototype.tsx`
- Build configuration: `bpds/bpds-prototype/vite.config.js`
- Package manifest: `package.json`
- Lockfile: `pnpm-lock.yaml`

Build command:

`npm run build`

Result: Vite production build passed. The build emitted the current landing bundle under `bpds/bpds-prototype/dist/`.

## Safety Note

Production, Supabase, stable preview and GitHub main were not changed during this checkpoint task.

The approved landing preview remains an isolated reference and is not production.

The existing stable-state documentation file `/home/user/bpds/BPDS-CURRENT-STABLE-STATE-2026-10-04.md` was not available in this execution environment, so it was not modified or recreated elsewhere.
