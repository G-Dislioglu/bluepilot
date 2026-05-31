# STATE - Bluepilot

> Momentaufnahme nach `docs/CLAUDE-CONTEXT.md` und `docs/SESSION-LOG.md`.
> Stand: 2026-05-31.

## Branch und Stand

- Repo: `C:\Users\guerc\Documents\Codex\2026-05-29\hi-letzte-letzte-chat-hatte-dauernd\bluepilot`
- Branch: `main`
- Remote-Basis vor BP-124/BP-125: `109ca7a` (`Bind Bluepilot Maya memory to shared store`)
- Lokale Folge-Commits:
  - `cbaed5a` - BP-124 Contract
  - `01e831d` - BP-124 Doku/Review
  - `c0cfce1` - BP-125 Contract
- Nach Abschluss dieses Tasks enthaelt `main` zusaetzlich die BP-125-Anker und Leseregel.

## Phasen

- C1 Kernel: gruen.
- C2 Context Broker / Multi-Model-Pool / Council Session Guard: gruen.
- C3 AICOS Auto-Query / Maya Memory v0 / Parallel Executor: gruen.
- C4 Browser-Preview / DiffLens / Human UI Review Gate / Screenshot: technisch gruen.
- C5 Integration: laeuft; Entry am 2026-05-29 freigegeben.

## Contracts

- Hoechster Contract: BP-125.
- BP-122: erster Bluepilot-Anker (`docs/CLAUDE-CONTEXT.md`).
- BP-123: Bluepilot Maya-Memory an gemeinsamen Block-2-Store angebunden.
- BP-124: maya-core Memory-Route fuer Server-to-Server-Gate-Auth vorbereitet.
- BP-125: Bluepilot-Anker komplettiert und Pflicht-Lesereihenfolge in `AGENTS.md` ergaenzt.

## Maya-Anbindung

- Stufe 1 - Gedaechtnis: fertig in Bluepilot (BP-123), Auth-Pfad in maya-core vorbereitet (BP-124).
- Stufe 2 - Persona/Stimme: offen. Voraussetzung ist ein echter "Maya Review"-Sprechort in
  Bluepilot, damit die kanonische Maya-Identitaet sinnvoll andocken kann.
- Stufe 3 - Ethik + Builder-Schloss: offen. Wenn Bluepilot echte Builds ausfuehrt, sollen sie
  durch maya-core-Tore laufen: Ethics, Budget, Korridor, fail-closed.

## Deploy-Hinweise

- Bluepilot braucht `MAYA_CORE_URL`.
- Bluepilot braucht `MAYA_CORE_GATE_TOKEN` oder `MAYA_BUILDER_GATE_TOKEN`.
- maya-core muss die Gate-Auth fuer `/api/maya/memory` enthalten und deployt haben.
- Ohne diese Variablen oder ohne deployten maya-core-Auth-Pfad arbeitet Bluepilot korrekt, aber
  lokal im Offline-Fallback.
- Details: `docs/DEPLOY_MAYA_CORE_BINDING.md`.

## Naechster sinnvoller Schritt

Nach BP-125 ist das Anker-Projekt abgeschlossen. Danach gibt es zwei saubere Optionen:

1. Bluepilot weiterbauen: echten "Maya Review"-Sprechort fuer die MVP-Kette schaffen.
2. Builder-Umzug nach Bluepilot vorbereiten, aber erst mit eigenem Contract und engem Scope.

Nicht beides still zusammenziehen, wenn Auth, Deploy, Live-Builder oder globale Steuerung beruehrt
werden.
