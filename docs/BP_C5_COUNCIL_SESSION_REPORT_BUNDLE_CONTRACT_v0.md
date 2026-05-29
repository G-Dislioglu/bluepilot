# BP-C5 Council Session Report Bundle Contract v0

Datum: 2026-05-29
Status: BP-118 implementation contract
Phase: BP-C5

## Ziel

Council Session Report Bundle schreibt JSON Report, Markdown Report und eine Bundle Summary in einem CLI-Lauf.

## Input

Erlaubt:

- `--council-root <path>` liest eine Council Session.
- `--out <dir>` schreibt lokale Report-Artefakte.

## Output

Das Bundle schreibt:

- `council-session-report.json`
- `council-session-report.md`
- `council-session-report-bundle.json`

## Grenzen

Nicht erlaubt:

- Council Runtime schreiben,
- Events schreiben,
- Task-Status aendern,
- Directives erzeugen,
- Agents starten,
- Web UI bauen,
- Human UI Review behaupten,
- Artefakte automatisch committen.

## Naechster Schritt

BP-C5 kann danach entscheiden, ob diese Reports in einen Operator-Handoff oder eine spaetere UI eingebunden werden.
