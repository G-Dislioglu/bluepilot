# BP-C4 Browser Preview DOM Smoke Contract v0

Datum: 2026-05-28
Status: BP-104 implementation contract
Phase: BP-C4

## Ziel

Der DOM-Smoke prueft, ob die von `browser-preview.cjs` erzeugte HTML-Datei die erwartete Review-Struktur enthaelt.

## Input

Erlaubt:

- `--html <path>` liest die HTML-Preview.
- `--manifest <path>` liest optional das Preview-Manifest.

Nicht erlaubt:

- Browser starten,
- Screenshots erzeugen,
- HTML neu rendern,
- Git veraendern.

## Output

Das Tool gibt JSON aus:

- `tool`: `browser-preview-smoke`
- `checks`
- `passed`
- `browser_automation`: false
- `screenshot_check`: false
- `human_ui_review`: false

## Pflichtchecks

HTML:

- `<!doctype html>`
- `Bluepilot DiffLens Preview`
- `Review Gate`
- `Changed Files`
- `Risk Flags`
- `Human gate required`
- `Visual review required`
- viewport meta tag

Manifest, falls angegeben:

- `tool` ist `browser-preview`
- `summary` existiert
- `human_gate_required` ist boolean
- `visual_review_required` ist boolean

## Evidence-Grenze

Ein gruener DOM-Smoke bedeutet:

- Die lokale HTML-Preview ist strukturell brauchbar.
- Der naechste Browser-Smoke hat ein klares Ziel.

Ein gruener DOM-Smoke bedeutet nicht:

- Browser Automation Smoke,
- Screenshot Check,
- Human UI Review,
- BP-C4 green checkpoint.

## Naechster Schritt

BP-105 kann einen echten Browser-Automation-Smoke ausfuehren, wenn der lokale Playwright-/Browser-Weg stabil ist.
