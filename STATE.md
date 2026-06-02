# STATE - Bluepilot

> Momentaufnahme nach `docs/CLAUDE-CONTEXT.md` und `docs/SESSION-LOG.md`.
> Stand: 2026-06-02.

## Branch und Stand

- Repo: `C:\Users\guerc\Documents\Codex\2026-05-29\hi-letzte-letzte-chat-hatte-dauernd\bluepilot`
- Branch: `main`
- Remote-Basis vor BP-124/BP-125: `109ca7a` (`Bind Bluepilot Maya memory to shared store`)
- Lokale Folge-Commits:
  - `cbaed5a` - BP-124 Contract
  - `01e831d` - BP-124 Doku/Review
  - `c0cfce1` - BP-125 Contract
  - `70894f0` - BP-125 Anker und Leseregel
- Aktueller Arbeitsbranch: `bp-146-permit-live-runbook`.
- Nach Abschluss von BP-126 enthaelt Bluepilot ein separates TypeScript-Subpackage unter
  `builder/`.
- BP-127 migriert die erste echte Builder-Code-Welle: 14 pure-logic Module unter `builder/src/`.
- BP-128 legt das eigene Builder-DB-Fundament an: komplettes Schema, lokales `db.ts`, eigene
  Env-Var `BLUEPILOT_BUILDER_DATABASE_URL`, plus `poolState` und `builderApprovalArtifacts`.
- BP-129 migriert Provider/Gate/Write-Pfad-Module: 9 Module inklusive `mayaBuilderGateClient`,
  ohne Orchestrator/Pipeline/Judge/Architect.
- BP-130 migriert die Builder-Spitze: Orchestrator, Pipeline, Architect, Judge, RenderBridge,
  SelfTest, ScopeResolver, ControlPlane und `devLogger`.
- BP-131 richtet die echte Neon-DB-Grundlage fuer den Bluepilot-Builder ein: bestehendes
  Builder-DB-Projekt, 15 Builder-Tabellen angewendet und verifiziert. Secrets und
  Ressourcenkennungen bleiben ausserhalb der Ankerdateien.
- BP-132 ergaenzt den minimalen Builder-Runtime-Einstieg fuer Render: `npm start` startet einen
  HTTP-Prozess mit `/health` und `/health/db`, ohne Build-Ausfuehrungsroute.
- BP-133 verankert den Live-Deploy: Render-Service `bluepilot-builder`, Public URL, Health- und
  DB-Readiness-Beweise, ohne Secret- oder DB-Ressourcenkennungen.
- BP-134 scrubbt die verbliebenen konkreten DB-Ressourcenkennungen aus den alten BP-131-
  Artefakten im aktuellen Arbeitsbaum. Git-Historie bleibt unveraendert.
- BP-135 ergaenzt `/health/maya-gate` als sicheren Maya-Gate-Readiness-Probe fuer den
  Free-Render-Dienst ohne Shell-Zugriff.
- BP-137 ergaenzt `POST /probe/dry-run` als externen Phase-A-Startknopf fuer die bestehende
  Builder-Orchestrator-Kette, erzwungen trocken und ohne Deploy.
- BP-138 ergaenzt das fehlende Runtime-Artefakt `builder/data/builder-repo-index.json` und einen
  Generator/Normalizer, damit die Phase-A-Scope-Aufloesung nicht mehr am fehlenden Index stoppt.
- BP-139 bereitet Phase B vor, ohne den Maya-Kill-Switch zu oeffnen: ein eigenes
  `bluepilot-sandbox`-Target und ein guarded GitHub-Write-Readiness-Probe fuer
  `G-Dislioglu/bluepilot-sandbox`.
- BP-140 macht den bestehenden SmartPush-Schreibadapter target-aware: `targetProfile.repo`
  wird bis zum direkten GitHub-Patch durchgereicht. Kein Kill-Switch, kein echter Write,
  keine Profil- oder Endpoint-Aenderung.
- BP-141 bereitet den ersten echten Sandbox-Write vor: Sandbox-Profil ist write-enabled, aber
  der neue Trigger `/probe/sandbox-real-write` ist env-, confirm- und repo-guarded und erzwingt
  eine feste Datei in `G-Dislioglu/bluepilot-sandbox`.
- BP-142 beseitigt den finalen Adapter-Blocker fuer diesen Write: Nicht-Default-Overwrites und
  neue Dateien koennen nun ueber die GitHub-Contents-API direkt ins Ziel-Repo geschrieben werden.
