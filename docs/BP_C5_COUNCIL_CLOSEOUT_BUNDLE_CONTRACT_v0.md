# BP-C5 Council Closeout Bundle Contract v0

Datum: 2026-05-29
Status: BP-121 implementation contract
Phase: BP-C5

## Ziel

Council Closeout Bundle erzeugt alle lokalen Closeout-Artefakte in einem Output-Verzeichnis.

## Input

Erlaubt:

- `--council-root <path>` liest eine Council Session.
- `--out <dir>` schreibt lokale Artefakte.

## Output

Das Bundle schreibt:

- `council-session-report.json`
- `council-session-report.md`
- `council-session-report-bundle.json`
- `council-closeout-candidate.json`
- `operator-handoff.md`
- `council-closeout-bundle.json`

## Grenzen

Nicht erlaubt:

- Session schreiben,
- Events schreiben,
- Agent starten,
- automatisch schliessen,
- Human Decision inferieren,
- Artefakte committen.

## Naechster Schritt

Danach kann BP-C5 entscheiden, ob ein bewusst manueller Closeout-Record gebaut wird.
