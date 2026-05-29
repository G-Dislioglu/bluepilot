# BP-C5 Pipeline Evidence Binding Contract v0

Datum: 2026-05-29
Status: BP-113 implementation contract
Phase: BP-C5

## Ziel

Pipeline Evidence Binding verbindet den lokalen Review Pipeline Output mit Task-Kontext und optionaler Council Session Evidence.

## Input

Erlaubt:

- `--summary <path>` liest `pipeline-summary.json`.
- `--task-id <id>` bestimmt den Contract-/Context-Bezug.
- `--out <path>` schreibt eine Evidence Envelope.
- `--repo <path>` setzt das Repo Root.
- `--council-root <path>` haengt optional ein Council Event an.

## Output

Die Evidence Envelope enthaelt:

- `tool`: `pipeline-evidence-bridge`
- `pipeline_summary`
- `context_binding`
- `council_binding`
- `claims`
- `human_ui_review`: false

## Council Binding

Wenn `--council-root` gesetzt ist:

- vorhandene Council Session wird gelesen,
- ein Event `pipeline_evidence_attached` wird in `events.jsonl` geschrieben,
- keine Agent-Datei wird geschrieben,
- keine Directive wird erzeugt,
- kein Watcher wird gestartet.

Wenn keine Council Session existiert:

- der Bridge-Lauf bleibt gueltig,
- `council_binding.status` ist `not_attached`.

## Grenzen

Nicht erlaubt:

- Agent-Spawning,
- Council Watcher starten,
- Task-Status aendern,
- Human UI Review behaupten,
- Artefakte automatisch committen,
- Web UI bauen.

## Naechster Schritt

BP-114 kann Council Evidence Assignment vorbereiten:

- Pipeline Evidence einem Task in einer aktiven Session zuordnen,
- weiterhin ohne Agent-Spawning,
- weiterhin ohne UI.
