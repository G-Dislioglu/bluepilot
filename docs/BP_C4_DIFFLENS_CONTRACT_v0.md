# BP-C4 DiffLens Contract v0

Datum: 2026-05-28
Status: BP-100 implementation contract
Phase: BP-C4

## Ziel

DiffLens v0 erzeugt aus Unified Diff Text eine lokale, maschinenlesbare Review-Evidence.

## Input

Erlaubte Inputs:

- `--diff <path>` liest eine Diff-Datei.
- stdin liest Diff-Text aus einer Pipe.

Nicht Teil von v0:

- selbst `git diff` ausfuehren,
- Dateien veraendern,
- Diffs akzeptieren oder verwerfen.

## Output

DiffLens gibt JSON aus:

- `tool`: `difflens`
- `version`
- `summary`
- `files`
- `risk_flags`
- `human_gate_required`
- `visual_review_required`

## Risk Flags

DiffLens markiert:

- binary diff,
- lockfile diff,
- package manifest diff,
- env/secrets path,
- executable/runtime path,
- large diff.

Die Flags sind advisory. Sie brechen den Prozess nicht ab, aber sie setzen `human_gate_required`.

## Menschliches Review

DiffLens v0 ersetzt kein Human UI Review.

Wenn `visual_review_required` true ist, bedeutet das:

- Ein Mensch muss den Diff beurteilen.
- Bei UI-Aufgaben braucht ein spaeterer Task zusaetzlich Screenshot, Playwright Flow und Human UI Review.

## Grenzen

DiffLens v0 ist kein Browser Preview.

DiffLens v0 ist keine UI.

DiffLens v0 ist kein Merge-/Approve-System.

## Naechster Schritt

Nach DiffLens v0 kann ein Browser-Preview-Readiness-Slice folgen:

- lokales Preview-Ziel definieren,
- Screenshot-Mechanik pruefen,
- Playwright-/Browser-Flow festlegen,
- Human UI Review Packet vorbereiten.
