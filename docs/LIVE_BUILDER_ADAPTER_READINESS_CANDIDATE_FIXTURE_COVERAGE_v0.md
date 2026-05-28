# Live Builder Adapter Readiness Candidate Fixture Coverage v0

Datum: 2026-05-28
Status: BP-075 coverage map

Diese Datei beschreibt die aktuell lokal getestete Live-Builder-Adapter-Readiness-Candidate-Abdeckung.

Der Live Builder Adapter Readiness Candidate Mock ist weiterhin lokal. Diese Coverage beweist keinen echten Live-Builder-Zugriff, keinen echten Builder Task Create, keine Auth, keine Secrets, keine DB/Persistenz, kein Approval Recording und keine Ausfuehrung.

## Aktuelle Fixture-Faelle

| Case ID | Input | Output | Erwarteter Status | Zweck |
|---|---|---|---|---|
| `BP-073.prepared` | `examples/live-builder-adapter-readiness-candidate/BP-073.prepared.input.json` | `examples/live-builder-adapter-readiness-candidate/BP-073.prepared.output.json` | `live_builder_adapter_readiness_prepared` | lokale Live-Builder-Adapter-Readiness-Huelle aus vorbereitetem Builder Task Create Readiness Candidate |
| `BP-073.review-readiness-notes` | `examples/live-builder-adapter-readiness-candidate/BP-073.review-readiness-notes.input.json` | `examples/live-builder-adapter-readiness-candidate/BP-073.review-readiness-notes.output.json` | `requires_human_review` | Readiness Notes verhindern stille Live-Builder-Adapter-Readiness-Freigabe |
| `BP-073.blocked-task-create-readiness-review` | `examples/live-builder-adapter-readiness-candidate/BP-073.blocked-task-create-readiness-review.input.json` | `examples/live-builder-adapter-readiness-candidate/BP-073.blocked-task-create-readiness-review.output.json` | `blocked` | non-prepared Builder Task Create Readiness Candidate wird hart blockiert |
| `BP-073.blocked-live-target` | `examples/live-builder-adapter-readiness-candidate/BP-073.blocked-live-target.input.json` | `examples/live-builder-adapter-readiness-candidate/BP-073.blocked-live-target.output.json` | `blocked` | konkreter Live-Builder-Target-, Auth-, Secret-, Persistence- oder Network-Request wird hart blockiert |

## Gepruefte Sicherheitsinvarianten

Die lokale Review Suite prueft:

- `network_effect` bleibt immer `none`,
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
- `task_create_effect` ungleich `none`,
- `execute_effect` ungleich `none`,
- `builder_task_create_allowed: true`,
- `builder_execute_allowed: true`,
- `live_builder_call_allowed: true`,
- fehlendes oder unklares `target_repo`.

Diese Luecken sind erwartbar, weil BP-073 nur die erste lokale Live-Builder-Adapter-Readiness-Kette beweisen sollte.

## Naechste sinnvolle Fixture-Erweiterung

Vor echter Live-Builder-Naehe sollte mindestens eine Fixture fuer `live_builder_call_allowed: true` oder `builder_adapter_mode: "live"` ergaenzt werden.

## Aktueller Gap-Status

Dokumentierte Luecken existieren, aber keine Luecke blockiert den naechsten lokalen MVP-Ketten-Checkpoint.

Live Builder, Builder Task Create, Execute, Auth, Secrets, DB/Persistenz, Approval Recording, Approve, Push und Deploy bleiben weiterhin ausserhalb des erlaubten MVP-Runtimes.
