# BPDS Practice Review / PDF / QR V1 — QR DEEP-LINK LOCK

Status: LOCK CANDIDATE
Date: 2026-10-04
Branch: bpds-practice-review-pdf-v1-preview-2026-10-03

## Non-negotiable QR rule

PDF QR codes MUST NOT point directly to Vercel SPA routes such as:

- /practice/:id
- /drill/:id

Direct browser requests to those preview routes can return Vercel 404.

Every PDF QR must instead point to the BPDS root with a validated internal return target:

- /?returnTo=%2Fpractice%2F<id>
- /?returnTo=%2Fdrill%2F<id>

The loaded SPA then:

1. validates returnTo so only internal /practice/:id or /drill/:id paths are accepted;
2. if authenticated, navigates to that exact internal target;
3. if unauthenticated, client-navigates to /login?returnTo=<encoded internal target>;
4. after successful login, returns to the exact practice/drill.

No external return URL is allowed.

## Build guard

The isolated preview build MUST fail if:

- the JS bundle is corrupted/non-readable;
- required Practice Review / Resume / QR-safe route tokens disappear;
- direct window.location.origin + /practice/:id QR URLs reappear;
- direct window.location.origin + /drill/:id QR URLs reappear.

Guard script:
scripts/verify-preview-bundle.cjs

## Scope

This lock applies to:
- Practice QR in Coach Sheet / Practice Plan
- Drill QR cards embedded in practice PDF
- standalone Drill Print QR
- login return flow for those QR codes

Do not change this behavior during future source rebuilds unless explicitly approved after visual QR testing.

Production, Supabase, and GitHub main remain untouched until separate approval.
