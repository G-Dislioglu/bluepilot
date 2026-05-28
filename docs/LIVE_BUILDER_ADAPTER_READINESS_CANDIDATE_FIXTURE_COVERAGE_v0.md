# Live Builder Adapter Readiness Candidate Fixture Coverage v0

Datum: 2026-05-28
Status: BP-082 coverage map

Diese Datei beschreibt die aktuell lokal getestete Live-Builder-Adapter-Readiness-Candidate-Abdeckung.

Der Live Builder Adapter Readiness Candidate Mock ist weiterhin lokal. Diese Coverage beweist keinen echten Live-Builder-Zugriff, keinen echten Builder Task Create, keine Auth, keine Secrets, keine DB/Persistenz, kein Approval Recording und keine Ausfuehrung.

## Aktuelle Fixture-Faelle

| Case ID | Input | Output | Erwarteter Status | Zweck |
|---|---|---|---|---|
| `BP-073.prepared` | `examples/live-builder-adapter-readiness-candidate/BP-073.prepared.input.json` | `examples/live-builder-adapter-readiness-candidate/BP-073.prepared.output.json` | `live_builder_adapter_readiness_prepared` | lokale Live-Builder-Adapter-Readiness-Huelle aus vorbereitetem Builder Task Create Readiness Candidate |
| `BP-073.review-readiness-notes` | `examples/live-builder-adapter-readiness-candidate/BP-073.review-readiness-notes.input.json` | `examples/live-builder-adapter-readiness-candidate/BP-073.review-readiness-notes.output.json` | `requires_human_review` | Readiness Notes verhindern stille Live-Builder-Adapter-Readiness-Freigabe |
| `BP-073.blocked-task-create-readiness-review` | `examples/live-builder-adapter-readiness-candidate/BP-073.blocked-task-create-readiness-review.input.json` | `examples/live-builder-adapter-readiness-candidate/BP-073.blocked-task-create-readiness-review.output.json` | `blocked` | non-prepared Builder Task Create Readiness Candidate wird hart blockiert |
| `BP-073.blocked-live-target` | `examples/live-builder-adapter-readiness-candidate/BP-073.blocked-live-target.input.json` | `examples/live-builder-adapter-readiness-candidate/BP-073.blocked-live-target.output.json` | `blocked` | konkreter Live-Builder-Target-, Auth-, Secret-, Persistence- oder Network-Request wird hart blockiert |
| `BP-078.missing-required` | `examples/live-builder-adapter-readiness-candidate/BP-078.missing-required.input.json` | `examples/live-builder-adapter-readiness-candidate/BP-078.missing-required.output.json` | `blocked` | fehlende Pflichtfelder werden als blockierter lokaler Output sichtbar |
| `BP-079.blocked-adapter-mode` | `examples/live-builder-adapter-readiness-candidate/BP-079.blocked-adapter-mode.input.json` | `examples/live-builder-adapter-readiness-candidate/BP-079.blocked-adapter-mode.output.json` | `blocked` | `builder_adapter_mode` ungleich `none` wird hart blockiert |
| `BP-079.blocked-task-create-effect` | `examples/live-builder-adapter-readiness-candidate/BP-079.blocked-task-create-effect.input.json` | `examples/live-builder-adapter-readiness-candidate/BP-079.blocked-task-create-effect.output.json` | `blocked` | `task_create_effect` ungleich `none` wird hart blockiert |
| `BP-079.blocked-execute-effect` | `examples/live-builder-adapter-readiness-candidate/BP-079.blocked-execute-effect.input.json` | `examples/live-builder-adapter-readiness-candidate/BP-079.blocked-execute-effect.output.json` | `blocked` | `execute_effect` ungleich `none` wird hart blockiert |
| `BP-079.blocked-live-allowed` | `examples/live-builder-adapter-readiness-candidate/BP-079.blocked-live-allowed.input.json` | `examples/live-builder-adapter-readiness-candidate/BP-079.blocked-live-allowed.output.json` | `blocked` | `live_builder_call_allowed: true` wird hart blockiert |
| `BP-081.blocked-task-create-allowed` | `examples/live-builder-adapter-readiness-candidate/BP-081.blocked-task-create-allowed.input.json` | `examples/live-builder-adapter-readiness-candidate/BP-081.blocked-task-create-allowed.output.json` | `blocked` | `builder_task_create_allowed: true` wird hart blockiert |
| `BP-081.blocked-execute-allowed` | `examples/live-builder-adapter-readiness-candidate/BP-081.blocked-execute-allowed.input.json` | `examples/live-builder-adapter-readiness-candidate/BP-081.blocked-execute-allowed.output.json` | `blocked` | `builder_execute_allowed: true` wird hart blockiert |
| `BP-081.blocked-missing-target-repo` | `examples/live-builder-adapter-readiness-candidate/BP-081.blocked-missing-target-repo.input.json` | `examples/live-builder-adapter-readiness-candidate/BP-081.blocked-missing-target-repo.output.json` | `blocked` | fehlendes `target_repo` wird hart blockiert und als Review-Notiz sichtbar |

## Gepruefte Sicherheitsinvarianten

Die lokale Review Suite prueft:

- `network_effect` bleibt immer `none`,
- `task_create_effect` bleibt immer `none`,
- `execute_effect` bleibt immer `none`,
- `builder_task_create_allowed` bleibt immer `false`,
- `builder_execute_allowed` bleibt immer `false`,
- `live_builder_call_allowed` bleibt immer `false`,
- `blocked` enthaelt Blockgruende.
- CLI-Fehlerformat ist lokal getestet.

## Pre-Live-Haertungsstatus

Pre-Live-Haertungs-Fixture-Gaps sind lokal abgedeckt:

- fehlende Pflichtfelder,
- CLI-Fehlerformat fuer fehlenden oder unlesbaren Input,
- `builder_adapter_mode` ungleich `none`,
- `task_create_effect` ungleich `none`,
- `execute_effect` ungleich `none`,
- `builder_task_create_allowed: true`,
- `builder_execute_allowed: true`,
- `live_builder_call_allowed: true`,
- fehlendes `target_repo`.

Keine bekannte Fixture-Luecke blockiert den lokalen Checkpoint.

## Naechste sinnvolle Fixture-Erweiterung

Vor echter Live-Builder-Naehe muessen neue Fixture-Erweiterungen aus einem separaten Live-Readiness- oder Auth-/Secret-/Persistence-Contract kommen.

## Aktueller Gap-Status

Keine bekannte Fixture-Luecke blockiert den naechsten lokalen MVP-Ketten-Checkpoint.

Live Builder, Builder Task Create, Execute, Auth, Secrets, DB/Persistenz, Approval Recording, Approve, Push und Deploy bleiben weiterhin ausserhalb des erlaubten MVP-Runtimes.
