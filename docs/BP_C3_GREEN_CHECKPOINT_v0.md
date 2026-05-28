# BP-C3 Green Checkpoint v0

Datum: 2026-05-28
Status: BP-098 checkpoint
Phase: BP-C3

## Entscheidung

BP-C3 ist als lokale Parallel-Execution-Foundation gruen.

Gruen heisst hier:

- Parallel Executor verwaltet Git-Worktrees lokal und testet Cleanup bei Fehlern.
- Maya Memory speichert nur begrenzte Projekt-/Preference-Keys und ist standardmaessig `proposal_only`.
- AICOS Auto-query findet read-only Card-Kandidaten mit nachvollziehbaren Keyword-Gruenden.
- Alle drei Module sind lokal getestet.
- Kein Agent-Spawning, kein BP-C4, keine UI und kein AICOS-Write wurden gestartet.

## Gruene Module

| Modul | Task | Ergebnis |
|---|---|---|
| Parallel Executor | BP-095 | `tools/parallel-executor.cjs` kann Worktrees listen, anlegen, entfernen und per `finally` aufraeumen. |
| Maya Memory | BP-096 | `tools/maya-memory.cjs` speichert erlaubte Keys als JSON und markiert Eintraege default `proposal_only`. |
| AICOS Auto-query | BP-097 | `tools/aicos-query.cjs` matched Card-Kandidaten read-only und schreibt keine Registry. |

## Evidence

Ausgefuehrt vor diesem Checkpoint:

- `node tools/test-bluepilot-review-suite.cjs`
- BP-095 Review Packet: Parallel Executor Fixtures gruen.
- BP-096 Review Packet: Maya Memory Fixtures gruen.
- BP-097 Review Packet: AICOS Query Fixtures gruen.

Ergebnis:

- Suite gruen.
- Worktree-Cleanup bei Fehler ist getestet.
- Maya Memory blockt nicht erlaubte Keys.
- AICOS Query filtert Phasenmarker wie `bp-c3` und bleibt read-only.

## Bekannte Grenzen

- Parallel Executor startet noch keine echten Agents.
- Maya Memory promoted keine Wahrheit und hat keine Embeddings.
- AICOS Auto-query nutzt Keyword-Match, keine Embeddings oder Vektor-Datenbank.
- Keine UI oder visuelle Evidence ist in BP-C3 enthalten.

Diese Grenzen blockieren BP-C4 nicht, muessen dort aber als Input beruecksichtigt werden.

## BP-C4 Entry Gate

BP-C4 darf als naechste Phase vorbereitet werden.

Erlaubte BP-C4-Module:

- DiffLens: Visual Diff, Evidence Diff, Accept/Reject-Vorbereitung.
- Browser Preview: lokale Browser-/Screenshot-Evidence.

Pflicht fuer jeden BP-C4-Task:

- eigener WLP-Contract,
- eigenes Review Packet,
- `council_session_required: true`,
- UI-Tasks mit `target_persona`,
- `screenshot_check`,
- `playwright_flow`,
- `human_ui_review`,
- keine Deploy-/Push-/Merge-Wirkung,
- kein BP-C5-Vorgriff.

## Nicht erlaubt in diesem Checkpoint

- kein BP-C4-Code,
- keine UI,
- keine Screenshots,
- keine Browser-Automation,
- kein Deploy,
- kein Merge,
- kein AICOS-Write.

## Reuse Note

Der naechste sichere Schritt ist BP-C4-Prep oder ein erster kleiner DiffLens-Slice. BP-C4 ist der erste visuelle Block und braucht strengere UI-Evidence als die bisherigen CLI-only Phasen.
