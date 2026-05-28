# Approval Readiness Candidate Fixture Coverage v0

Datum: 2026-05-28
Status: BP-060 coverage map

Diese Datei beschreibt die aktuell lokal getestete Approval-Readiness-Candidate-Abdeckung.

Der Approval Readiness Candidate Mock ist weiterhin lokal. Diese Coverage beweist keine echte Approval-Wirkung, kein Approval Recording, keine Auth-/Identity-Loesung, keine Persistenz, keinen Live-Builder-Zugriff, keine Task-Erstellung und keine Ausfuehrung.

## Aktuelle Fixture-Faelle

| Case ID | Input | Output | Erwarteter Status | Zweck |
|---|---|---|---|---|
| `BP-058.prepared` | `examples/approval-readiness-candidate/BP-058.prepared.input.json` | `examples/approval-readiness-candidate/BP-058.prepared.output.json` | `readiness_candidate_prepared` | lokale Approval-Readiness-Huelle aus vorbereitetem Human Gate Candidate |
| `BP-058.review-risk-evidence` | `examples/approval-readiness-candidate/BP-058.review-risk-evidence.input.json` | `examples/approval-readiness-candidate/BP-058.review-risk-evidence.output.json` | `requires_human_review` | Risk Evidence verhindert stille Approval-Readiness-Freigabe |
| `BP-058.blocked-human-gate-review` | `examples/approval-readiness-candidate/BP-058.blocked-human-gate-review.input.json` | `examples/approval-readiness-candidate/BP-058.blocked-human-gate-review.output.json` | `blocked` | non-prepared Human Gate Candidate wird hart blockiert |
| `BP-058.blocked-approval-request` | `examples/approval-readiness-candidate/BP-058.blocked-approval-request.input.json` | `examples/approval-readiness-candidate/BP-058.blocked-approval-request.output.json` | `blocked` | wirksamer Approval-/Record-Request wird hart blockiert |

## Gepruefte Sicherheitsinvarianten

Die lokale Review Suite prueft:

- `approval_effect` bleibt immer `none`,
- `human_approval_recorded` bleibt immer `false`,
- `approval_record_allowed` bleibt immer `false`,
- `builder_task_create_allowed` bleibt immer `false`,
- `builder_execute_allowed` bleibt immer `false`,
- `blocked` enthaelt Blockgruende,
- `requires_human_review` erlaubt keine Write-Kandidaten,
- `readiness_candidate_prepared` benennt die spaeteren Auth-/Persistenzgrenzen.

## Noch nicht abgedeckt

Noch nicht mit eigener Fixture abgedeckt:

- fehlende Pflichtfelder,
- `human_approval_recorded: true`,
- `builder_task_create_allowed: true`,
- `builder_execute_allowed: true`,
- leere `read_scope`,
- leere `required_evidence`,
- leere `review_questions`,
- `identity_boundary` oder `persistence_boundary` ungleich `not_configured`.

Diese Luecken sind erwartbar, weil BP-058 nur die erste lokale Approval-Readiness-Kette beweisen sollte.

## Naechste sinnvolle Fixture-Erweiterung

Vor echter Approval-, Auth- oder Persistenznaehe sollte mindestens eine Fixture fuer `human_approval_recorded: true` oder `identity_boundary: "configured"` ergaenzt werden.

## Aktueller Gap-Status

Dokumentierte Luecken existieren, aber keine Luecke blockiert den naechsten lokalen MVP-Ketten-Checkpoint.

Approval, Approval Recording, Auth, Persistenz, Task Create, Execute, Approve, Push und Deploy bleiben weiterhin ausserhalb des erlaubten MVP-Runtimes.
