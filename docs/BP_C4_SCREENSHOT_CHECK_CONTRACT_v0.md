# BP-C4 Screenshot Check Contract v0

Datum: 2026-05-29
Status: BP-106 implementation contract
Phase: BP-C4

## Ziel

Screenshot Check oeffnet die lokale Browser-Preview-HTML in einem echten headless Browser, erzeugt ein PNG und prueft, ob das Artefakt technisch brauchbar ist.

## Input

Erlaubt:

- `--html <path>` liest eine lokale HTML-Preview.
- `--out <path>` schreibt den Screenshot.
- `--browser <path>` kann einen konkreten Browser erzwingen.

Ohne `--browser` sucht das Tool lokale Chromium-Familien-Browser wie Edge oder Chrome.

## Output

Das Tool gibt JSON aus:

- `tool`: `browser-screenshot-check`
- `passed`
- `browser`
- `url`
- `screenshot_path`
- `screenshot_bytes`
- `checks`
- `browser_automation`: true
- `screenshot_check`: true
- `human_ui_review`: false

## Pflichtchecks

Der Screenshot muss:

- existieren,
- eine PNG-Signatur haben,
- groesser als ein Mindestwert sein.

## Grenzen

Dieser Slice ist ein Screenshot Check.

Er ist nicht:

- Human UI Review,
- BP-C4 Green Checkpoint,
- BP-C5 Integration.

Screenshots bleiben lokal, ausser ein spaeterer WLP-Contract erlaubt committed Evidence.

## Fail-Verhalten

Wenn kein Browser gefunden wird:

- exit code 2,
- JSON mit `reason: "no_browser"`,
- kein Screenshot-Claim.

Wenn der Screenshot technisch unbrauchbar ist:

- exit code 1,
- JSON mit fehlgeschlagenen Checks.

## Naechster Schritt

BP-107 kann Human UI Review Readiness oder BP-C4 Green Checkpoint vorbereiten, je nachdem ob menschliches Review bereits erfolgen soll.
