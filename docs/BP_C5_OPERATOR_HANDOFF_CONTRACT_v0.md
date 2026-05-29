# BP-C5 Operator Handoff Contract v0

Datum: 2026-05-29
Status: BP-120 implementation contract
Phase: BP-C5

## Ziel

Operator Handoff rendert Report und Closeout Candidate in ein kurzes Markdown-Artefakt fuer menschliche Pruefung.

## Input

Erlaubt:

- `--report <path>` liest einen Council Session Report.
- `--candidate <path>` liest einen Closeout Candidate.
- `--out <path>` schreibt optional Markdown.

## Output

Das Handoff enthaelt:

- Closeout Status,
- was bereit ist,
- Blocking Reasons,
- Review Still Needed,
- Next Actions,
- Task Snapshot,
- Guardrails.

## Grenze

Markdown ist ein Review-Artefakt, keine Produkt-UI und kein automatischer Abschluss.

## Naechster Schritt

BP-121 kann Report Bundle, Closeout Candidate und Operator Handoff in einem CLI-Lauf erzeugen.
