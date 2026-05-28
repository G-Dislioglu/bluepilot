# Human Gate Candidate Fixture Coverage v0

Datum: 2026-05-28
Status: BP-055 coverage map

Diese Datei beschreibt die aktuell lokal getestete Human-Gate-Candidate-Abdeckung.

Der Human Gate Candidate Mock ist weiterhin lokal. Diese Coverage beweist keine echte Approval-Wirkung, keinen Live-Builder-Zugriff, keine Task-Erstellung und keine Ausfuehrung.

## Aktuelle Fixture-Faelle

| Case ID | Input | Output | Erwarteter Status | Zweck |
|---|---|---|---|---|
| `BP-053.prepared` | `examples/human-gate-candidate/BP-053.prepared.input.json` | `examples/human-gate-candidate/BP-053.prepared.output.json` | `review_candidate_prepared` | lokale Human-Review-Huelle aus vorbereitetem Candidate |
| `BP-053.review-risk-evidence` | `examples/human-gate-candidate/BP-053.review-risk-evidence.input.json` | `examples/human-gate-candidate/BP-053.review-risk-evidence.output.json` | `requires_human_review` | Risk Evidence verhindert stille Approval-Wirkung |
| `BP-053.blocked-candidate-review` | `examples/human-gate-candidate/BP-053.blocked-candidate-review.input.json` | `examples/human-gate-candidate/BP-053.blocked-candidate-review.output.json` | `blocked` | non-prepared Builder Task Candidate wird hart blockiert |
| `BP-053.blocked-approval-effect` | `examples/human-gate-candidate/BP-053.blocked-approval-effect.input.json` | `examples/human-gate-candidate/BP-053.blocked-approval-effect.output.json` | `blocked` | wirksamer Approval Effect wird hart blockiert |

## Gepruefte Sicherheitsinvarianten

Die lokale Review Suite prueft:

- `approval_effect` bleibt immer `none`,
- `human_approval_recorded` bleibt immer `false`,
- `builder_task_create_allowed` bleibt immer `false`,
- `builder_execute_allowed` bleibt immer `false`,
- `blocked` enthaelt Blockgruende,
- `requires_human_review` erlaubt keine Write-Kandidaten,
- `review_candidate_prepared` enthaelt Review-Fragen.

## Noch nicht abgedeckt

Noch nicht mit eigener Fixture abgedeckt:

- fehlende Pflichtfelder,
- `human_gate_required: false`,
- `builder_task_create_allowed: true`,
- `builder_execute_allowed: true`,
- leere `read_scope`,
- leere `required_evidence`,
- verbotener `review_intent` wie `approve_task` oder `execute_task`.

Diese Luecken sind erwartbar, weil BP-053 nur die erste lokale Human-Gate-Kette beweisen sollte.

## Naechste sinnvolle Fixture-Erweiterung

Vor echter Approval- oder UI-Naehe sollte mindestens eine Fixture fuer `review_intent: "approve_task"` oder `builder_task_create_allowed: true` ergaenzt werden.

## Aktueller Gap-Status

Dokumentierte Luecken existieren, aber keine Luecke blockiert den lokalen MVP-Ketten-Checkpoint.

Approval, Task Create, Execute, Approve, Push und Deploy bleiben weiterhin ausserhalb des erlaubten MVP-Runtimes.
