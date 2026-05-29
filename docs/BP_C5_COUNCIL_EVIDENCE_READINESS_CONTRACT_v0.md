# BP-C5 Council Evidence Readiness Contract v0

Datum: 2026-05-29
Status: BP-115 implementation contract
Phase: BP-C5

## Ziel

Council Evidence Readiness listet pro Task, ob Pipeline Evidence vorhanden und technisch brauchbar ist.

## Input

Erlaubt:

- `--council-root <path>` liest eine Council Session.
- `--task-id <id>` filtert optional auf einen Task.

## Output

Das Tool gibt JSON aus:

- `tool`: `council-evidence-readiness`
- `session_id`
- `tasks`
- `summary`
- `read_only`: true

Pro Task:

- `task_id`
- `status`
- `evidence_count`
- `latest_evidence`
- `technical_ready`
- `human_ui_review`
- `missing_gates`

## Readiness Regeln

Technisch ready ist ein Task, wenn die letzte Evidence:

- `pipeline_passed: true`
- `browser_automation: true`
- `screenshot_check: true`

Human UI Review wird nicht inferiert.

Wenn `human_ui_review` false ist, bleibt es false.

## Grenzen

Nicht erlaubt:

- `session.json` schreiben,
- `events.jsonl` schreiben,
- Task-Status aendern,
- Directives erzeugen,
- Agents starten,
- UI bauen.

## Naechster Schritt

BP-116 kann diese Readiness in Council Summary/Session Report integrieren, weiterhin ohne Web UI.
