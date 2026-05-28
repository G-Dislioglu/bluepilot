# Phase Scanner Fixture Coverage v0

Datum: 2026-05-28
Status: BP-035 coverage map

Diese Datei zeigt, welche Phase-Scanner-Faelle lokal bereits durch Fixtures abgedeckt sind.

## Review-Befehle

```bash
node tools/test-phase-scanner-fixtures.cjs
node tools/test-phase-scanner-output-invariants.cjs
node tools/test-bluepilot-review-suite.cjs
```

## Fixture Matrix

| Fixture | Decision | Stoplight | Primaerer Zweck |
|---|---|---|---|
| `BP-004.input.json` | `require_human_review` | `yellow` | Known risk wird sichtbar verarbeitet |
| `BP-027.allow.input.json` | `allow_single_track` | `green` | sauber begrenzter Single-Track |
| `BP-027.reject-no-go.input.json` | `reject` | `red` | No-Go + Deploy-Block |
| `BP-031.runtime-risk.input.json` | `require_human_review` | `yellow` | explizites Runtime-Risiko |
| `BP-033.reject-missing-evidence.input.json` | `reject` | `red` | fehlende Evidence |
| `BP-033.reject-unsafe-file-scope.input.json` | `reject` | `red` | unsicherer Datei-Scope |
| `BP-034.review-overlap-tracks.input.json` | `require_human_review` | `yellow` | parallele Tracks mit Scope-Overlap |
| `BP-034.review-dependent-track.input.json` | `require_human_review` | `yellow` | parallele Tracks mit Abhaengigkeit |
| `BP-037.reject-missing-required.input.json` | `reject` | `red` | fehlendes Pflichtfeld |
| `BP-038.review-wildcard-scope.input.json` | `require_human_review` | `yellow` | Wildcard-Scope |
| `BP-038.review-broad-scope.input.json` | `require_human_review` | `yellow` | breiter Scope |
| `BP-039.review-adapter-dependency.input.json` | `require_human_review` | `yellow` | adapterpflichtige Dependency |
| `BP-040.review-council-trigger.input.json` | `require_human_review` | `yellow` | Council-Trigger review-only |

## Abgedeckte Decisions

| Decision | Abgedeckt durch |
|---|---|
| `allow_single_track` | `BP-027.allow.input.json` |
| `require_human_review` | `BP-004.input.json`, `BP-031.runtime-risk.input.json`, `BP-034.review-overlap-tracks.input.json`, `BP-034.review-dependent-track.input.json`, `BP-038.review-wildcard-scope.input.json`, `BP-038.review-broad-scope.input.json`, `BP-039.review-adapter-dependency.input.json`, `BP-040.review-council-trigger.input.json` |
| `reject` | `BP-027.reject-no-go.input.json`, `BP-033.reject-missing-evidence.input.json`, `BP-033.reject-unsafe-file-scope.input.json`, `BP-037.reject-missing-required.input.json` |

## Abgedeckte Check-Gruppen

| Check-Gruppe | Abdeckung |
|---|---|
| Input Schema | `BP-037.reject-missing-required.input.json` |
| Scope Clarity | `BP-027.allow.input.json`, `BP-004.input.json`, `BP-038.review-broad-scope.input.json` |
| File Risk | `BP-033.reject-unsafe-file-scope.input.json`, `BP-038.review-wildcard-scope.input.json` |
| No-Go Zones | `BP-027.reject-no-go.input.json` |
| Dependency Risk | `BP-039.review-adapter-dependency.input.json` |
| Runtime/Deploy Risk | `BP-027.reject-no-go.input.json`, `BP-031.runtime-risk.input.json` |
| Evidence Availability | `BP-033.reject-missing-evidence.input.json` |
| Track Independence | `BP-034.review-overlap-tracks.input.json`, `BP-034.review-dependent-track.input.json` |
| Known Risks | `BP-004.input.json`, `BP-031.runtime-risk.input.json` |
| Human Gate | Output-Invariant-Test fuer alle Fixtures |
| Council Trigger | `BP-040.review-council-trigger.input.json` |

## Aktuelle Luecken

Noch nicht explizit als Golden Fixture abgedeckt:

- Daten/Auth/Secret-Risiko als sichtbare Known-Risk-Verarbeitung.

## Arbeitsregel

Neue Phase-Scanner-Fixtures sollen:

1. ein Input-/Output-Paar unter `examples/phase-scanner/` haben,
2. in `tools/test-phase-scanner-fixtures.cjs` eingetragen sein,
3. automatisch durch `tools/test-phase-scanner-output-invariants.cjs` laufen,
4. in dieser Coverage Map nachgetragen werden.
