# BP-C5 Review Pipeline Orchestrator Contract v0

Datum: 2026-05-29
Status: BP-112 implementation contract
Phase: BP-C5

## Ziel

Der lokale Review Pipeline Orchestrator verbindet die bestehenden BP-C4-Tools in einem CLI-Befehl.

## Input

Erlaubt:

- `--range <git-range>` erzeugt den Diff via `git diff`.
- `--diff <path>` liest einen vorhandenen Patch.
- `--out <dir>` ist Pflicht und bestimmt das lokale Output-Verzeichnis.
- `--browser <path>` kann einen konkreten Browser erzwingen.

## Output

Der Orchestrator schreibt in `--out`:

- `diff-output.patch`
- `difflens-evidence.json`
- `preview.html`
- `preview.manifest.json`
- `dom-smoke.json`
- `browser-smoke.json`
- `preview.png`
- `screenshot-check.json`
- `pipeline-summary.json`

## Pipeline

Die Reihenfolge ist hart:

1. Diff erzeugen oder laden.
2. DiffLens Evidence erzeugen.
3. HTML Preview erzeugen.
4. DOM Smoke ausfuehren.
5. Browser Automation Smoke ausfuehren.
6. Screenshot Check ausfuehren.
7. Pipeline Summary schreiben.

## Grenzen

Der Orchestrator darf nicht:

- Artefakte automatisch committen,
- UI bauen,
- Accept/Reject/Merge ausfuehren,
- Deploy starten,
- Human UI Review behaupten,
- AICOS schreiben,
- Live Builder mutieren.

## Success

Der Lauf ist technisch erfolgreich, wenn:

- alle Artefakte geschrieben wurden,
- DOM Smoke passed,
- Browser Automation Smoke passed,
- Screenshot Check passed,
- `pipeline-summary.json` `passed: true` enthaelt.

## Human Review

`human_ui_review` bleibt immer `false`.

Ein bestandener Orchestrator-Lauf ersetzt kein menschliches Review.

## Naechster Schritt

Nach BP-112 kann BP-113 die Council-/Context-Einbindung vorbereiten:

- Task-Kontext via Context Broker laden,
- Pipeline Output als Council Evidence referenzieren,
- weiterhin ohne freie Web-UI.
