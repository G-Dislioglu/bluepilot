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

## Abgedeckte Decisions

| Decision | Abgedeckt durch |
|---|---|
| `allow_single_track` | `BP-027.allow.input.json` |
| `require_human_review` | `BP-004.input.json`, `BP-031.runtime-risk.input.json`, `BP-034.review-overlap-tracks.input.json`, `BP-034.review-dependent-track.input.json` |
| `reject` | `BP-027.reject-no-go.input.json`, `BP-033.reject-missing-evidence.input.json`, `BP-033.reject-unsafe-file-scope.input.json` |

## Abgedeckte Check-Gruppen

| Check-Gruppe | Abdeckung |
|---|---|
| Input Schema | indirekt ueber alle gueltigen Fixtures |
| Scope Clarity | `BP-027.allow.input.json`, `BP-004.input.json` |
| File Risk | `BP-033.reject-unsafe-file-scope.input.json` |
| No-Go Zones | `BP-027.reject-no-go.input.json` |
| Dependency Risk | Basis-Pass ueber alle aktuellen Fixtures |
| Runtime/Deploy Risk | `BP-027.reject-no-go.input.json`, `BP-031.runtime-risk.input.json` |
| Evidence Availability | `BP-033.reject-missing-evidence.input.json` |
| Track Independence | `BP-034.review-overlap-tracks.input.json`, `BP-034.review-dependent-track.input.json` |
| Known Risks | `BP-004.input.json`, `BP-031.runtime-risk.input.json` |
| Human Gate | Output-Invariant-Test fuer alle Fixtures |
| Council Trigger | Basis-Pass ueber alle aktuellen Fixtures |

## Aktuelle Luecken

Noch nicht explizit als Golden Fixture abgedeckt:

- fehlende Pflichtfelder wie `idea`, `target_repo` oder `requested_scope`,
- breiter Scope mit `everything`,
- Wildcard-Scope als `require_human_review`,
- adapterpflichtige Dependency-Risiken wie `maya context` oder `swarm`,
- Council-Trigger als review-only MVP-Ausgabe,
- Daten/Auth/Secret-Risiko als sichtbare Known-Risk-Verarbeitung.

## Arbeitsregel

Neue Phase-Scanner-Fixtures sollen:

1. ein Input-/Output-Paar unter `examples/phase-scanner/` haben,
2. in `tools/test-phase-scanner-fixtures.cjs` eingetragen sein,
3. automatisch durch `tools/test-phase-scanner-output-invariants.cjs` laufen,
4. in dieser Coverage Map nachgetragen werden.
