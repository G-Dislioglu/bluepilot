# Builder Task Candidate Fixture Coverage v0

Datum: 2026-05-28
Status: BP-051 coverage map

Diese Datei beschreibt die aktuell lokal getestete Builder-Task-Candidate-Abdeckung.

Der Candidate Mock ist weiterhin lokal. Diese Coverage beweist keinen Live-Builder-Zugriff, keine Task-Erstellung und keine Ausfuehrung.

## Aktuelle Fixture-Faelle

| Case ID | Input | Output | Erwarteter Status | Zweck |
|---|---|---|---|---|
| `BP-049.prepared` | `examples/builder-task-candidate/BP-049.prepared.input.json` | `examples/builder-task-candidate/BP-049.prepared.output.json` | `candidate_prepared` | lokaler Contract-Kandidat aus resolved Scope Resolver Output |
| `BP-049.review-risk-evidence` | `examples/builder-task-candidate/BP-049.review-risk-evidence.input.json` | `examples/builder-task-candidate/BP-049.review-risk-evidence.output.json` | `requires_human_review` | Risk Evidence verhindert stillen Task-Create-Fortschritt |
| `BP-049.blocked-scope-review` | `examples/builder-task-candidate/BP-049.blocked-scope-review.input.json` | `examples/builder-task-candidate/BP-049.blocked-scope-review.output.json` | `blocked` | Scope Resolver Review Status wird hart blockiert |
| `BP-049.blocked-create-intent` | `examples/builder-task-candidate/BP-049.blocked-create-intent.input.json` | `examples/builder-task-candidate/BP-049.blocked-create-intent.output.json` | `blocked` | Task-Create-Intent wird hart blockiert |

## Gepruefte Sicherheitsinvarianten

Die lokale Review Suite prueft:

- `builder_task_create_allowed` bleibt immer `false`,
- `builder_execute_allowed` bleibt immer `false`,
- `human_gate_required` bleibt immer `true`,
- `blocked` enthaelt Blockgruende,
- `requires_human_review` erlaubt keine Write-Kandidaten,
- `candidate_prepared` enthaelt eine sichtbare Notiz, dass Builder Task Create blockiert bleibt.

## Noch nicht abgedeckt

Noch nicht mit eigener Fixture abgedeckt:

- fehlende Pflichtfelder,
- Human Gate `required: false`,
- Scope Resolver `writes_allowed_now: true`,
- Scope Resolver `task_create_allowed: true`,
- Execute-/Approve-/Push-/Deploy-Operation,
- leere `required_evidence`,
- leere Read Scope.

Diese Luecken sind erwartbar, weil BP-049 nur die erste lokale Candidate-Kette beweisen sollte.

## Naechste sinnvolle Fixture-Erweiterung

Vor echter Builder-Adapter-Nahe sollte mindestens eine Fixture fuer Human Gate `required: false` oder eine Execute-/Deploy-Operation ergaenzt werden.

## Aktueller Gap-Status

Dokumentierte Luecken existieren, aber keine Luecke blockiert den naechsten reinen Human-Gate-Handoff-Contract.

Task Create, Execute, Approve, Push und Deploy bleiben weiterhin ausserhalb des erlaubten MVP-Runtimes.
