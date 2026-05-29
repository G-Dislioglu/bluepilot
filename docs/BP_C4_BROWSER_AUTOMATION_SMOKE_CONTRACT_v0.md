# BP-C4 Browser Automation Smoke Contract v0

Datum: 2026-05-29
Status: BP-105 implementation contract
Phase: BP-C4

## Ziel

Browser Automation Smoke oeffnet die lokale Browser-Preview-HTML in einem echten headless Browser und prueft, ob die erwartete Review-Struktur im Browser-DOM sichtbar ist.

## Input

Erlaubt:

- `--html <path>` liest eine lokale HTML-Preview.
- `--manifest <path>` liest optional das Preview-Manifest.
- `--browser <path>` kann einen konkreten Browser erzwingen.

Ohne `--browser` sucht das Tool lokale Chromium-Familien-Browser wie Edge oder Chrome.

## Output

Das Tool gibt JSON aus:

- `tool`: `browser-automation-smoke`
- `passed`
- `browser`
- `url`
- `checks`
- `browser_automation`: true
- `screenshot_check`: false
- `human_ui_review`: false

## Pflichtchecks

Der Browser-DOM muss enthalten:

- `Bluepilot DiffLens Preview`
- `Review Gate`
- `Changed Files`
- `Risk Flags`
- `Human gate required`
- `Visual review required`

Wenn ein Manifest angegeben ist:

- Manifest-Tool ist `browser-preview`.
- Manifest passt als Preview-Metadatenquelle.

## Grenzen

Dieser Smoke ist echte Browser-Automation.

Er ist nicht:

- Screenshot Check,
- Human UI Review,
- BP-C4 Green Checkpoint,
- BP-C5 Integration.

## Fail-Verhalten

Wenn kein Browser gefunden wird:

- exit code 2,
- JSON mit `reason: "no_browser"`,
- keine Datei wird veraendert.

Wenn Browser-DOM-Checks fehlschlagen:

- exit code 1,
- JSON mit fehlgeschlagenen Checks.

## Naechster Schritt

BP-106 kann Screenshot Check als separaten BP-C4-Slice bauen.
