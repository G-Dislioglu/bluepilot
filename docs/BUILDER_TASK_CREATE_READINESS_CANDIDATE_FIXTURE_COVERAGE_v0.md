# Builder Task Create Readiness Candidate Fixture Coverage v0

Datum: 2026-05-28
Status: BP-070 coverage map

Diese Datei beschreibt die aktuell lokal getestete Builder-Task-Create-Readiness-Candidate-Abdeckung.

Der Builder Task Create Readiness Candidate Mock ist weiterhin lokal. Diese Coverage beweist keinen echten Builder Task Create, keinen Live-Builder-Zugriff, keine Auth, keine Secrets, keine DB/Persistenz, kein Approval Recording und keine Ausfuehrung.

## Aktuelle Fixture-Faelle

| Case ID | Input | Output | Erwarteter Status | Zweck |
|---|---|---|---|---|
| `BP-068.prepared` | `examples/builder-task-create-readiness-candidate/BP-068.prepared.input.json` | `examples/builder-task-create-readiness-candidate/BP-068.prepared.output.json` | `task_create_readiness_prepared` | lokale Task-Create-Readiness-Huelle aus vorbereitetem Auth/Persistence Readiness Candidate |
| `BP-068.review-readiness-notes` | `examples/builder-task-create-readiness-candidate/BP-068.review-readiness-notes.input.json` | `examples/builder-task-create-readiness-candidate/BP-068.review-readiness-notes.output.json` | `requires_human_review` | Readiness Notes verhindern stille Task-Create-Readiness-Freigabe |
| `BP-068.blocked-auth-persistence-review` | `examples/builder-task-create-readiness-candidate/BP-068.blocked-auth-persistence-review.input.json` | `examples/builder-task-create-readiness-candidate/BP-068.blocked-auth-persistence-review.output.json` | `blocked` | non-prepared Auth/Persistence Readiness Candidate wird hart blockiert |
| `BP-068.blocked-create-request` | `examples/builder-task-create-readiness-candidate/BP-068.blocked-create-request.input.json` | `examples/builder-task-create-readiness-candidate/BP-068.blocked-create-request.output.json` | `blocked` | konkreter Task-Create-Request wird hart blockiert |

## Gepruefte Sicherheitsinvarianten

Die lokale Review Suite prueft:

- `task_create_effect` bleibt immer `none`,
- `execute_effect` bleibt immer `none`,
- `builder_task_create_allowed` bleibt immer `false`,
- `builder_execute_allowed` bleibt immer `false`,
- `live_builder_call_allowed` bleibt immer `false`,
- `blocked` enthaelt Blockgruende.

## Noch nicht abgedeckt

Noch nicht mit eigener Fixture abgedeckt:

- fehlende Pflichtfelder,
- `builder_adapter_mode` ungleich `none`,
- `execute_effect_requested` ungleich `none`,
- `identity_ready: true` oder `persistence_ready: true`,
- `builder_task_create_allowed: true`,
- `live_builder_call_allowed: true`,
- fehlendes oder unklares `target_repo`.

Diese Luecken sind erwartbar, weil BP-068 nur die erste lokale Builder-Task-Create-Readiness-Kette beweisen sollte.

## Naechste sinnvolle Fixture-Erweiterung

Vor echter Builder-Task-Erstellung oder Live-Builder-Naehe sollte mindestens eine Fixture fuer `builder_adapter_mode: "live"` oder `live_builder_call_allowed: true` ergaenzt werden.

## Aktueller Gap-Status

Dokumentierte Luecken existieren, aber keine Luecke blockiert den naechsten lokalen MVP-Ketten-Checkpoint.

Builder Task Create, Live Builder, Execute, Auth, Secrets, DB/Persistenz, Approval Recording, Approve, Push und Deploy bleiben weiterhin ausserhalb des erlaubten MVP-Runtimes.
