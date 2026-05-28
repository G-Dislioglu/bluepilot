# Scope Resolver Fixture Coverage v0

Datum: 2026-05-28
Status: BP-047 coverage map

Diese Datei beschreibt die aktuell lokal getestete Scope-Resolver-Abdeckung.

Der Scope Resolver ist weiterhin ein lokaler Mock. Diese Coverage beweist keinen Live-Builder-Zugriff und keine Task-Erstellung.

## Aktuelle Fixture-Faelle

| Case ID | Input | Output | Erwarteter Status | Zweck |
|---|---|---|---|---|
| `BP-045.resolved` | `examples/scope-resolver/BP-045.resolved.input.json` | `examples/scope-resolver/BP-045.resolved.output.json` | `resolved` | kleiner repo-relativer Scope nach gruenem Phase-Scanner |
| `BP-045.review-wildcard` | `examples/scope-resolver/BP-045.review-wildcard.input.json` | `examples/scope-resolver/BP-045.review-wildcard.output.json` | `requires_human_review` | Wildcard-Scope wird nicht hart erlaubt |
| `BP-045.blocked-phase-review` | `examples/scope-resolver/BP-045.blocked-phase-review.input.json` | `examples/scope-resolver/BP-045.blocked-phase-review.output.json` | `blocked` | Phase-Scanner-Review darf nicht in Task-Vorbereitung kippen |
| `BP-045.blocked-unsafe-path` | `examples/scope-resolver/BP-045.blocked-unsafe-path.input.json` | `examples/scope-resolver/BP-045.blocked-unsafe-path.output.json` | `blocked` | unsicherer Pfad wird hart blockiert |

## Gepruefte Sicherheitsinvarianten

Die lokale Review Suite prueft:

- `writes_allowed_now` bleibt immer `false`,
- `task_create_allowed` bleibt immer `false`,
- `requires_human_gate` bleibt immer `true`,
- `blocked` enthaelt Blockgruende,
- `requires_human_review` erlaubt keine Write-Kandidaten,
- `resolved` bleibt nur ein lokaler Scope-Envelope und kein Task Create.

## Noch nicht abgedeckt

Noch nicht mit eigener Fixture abgedeckt:

- fehlende Pflichtfelder,
- disallowed `operation_intent`,
- Daten/Auth/Secret Known Risk,
- breiter Scope ohne Wildcard,
- ueberlappende Multi-Track-Scopes,
- Council Trigger,
- Adapter-only Dependency Review.

Diese Luecken sind erwartbar, weil BP-045 nur die erste Mock-Kette beweisen sollte.

## Naechste sinnvolle Fixture-Erweiterung

Vor echter Builder-Task-Contract-Arbeit sollte mindestens eine Fixture fuer `operation_intent: "execute"` oder einen Daten/Auth/Secret Known Risk ergaenzt werden.

## Aktueller Gap-Status

Dokumentierte Luecken existieren, aber keine Luecke blockiert den naechsten reinen Handoff-Contract.

Task Create, Execute, Approve, Push und Deploy bleiben weiterhin ausserhalb des erlaubten MVP-Runtimes.