- BP-143 dokumentiert das One-Shot-Write-Permit-Design als reinen Doku-Block.
- BP-144 Stufe 1 implementiert die gemeinsame `contentHash`-Kanonisierung fuer Write-Permits
  in Bluepilot und parallel in maya-core. Keine Permit-Registry, kein Korridor- oder
  Schreibpfad wurde in dieser Stufe geaendert.
- BP-145 verdrahtet die Bluepilot-Seite der Permit-Enforcement-Stufe 3B: Permit-Felder werden
  zum Korridor weitergereicht, der finale UTF-8-Content wird direkt am Byte-Ausgang gehasht,
  und GitHub-Whole-File-Writes koennen explizit create-only oder update-only laufen.
- BP-146 bereitet Stufe 3C vor: ein enger `POST /probe/sandbox-permit-write`-Trigger ruft
  `smartPush` direkt mit einem One-Shot-Permit fuer die feste Datei
  `.bluepilot/phase-3c-permit-write.md` im Sandbox-Repo auf. Kein Live-Write wurde in diesem
  Task ausgefuehrt.

## Phasen

- C1 Kernel: gruen.
- C2 Context Broker / Multi-Model-Pool / Council Session Guard: gruen.
- C3 AICOS Auto-Query / Maya Memory v0 / Parallel Executor: gruen.
- C4 Browser-Preview / DiffLens / Human UI Review Gate / Screenshot: technisch gruen.
- C5 Integration: laeuft; Entry am 2026-05-29 freigegeben.

## Contracts

- Hoechster Contract: BP-146.
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
- BP-131: Live-Infra-Fundament; bestehendes Neon-Projekt `bluepilot-builder` mit den 15
  Builder-Tabellen aus `builder/src/schema/builder.ts`, Env-Var-Ziel
  `BLUEPILOT_BUILDER_DATABASE_URL`, ohne Secret- oder Ressourcenkennungen in den Ankern.
- BP-132: Runtime-Health-Einstieg; `builder/src/server.ts` und `builder/src/health.ts` liefern
  Liveness und DB-Readiness fuer Render, ohne Orchestrator, Pipeline, Builder-Executor oder
  Maya-Gate zu importieren.
- BP-133: Live-Deploy-Anker; `docs/BUILDER_RENDER_DEPLOY_STATE.md` haelt Render-URL,
  Build-/Start-Einstellungen und Health-Beweise fest, ohne Secrets.
- BP-134: Scrub der alten BP-131-Artefakte; konkrete Projekt-, Branch-, Endpoint- und alte
  soulmatch-Projektkennung durch Platzhalter ersetzt.
- BP-135: Browser-aufrufbarer Maya-Gate-Probe; Budget, Corridor und Cost werden ueber die
  bestehenden Gate-Client-Funktionen geprueft, ohne Token auszugeben oder Builder-Aktionen zu
  starten.
- BP-137: Phase-A Dry-Run Trigger; `POST /probe/dry-run` ruft `orchestrateTask` mit
  `dryRun:true` und `skipDeploy:true` auf und berichtet Status, Run-ID, Scope-Dateien,
  Phasen und lokale Safety-Entscheidung. Externe Maya-Gate-Reachability bleibt der separate
  BP-135/BP-136-Beweis.
- BP-138: Repo-Index Runtime Artifact; liefert die Zielrepo-Landkarte fuer das aktuelle
  Default-Target `soulmatch` unter `builder/data/builder-repo-index.json`, plus
  Generator/Normalizer und Tests. Korrigiert die Annahme, dass ein Bluepilot-self Index reichen
  wuerde.
- BP-139: Sandbox write readiness; ergaenzt ein write-disabled Target-Profil
  `bluepilot-sandbox` und `POST /probe/sandbox-write-check`, das nach expliziter
  Bestaetigung einen kleinen temporaeren GitHub-Write in `G-Dislioglu/bluepilot-sandbox`
  erstellt und wieder entfernt. Der Maya-Kill-Switch bleibt geschlossen; SmartPush,
  Orchestrator und Default-Target bleiben unveraendert.
- BP-140: Target-aware SmartPush; korrigiert die harte Soulmatch-Verdrahtung im direkten
  Patch-Schreibpfad, indem `targetProfile.repo` aus dem Orchestrator an SmartPush
  durchgereicht wird. Ohne `targetRepo` bleibt der Default `G-Dislioglu/soulmatch`.
  Nicht-target-aware Legacy-Dispatch wird fuer Nicht-Default-Repos fail-safe blockiert.
