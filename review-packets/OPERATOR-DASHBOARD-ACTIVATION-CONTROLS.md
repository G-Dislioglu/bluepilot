# Operator Dashboard Activation Controls Review Packet

## Scope

This bundle adds copy-only activation controls to the operator dashboard. The controls expose
payloads for provider preflight, runtime preflight, write preflight, and activation-lock review.

## Built

- Provider Preflight payload panel
- Runtime Preflight payload panel
- Write Preflight payload panel
- Activation Lock payload panel
- Copy buttons for each payload

## Safety Boundary

- No HTML form is rendered.
- No submit button is rendered.
- No browser-side `fetch` call is rendered.
- No provider call is made.
- No runtime is executed.
- No write or permit issuance is performed.
- No route or server mount is changed.

## Visual Evidence

- Desktop screenshot: `builder/output/playwright/operator-dashboard-controls-desktop.png`
- Mobile screenshot: `builder/output/playwright/operator-dashboard-controls-mobile.png`

Desktop layout measurement:

- 8 panels
- 4 controls
- 4 copy buttons
- 0 forms
- 0 submit buttons
- overlaps `[]`
- scrollWidth 1280, clientWidth 1280

Mobile layout measurement:

- 8 panels
- 4 controls
- 4 copy buttons
- 0 forms
- 0 submit buttons
- overlaps `[]`
- scrollWidth 390, clientWidth 390

## Evidence

| Check | Result |
| --- | --- |
| Focus tests | PASS - 15/15 |
| `npm run typecheck` | PASS |
| Desktop Playwright screenshot/layout | PASS |
| Mobile Playwright screenshot/layout | PASS |
| `node scripts/generate-bpk-governance-manifest.mjs` | PASS |
| `node tools/verify-task-lock.cjs OPERATOR-DASHBOARD-ACTIVATION-CONTROLS --verify --contract contracts/OPERATOR-DASHBOARD-ACTIVATION-CONTROLS.json` | PASS - no drift |
| `git diff --check` | PASS |
| `npm test` | PASS - 346/346 |

## Reviewer Focus

Confirm that the controls improve operator review ergonomics without turning the dashboard into an
executor UI. The next executable step must still be a separate target-specific lock.
