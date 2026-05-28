# BP-C2 Green Checkpoint v0

Datum: 2026-05-28
Status: BP-094 checkpoint
Phase: BP-C2

## Entscheidung

BP-C2 ist als lokale Foundation-Phase gruen.

Gruen heisst hier:

- Multi-model Pool existiert als offline Routing-Schicht.
- Context Broker existiert als read-only Session-Start-Kontext.
- WLP Tooling kann fuer neue Contracts eine aktive Council Session erzwingen.
- Alle drei Module sind lokal getestet.
- Keine Provider-API, keine Secrets, keine UI, kein BP-C3 wurde gestartet.

## Gruene Module

| Modul | Task | Ergebnis |
|---|---|---|
| Multi-model Pool | BP-091 | `tools/model-pool.cjs` routet Rollen deterministisch und offline. |
| Context Broker | BP-092 | `tools/context-broker.cjs` laedt erlaubten Repo-Kontext read-only und blockt Secret-/Traversal-Pfade. |
| WLP Tooling | BP-093 | `tools/verify-task-lock.cjs` unterstuetzt optional `council_session_required: true`. |

## Evidence

Ausgefuehrt vor diesem Checkpoint:

- `node tools/test-bluepilot-review-suite.cjs`
- `node tools/model-pool.cjs route judge --capability review`
- `node tools/context-broker.cjs session-start BP-093 --include .env.local`
- `node tools/test-verify-task-lock-council-session.cjs`

Ergebnis:

- Suite gruen.
- Model Pool liefert `execution = route_only_no_api_call`.
- Context Broker blockt `.env.local`.
- Council Session Guard testet fehlende, pausierte und aktive Sessions.

## Bekannte Grenzen

- Model Pool ruft keine echten Provider auf.
- Context Broker hat noch keinen Architecture Digest.
- Context Broker nutzt noch keine semantische Repo-Indexierung.
- `excluded_context` ist noch nicht als vollstaendige Repulsion-Engine umgesetzt.
- WLP Guard ist opt-in pro Contract, nicht global fuer alte Tasks.

Diese Grenzen blockieren BP-C3 nicht, muessen dort aber als Input beruecksichtigt werden.

## BP-C3 Entry Gate

BP-C3 darf als naechste Phase vorbereitet werden.

Erlaubte BP-C3-Module:

- Parallel Executor: lokale Git-Worktree-/Branch-Isolation und Conflict Forecast.
- Maya Memory: Projekt- und Preference-Memory mit `proposal_only`-Grenze.
- AICOS Auto-query: read-only Card-Referenzen fuer Contracts.

Pflicht fuer jeden BP-C3-Task:

- eigener WLP-Contract,
- eigenes Review Packet,
- `council_session_required: true`,
- keine AICOS-Mutation,
- keine Secret-/Auth-/DB-/Deploy-Wirkung,
- kein BP-C4/BP-C5-Vorgriff.

## Nicht erlaubt in diesem Checkpoint

- kein BP-C3-Code,
- keine Worktrees anlegen,
- kein Memory-State schreiben,
- kein AICOS-Write,
- keine Provider-API,
- keine UI.

## Reuse Note

Der naechste sichere Schritt ist ein BP-C3-Prep-Run mit drei getrennten Contracts oder ein erster kleiner BP-C3-Slice fuer den Parallel Executor. Parallelitaet bleibt nur innerhalb BP-C3 erlaubt und setzt eine aktive Council Session voraus.
