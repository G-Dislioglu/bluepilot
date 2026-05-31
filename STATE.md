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
  - `70894f0` - BP-125 Anker und Leseregel
- Aktueller Arbeitsbranch: `bp-130-builder-orchestrator-tip`.
- Nach Abschluss von BP-126 enthaelt Bluepilot ein separates TypeScript-Subpackage unter
  `builder/`.
- BP-127 migriert die erste echte Builder-Code-Welle: 14 pure-logic Module unter `builder/src/`.
- BP-128 legt das eigene Builder-DB-Fundament an: komplettes Schema, lokales `db.ts`, eigene
  Env-Var `BLUEPILOT_BUILDER_DATABASE_URL`, plus `poolState` und `builderApprovalArtifacts`.
- BP-129 migriert Provider/Gate/Write-Pfad-Module: 9 Module inklusive `mayaBuilderGateClient`,
  ohne Orchestrator/Pipeline/Judge/Architect.
- BP-130 migriert die Builder-Spitze: Orchestrator, Pipeline, Architect, Judge, RenderBridge,
  SelfTest, ScopeResolver, ControlPlane und `devLogger`.

## Phasen

- C1 Kernel: gruen.
- C2 Context Broker / Multi-Model-Pool / Council Session Guard: gruen.
- C3 AICOS Auto-Query / Maya Memory v0 / Parallel Executor: gruen.
- C4 Browser-Preview / DiffLens / Human UI Review Gate / Screenshot: technisch gruen.
- C5 Integration: laeuft; Entry am 2026-05-29 freigegeben.

## Contracts

- Hoechster Contract: BP-130.
- BP-122: erster Bluepilot-Anker (`docs/CLAUDE-CONTEXT.md`).
- BP-123: Bluepilot Maya-Memory an gemeinsamen Block-2-Store angebunden.
- BP-124: maya-core Memory-Route fuer Server-to-Server-Gate-Auth vorbereitet.
- BP-125: Bluepilot-Anker komplettiert und Pflicht-Lesereihenfolge in `AGENTS.md` ergaenzt.
- BP-126: TypeScript-Fundament fuer den Builder-Umzug unter `builder/`, ohne soulmatch-Module
  zu bewegen.
- BP-127: erste Builder-Code-Welle nach Bluepilot; 14 pure-logic Module, bytegleich kopiert,
  ohne Orchestrator, DB, Provider, Netzwerk oder Write-Pfad.
- BP-128: Builder-DB-Fundament; komplettes Schema bytegleich migriert, DB-Zugang mit eigener
  Env-Var vorbereitet, nur die zwei DB-only Module mitgenommen.
- BP-129: Provider-, Gate- und Write-Pfad-Welle; 9 Module inklusive maya-core Gate-Client und
  kanonischem Smart-Push-Pfad, ohne Spitze.
- BP-130: Orchestrator-Tip-Closure; 9 Module, inklusive `devLogger` aus soulmatch `server/src`,
  ohne `builderGithubBridge` oder `builderExecutor`.

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

1. BP-130 reviewen/mergen: Builder-Spitze bestaetigen.
2. Danach BP-131 separat schneiden: erster echter End-to-End-Probelauf im Bluepilot-Builder.
3. Alternativ Bluepilot weiterbauen: echten "Maya Review"-Sprechort fuer die MVP-Kette schaffen.

Nicht beides still zusammenziehen, wenn Auth, Deploy, Live-Builder oder globale Steuerung beruehrt
werden.