- BP-141: Guarded sandbox real-write trigger; stellt nur das Sandbox-Profil auf
  `sandbox_real_write`/`pushAllowed:true` und ergaenzt `POST /probe/sandbox-real-write`.
  Der Endpunkt ist geschlossen ohne `BLUEPILOT_SANDBOX_REAL_WRITE_ENABLED=true`, verlangt die
  Confirm-Phrase, prueft den Ziel-Repo-Guard und erzwingt eine feste Datei
  `.bluepilot/phase-b-real-write.md`. Maya-Kill-Switch und Operator-Freigabe bleiben externe
  manuelle Gates.
- BP-142: Non-default whole-file write adapter; ergaenzt `putFileContent` und routet
  Nicht-Default-Overwrite/Create-Jobs ueber einen direkten GitHub-Contents-API-Write. Der
  Default-`soulmatch`-Overwrite-Pfad bleibt auf `/push`.
- BP-143: One-Shot Write Permit Design; beschreibt Permit, atomaren Consume, Content-Bindung,
  Kill-Switch-Rolle und den zweigeteilten Bau in maya-core und Bluepilot als Doku-Task.
- BP-144: Write Permit contentHash Canon Stage 1; fuegt die seiteneffektfreie
  `contentHash`-Kanonisierung und den festen Cross-Repo-Testvektor hinzu. Dies schaltet nichts
  frei und aendert keinen Korridor- oder Schreibpfad.
- BP-145: Write Permit Enforcement Stage 3B; erweitert den Bluepilot-Byte-Ausgang fuer
  Permit-Payloads, finalen UTF-8-Hash und explizite Create/Update-GitHub-Semantik. Kein Live-
  Write, kein Endpoint, keine Runtime-Flag-Aenderung.
- BP-146: Permit-gated Sandbox Write Stage 3C prep; ergaenzt
  `POST /probe/sandbox-permit-write` als festen Sandbox-Write-Trigger fuer genau einen
  `writePermit`-gebundenen Create auf `.bluepilot/phase-3c-permit-write.md`. Kein Live-Write
  wurde waehrend des Tasks ausgefuehrt.

## Maya-Anbindung

- Stufe 1 - Gedaechtnis: fertig in Bluepilot (BP-123), Auth-Pfad in maya-core vorbereitet (BP-124).
- Stufe 2 - Persona/Stimme: offen. Voraussetzung ist ein echter "Maya Review"-Sprechort in
  Bluepilot, damit die kanonische Maya-Identitaet sinnvoll andocken kann.
- Stufe 3 - Ethik + Builder-Schloss: offen. Wenn Bluepilot echte Builds ausfuehrt, sollen sie
  durch maya-core-Tore laufen: Ethics, Budget, Korridor, fail-closed.

## Deploy-Hinweise

- Bluepilot braucht `MAYA_CORE_URL`.
- Bluepilot braucht `MAYA_CORE_GATE_TOKEN` oder `MAYA_BUILDER_GATE_TOKEN`.
- Fuer den migrierten Builder braucht Bluepilot zusaetzlich
  `BLUEPILOT_BUILDER_DATABASE_URL` aus der dedizierten Builder-Datenbank.
- Der spaetere Render-Service fuer den Builder soll `builder/` als Root Directory nutzen:
  Build `npm install && npm run typecheck && npm test`, Start `npm start`.
- Der Builder-Render-Service ist live unter `https://bluepilot-builder.onrender.com`; Details
  stehen in `docs/BUILDER_RENDER_DEPLOY_STATE.md`.
- maya-core muss die Gate-Auth fuer `/api/maya/memory` enthalten und deployt haben.
- Ohne diese Variablen oder ohne deployten maya-core-Auth-Pfad arbeitet Bluepilot korrekt, aber
  lokal im Offline-Fallback.
- Details: `docs/DEPLOY_MAYA_CORE_BINDING.md`.

## Naechster sinnvoller Schritt

Nach BP-125 ist das Anker-Projekt abgeschlossen. Danach gibt es zwei saubere Optionen:

1. BP-146 deployen: Bluepilot stellt den festen Permit-Write-Trigger bereit, bleibt aber ohne
   `BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED=true` geschlossen.
2. Mit maya-core `scripts/issue-write-permit.ts` einen Permit fuer genau die feste Sandbox-Datei
   ausstellen und den Runbook-Write einmal ausloesen.
3. Reuse desselben Permit muss scheitern. Danach Write-Fenster wieder schliessen und das
   Permit-Modell als dauerhafte Freigabe-Schicht weiter verfeinern.

Nicht beides still zusammenziehen, wenn Auth, Deploy, Live-Builder oder globale Steuerung beruehrt
werden.
