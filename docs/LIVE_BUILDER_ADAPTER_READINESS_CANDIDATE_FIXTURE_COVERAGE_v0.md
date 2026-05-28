# Live Builder Adapter Readiness Candidate Fixture Coverage v0

Datum: 2026-05-28
Status: BP-080 coverage map

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

## Noch nicht abgedeckt

Noch nicht mit eigener Fixture abgedeckt:

- `builder_task_create_allowed: true`,
- `builder_execute_allowed: true`,
- fehlendes oder unklares `target_repo`.

Diese Luecken sind erwartbar, weil BP-078 und BP-079 nur die erste Pre-Live-Haertung ergaenzt haben.

## Naechste sinnvolle Fixture-Erweiterung

Vor echter Live-Builder-Naehe sollten mindestens Fixtures fuer `builder_task_create_allowed: true`, `builder_execute_allowed: true` und unklares `target_repo` ergaenzt werden.

## Aktueller Gap-Status

Dokumentierte Luecken existieren, aber keine Luecke blockiert den naechsten lokalen MVP-Ketten-Checkpoint.

Live Builder, Builder Task Create, Execute, Auth, Secrets, DB/Persistenz, Approval Recording, Approve, Push und Deploy bleiben weiterhin ausserhalb des erlaubten MVP-Runtimes.
