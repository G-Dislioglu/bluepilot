# BP-C4 Browser Preview HTML Target Contract v0

Datum: 2026-05-28
Status: BP-102 implementation contract
Phase: BP-C4

## Ziel

Browser Preview v0 bekommt ein echtes lokales Ziel:

- statische HTML-Datei,
- aus DiffLens JSON erzeugt,
- ohne Dev-Server,
- ohne Browser-Automation.

## Input

Erlaubt:

- `--input <path>` liest DiffLens JSON.
- stdin liest DiffLens JSON.

Nicht erlaubt:

- selbst `git diff` ausfuehren,
- DiffLens erneut berechnen,
- Dateien ausserhalb des angegebenen Outputs veraendern.

## Output

Erlaubt:

- `--out <path>` schreibt HTML.
- ohne `--out` schreibt das Tool HTML nach stdout.
- `--manifest <path>` schreibt optional ein JSON-Manifest.

Das Manifest enthaelt:

- `tool`
- `version`
- `html_path`
- `source`
- `summary`
- `human_gate_required`
- `visual_review_required`

## Rendering-Regeln

Die HTML-Preview zeigt:

- Summary,
- Dateien,
- Hunks,
- Additions,
- Deletions,
- Risk Flags,
- Human Gate Status.

Alle Inhalte aus DiffLens JSON werden HTML-escaped.

## Evidence-Grenze

Diese HTML-Preview ist ein Browser-Ziel.

Sie ist noch nicht:

- Screenshot Check,
- Playwright Flow,
- Human UI Review,
- BP-C4 green checkpoint.

## Naechster Schritt

Nach BP-102 kann BP-103 einen echten lokalen Browser-Smoke ausfuehren:

- HTML-Preview erzeugen,
- lokal im Browser oeffnen,
- Screenshot oder DOM-Check erzeugen,
- Human UI Review weiterhin separat halten.
