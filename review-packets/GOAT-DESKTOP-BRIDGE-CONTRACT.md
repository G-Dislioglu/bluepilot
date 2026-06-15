# GOAT Desktop Bridge Contract Review Packet

## Scope

This bundle adds a Bluepilot contract-only surface for the local GOAT Desktop `/builder-cue` proposal path.

## Built

- `GET /probe/goat-desktop-bridge-contract` describes the local-only GOAT proposal boundary.
- `POST /probe/goat-desktop-builder-cue-preflight` validates proposed cue payloads without calling GOAT Desktop.
- The eight-point readiness model now marks `goat_desktop_bridge` as `wired_contract_only`.
- The operator dashboard shows GOAT as contract-only with accepted local geometry sources and `mayExecute:false`.

## Safety Notes

- Bluepilot does not call `http://127.0.0.1:8765`.
- No popup proposal is emitted from Bluepilot.
- No screenshot, mouse, keyboard, desktop, provider, runtime, DB, deploy, merge, or GitHub action is performed.
- Vision-only geometry remains rejected; accepted sources are `uia`, `ocr`, `active_window`, and `test_cue`.

## Evidence

| Command | Result |
| --- | --- |
| `npx tsx --test tests/goatDesktopBridgeContract.test.ts tests/goatDesktopBridgeRoute.test.ts tests/eightPointIntegrationReadiness.test.ts tests/meta.test.ts` | PASS - 12/12 |
| `npm run typecheck` | PASS |
| `git diff --check` | PASS |
| `npm test` | PASS - 313/313 |

## Reviewer Focus

Confirm that this is only a contract/preflight integration and that no local GOAT bridge call, desktop action, screenshot capture, or execution path has been activated.
