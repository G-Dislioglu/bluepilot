# BP-C5 Council Session Report Markdown Contract v0

Datum: 2026-05-29
Status: BP-117 implementation contract
Phase: BP-C5

## Ziel

Council Session Report Markdown rendert einen BP-116 JSON Report in ein kurzes, menschenlesbares Review-Artefakt.

## Input

Erlaubt:

- `--report <path>` liest einen BP-116 JSON Report.
- `--out <path>` schreibt optional Markdown.

## Output

Der Markdown Export enthaelt:

- Session Kopf,
- Gate Summary,
- Task Tabelle,
- Evidence Summary,
- Next Actions.

## Grenzen

Nicht erlaubt:

- Council Runtime lesen oder schreiben,
- Events schreiben,
- HTML/Web UI bauen,
- Human UI Review behaupten,
- Artefakte automatisch committen.

## Naechster Schritt

BP-118 kann JSON und Markdown in einem Bundle-Runner zusammenfuehren.
