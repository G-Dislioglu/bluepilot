# Auth/Persistence Readiness Candidate Fixture Coverage v0

Datum: 2026-05-28
Status: BP-065 coverage map

Diese Datei beschreibt die aktuell lokal getestete Auth/Persistence-Readiness-Candidate-Abdeckung.

Der Auth/Persistence Readiness Candidate Mock ist weiterhin lokal. Diese Coverage beweist keine Auth-Implementierung, keine Secrets, keine DB/Persistenz, kein Approval Recording, keinen Live-Builder-Zugriff, keine Task-Erstellung und keine Ausfuehrung.

## Aktuelle Fixture-Faelle

| Case ID | Input | Output | Erwarteter Status | Zweck |
|---|---|---|---|---|
| `BP-063.prepared` | `examples/auth-persistence-readiness-candidate/BP-063.prepared.input.json` | `examples/auth-persistence-readiness-candidate/BP-063.prepared.output.json` | `readiness_boundary_prepared` | lokale Auth-/Persistence-Readiness-Huelle aus vorbereitetem Approval Readiness Candidate |
| `BP-063.review-risk-evidence` | `examples/auth-persistence-readiness-candidate/BP-063.review-risk-evidence.input.json` | `examples/auth-persistence-readiness-candidate/BP-063.review-risk-evidence.output.json` | `requires_human_review` | Risk Evidence verhindert stille Auth-/Persistence-Readiness-Freigabe |
| `BP-063.blocked-approval-readiness-review` | `examples/auth-persistence-readiness-candidate/BP-063.blocked-approval-readiness-review.input.json` | `examples/auth-persistence-readiness-candidate/BP-063.blocked-approval-readiness-review.output.json` | `blocked` | non-prepared Approval Readiness Candidate wird hart blockiert |
| `BP-063.blocked-identity-provider` | `examples/auth-persistence-readiness-candidate/BP-063.blocked-identity-provider.input.json` | `examples/auth-persistence-readiness-candidate/BP-063.blocked-identity-provider.output.json` | `blocked` | konkreter Identity Provider wird hart blockiert |

## Gepruefte Sicherheitsinvarianten

Die lokale Review Suite prueft:

- `approval_record_effect` bleibt immer `none`,
- `identity_ready` bleibt immer `false`,
- `persistence_ready` bleibt immer `false`,
- `approval_record_allowed` bleibt immer `false`,
- `builder_task_create_allowed` bleibt immer `false`,
- `builder_execute_allowed` bleibt immer `false`,
- `blocked` enthaelt Blockgruende.

## Noch nicht abgedeckt

Noch nicht mit eigener Fixture abgedeckt:

- fehlende Pflichtfelder,
- `persistence_target` ungleich `none`,
- `approval_record_effect_requested` ungleich `none`,
- `approval_record_allowed: true`,
- `builder_task_create_allowed: true`,
- `builder_execute_allowed: true`,
- verbotener Intent wie `configure_auth` oder `configure_persistence`.

Diese Luecken sind erwartbar, weil BP-063 nur die erste lokale Auth/Persistence-Readiness-Kette beweisen sollte.

## Naechste sinnvolle Fixture-Erweiterung

Vor echter Auth-, Secret-, DB- oder Persistenznaehe sollte mindestens eine Fixture fuer `persistence_target: "postgres"` oder `readiness_intent: "configure_auth"` ergaenzt werden.

## Aktueller Gap-Status

Dokumentierte Luecken existieren, aber keine Luecke blockiert den naechsten lokalen MVP-Ketten-Checkpoint.

Auth, Secrets, DB/Persistenz, Approval Recording, Task Create, Execute, Approve, Push und Deploy bleiben weiterhin ausserhalb des erlaubten MVP-Runtimes.
