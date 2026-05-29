# BP-C5 Council Evidence Assignment Contract v0

Datum: 2026-05-29
Status: BP-114 implementation contract
Phase: BP-C5

## Ziel

Council Evidence Assignment ordnet eine Pipeline Evidence Envelope einem Task in einer aktiven Council Session zu.

## Input

Erlaubt:

- `--council-root <path>` zeigt auf ein Council Root.
- `--task-id <id>` bestimmt den Task in `session.json`.
- `--evidence <path>` liest eine Pipeline Evidence Envelope.

## Output

Das Tool:

- aktualisiert den Task in `session.json` um `evidence_refs`,
- haengt ein Event `pipeline_evidence_assigned` an `events.jsonl`,
- gibt JSON mit Assignment-Status aus.

## Harte Grenzen

Nicht erlaubt:

- Task-Status aendern,
- Directive erzeugen,
- Agent starten,
- Watcher starten,
- Human UI Review behaupten,
- Artefakte committen,
- Web UI bauen.

## Evidence Ref

Ein `evidence_refs` Eintrag enthaelt:

- `evidence_id`
- `evidence_path`
- `assigned_at`
- `pipeline_passed`
- `human_ui_review`
- `summary`

## Duplicate Verhalten

Wenn dieselbe `evidence_id` bereits am Task haengt:

- kein zweiter Eintrag,
- Event `pipeline_evidence_assignment_deduplicated`,
- Session bleibt semantisch unveraendert.

## Naechster Schritt

BP-115 kann Council Evidence Readiness oder Task-Audit-Anzeige vorbereiten:

- Evidence pro Task listen,
- weiterhin ohne Agent-Spawning,
- weiterhin ohne Web UI.
