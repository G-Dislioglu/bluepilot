# BP-C5 Council Session Report Contract v0

Datum: 2026-05-29
Status: BP-116 implementation contract
Phase: BP-C5

## Ziel

Council Session Report fasst eine aktive oder abgeschlossene Council Session read-only zusammen.

## Input

Erlaubt:

- `--council-root <path>` liest eine Council Session.
- `--out <path>` schreibt optional ein JSON-Report-Artefakt.

## Output

Das Tool gibt JSON aus:

- `tool`: `council-session-report`
- `session`
- `tasks`
- `agents`
- `events`
- `evidence`
- `gates`
- `next_actions`
- `read_only`: true

## Gates

Der Report berechnet nur technische Gates:

- `all_tasks_terminal`
- `all_tasks_done_or_skipped`
- `no_hard_stop`
- `all_tasks_have_evidence`
- `all_technical_evidence_ready`
- `human_ui_review_complete`

Human UI Review wird nicht inferiert.

## Grenzen

Nicht erlaubt:

- `session.json` schreiben,
- `events.jsonl` schreiben,
- Task-Status aendern,
- Directives erzeugen,
- Agents starten,
- UI bauen,
- Human UI Review behaupten.

## Naechster Schritt

BP-117 kann diesen JSON Report in ein Markdown Review-Artefakt rendern.
