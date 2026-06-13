# STATE - Bluepilot

> Momentaufnahme nach `docs/CLAUDE-CONTEXT.md` und `docs/SESSION-LOG.md`.
> Stand: 2026-06-13.

## Branch und Stand

- Repo: `C:\Users\guerc\Documents\Codex\2026-05-29\hi-letzte-letzte-chat-hatte-dauernd\bluepilot`
- Branch: `main`
- Remote-Basis vor BP-124/BP-125: `109ca7a` (`Bind Bluepilot Maya memory to shared store`)
- Lokale Folge-Commits:
  - `cbaed5a` - BP-124 Contract
  - `01e831d` - BP-124 Doku/Review
  - `c0cfce1` - BP-125 Contract
  - `70894f0` - BP-125 Anker und Leseregel
- Aktueller Arbeitsbranch: `bpk-011-branch-merge-release-sequencing`.
- BPK-001 aktualisiert die Bluepilot-Ankerwahrheit: `docs/CLAUDE-CONTEXT.md` ist jetzt auf
  BP-149 ausgerichtet, und `docs/CODEX-RICHTUNGSBRIEF-optimized.md` ist der bereinigte
  Arbeitsanker fuer den BPK-Pfad.
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
- BP-147 haelt den ersten echten permit-kontrollierten Write fest: Permit
  `5b4121c2-d991-4b9b-afc8-d16e28d31aa3` wurde ausgestellt, genau ein Write landete in
  `G-Dislioglu/bluepilot-sandbox` als Commit `5327082bb0804ff1728ee39b2744fcec79d32906`,
  ein zweiter Versuch wurde mit `already_consumed` blockiert, und das Bluepilot-Schreibfenster
  wurde wieder mit HTTP 403 `sandbox_permit_write_disabled` geschlossen.
- BP-148 entschaerft die Legacy-Schreibpfade nach dem Permit-Beweis:
  `/probe/sandbox-real-write` ist dauerhaft retired (HTTP 410), und
  `/probe/sandbox-write-check` ist nur noch mit
  `BLUEPILOT_SANDBOX_WRITE_CHECK_ENABLED=true` erreichbar. Der spaetere direkte Maya-Write soll
  ueber Policy und One-Shot-Permits laufen, nicht ueber Legacy-Bypass-Endpunkte.
- BP-149 ersetzt den alten Permit-Demo-Trigger durch `POST /probe/sandbox-write`.
  Die Env-Wache `BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED=true` bleibt, aber
  Losungswort, Permit-ID und fester Demo-Dateiname sind entfernt. Der Handler
  akzeptiert nur `{ path, contentBase64 }`, validiert den Pfad, schreibt nur in
  `G-Dislioglu/bluepilot-sandbox` und entscheidet per GitHub-SHA zwischen create
  und update.
- BPK-001 prueft den maya-core Memory-Pfad live: `GET
  https://maya-core.onrender.com/api/maya/memory?origin=bluepilot` antwortet HTTP 401
  `{"error":"unauthorized"}`. Bewertung: `live-auth-required`; ohne Gate-Token wird
  kein authentifizierter Bluepilot-Memory-Erfolg behauptet.
- BPK-002 generalisiert den Permit-Pfad auf `POST /probe/sandbox-write`: Write-Operationen
  verlangen `permitId`, leiten nach read-only Sandbox-Dateistatus ueber
  `smartPush(writePermit)` in `G-Dislioglu/bluepilot-sandbox` und blockieren Delete/Undo bis
  zu einem dedizierten Permit-Vertrag.
- BPK-003 ergaenzt einen side-effect-freien WorkerPacket-to-WLP-Adapter. Er erzeugt aus
  expliziten Worker-Edit-Pfaden einen WLP-Contract-Draft, lehnt unsichere oder geschuetzte
  Pfade fail-closed ab und ist nicht in Runtime, Worker-Dispatch oder Push-Pfad integriert.
- BPK-004 ergaenzt einen side-effect-freien Card-Conditioned-Dispatch-Planer. Er bindet
  WLP-Contract-Drafts an explizite Card-Snapshots und entscheidet allow/review_required/blocked,
  ohne AICOS, Runtime, Worker, Provider, Push oder Frontend zu beruehren.
- BPK-005 ergaenzt einen side-effect-freien Pre-Registered-Claims-Gate. Contract-Claims muessen
  vor Dispatch exakt registriert und mit Evidence belegt sein; review/blockierte Card-Plaene
  koennen dadurch nicht auf allow gehoben werden.
- BPK-006 ergaenzt einen deterministischen BPK-Governance-Manifest-Generator. Er dedupliziert
  Required-Commands aus BPK-003 bis BPK-006, haelt Schema-Definitionen fuer die neuen
  Governance-Artefakte fest und normalisiert den bestehenden Builder-Repo-Index wieder gruen.
- BPK-007 ergaenzt eine side-effect-freie Dispatch-/Frontend-Readiness-Projektion. Sie verbindet
  WLP-Contract-Draft, Card-Conditioned-Dispatch-Plan und Pre-Registered-Claims-Gate zu einem
  Statusobjekt fuer spaetere Runtime- und Cockpit-Adoption, ohne Runtime oder UI zu oeffnen.
- BPK-008 ergaenzt einen side-effect-freien Runtime-Dispatch-Integrationsvertrag. Er klassifiziert
  BPK-007-Projektionen als dry-run-faehige Kandidaten, operator-review oder blockiert, ohne eine
  Runtime-Route, Provider, DB, GitHub-Write oder UI zu oeffnen.
- BPK-009 ergaenzt einen side-effect-freien Cockpit-Projection-Adoption-Vertrag. Er wandelt
  Readiness- und Runtime-Integrationsstatus in ein Cockpit-ViewModel fuer spaetere UI-Adoption,
  ohne UI-Dateien, Routen oder Runtime-Aktionen zu bauen.
- BPK-010 ergaenzt einen side-effect-freien AICOS-Card-Intake-Normalizer. Angelieferte Card-
  Snapshots werden validiert, normalisiert, dedupliziert und bei Fehlern quarantaenisiert, ohne
  AICOS live aufzurufen.
- BPK-011 ergaenzt einen side-effect-freien BPK-Branch-Merge-/Release-Sequencing-Planer. Er
  ordnet Branch-Kandidaten, erkennt fehlende Vorgaenger, rote Checks und Review-Bedarf und
  erzeugt Release-Notiz-Abschnitte, ohne Git/GitHub-Aktionen auszufuehren.

## Phasen

- C1 Kernel: gruen.
- C2 Context Broker / Multi-Model-Pool / Council Session Guard: gruen.
- C3 AICOS Auto-Query / Maya Memory v0 / Parallel Executor: gruen.
- C4 Browser-Preview / DiffLens / Human UI Review Gate / Screenshot: technisch gruen.
- C5 Integration: laeuft; Entry am 2026-05-29 freigegeben.

## Contracts

- Hoechster Contract: BP-149. Aktueller BPK-Contract: BPK-011.
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
- BP-147: Live proof documentation; dokumentiert den ersten echten permit-gated Sandbox-Write,
  den Reuse-Block `already_consumed`, den extern verifizierten Sandbox-Commit `5327082...` und
  den wieder geschlossenen Bluepilot-Zustand. Keine Code- oder Runtime-Aenderung.
- BP-148: Legacy write path defuse; `/probe/sandbox-real-write` antwortet dauerhaft 410 und
  kann auch mit altem Flag keinen Write mehr starten. `/probe/sandbox-write-check` bleibt als
  Diagnosewerkzeug erhalten, ist aber default-off hinter
  `BLUEPILOT_SANDBOX_WRITE_CHECK_ENABLED`. Der Permit-/Policy-Pfad bleibt unveraendert.
- BP-149: Freie Maya-Sandbox-Steuerung Teil 1; neuer `POST /probe/sandbox-write`
  akzeptiert nur `{ path, contentBase64 }`, nutzt weiter das Sandbox-Env-Gate und
  schreibt wiederholbar per GitHub Contents API create/update in
  `G-Dislioglu/bluepilot-sandbox`. Haupt-Builder-Korridor und SmartPush bleiben
  unberuehrt.
- BPK-002: Permit generalization; `POST /probe/sandbox-write` ist kein direkter
  GitHub-Contents-Write mehr. Der Endpoint verlangt `permitId`, berechnet create/update plus
  `baseSha` aus dem Sandbox-Dateistatus und ruft den bestehenden `smartPush(writePermit)`-
  Korridor auf. Delete/Undo bleibt fail-closed.
- BPK-003: WorkerPacket-to-WLP adapter; fuegt eine reine Adapterfunktion hinzu, die validierte
  WorkerPacket/EditEnvelope-Daten in einen WLP-Contract-Draft uebertraegt. Keine Orchestrator-,
  Server-, Provider-, Push- oder Verifier-Aenderung.
- BPK-004: Card-conditioned dispatch planning; fuegt eine reine Planungsfunktion hinzu, die
  explizite Card-Snapshots gegen einen WLP-Contract-Draft prueft und Dispatch nur als
  Planentscheidung erlaubt, downgradet oder blockiert. Keine Runtime-Integration.
- BPK-005: Pre-registered claims; fuegt eine reine Claim-Gate-Funktion hinzu, die Contract-
  Claims gegen explizite Registrierungen mit Evidence prueft. Keine Runtime-Integration.
- BPK-006: CLI/schema generation; fuegt einen direkten Node-Generator fuer das
  BPK-Governance-Manifest hinzu und normalisiert das bestehende Repo-Index-Artefakt.
- BPK-007: Dispatch/frontend readiness; fuegt eine reine Projektion hinzu, die die BPK-003 bis
  BPK-005 Gates zu `dispatch_ready`, `frontend_review` oder `blocked` zusammenfuehrt. Keine
  Runtime- oder UI-Integration.
- BPK-008: Runtime dispatch integration contract; fuegt eine reine Klassifizierungsschicht fuer
  spaetere Runtime-Adoption hinzu. Dry-run, operator-review und write-faehige Adoption bleiben
  getrennt.
- BPK-009: Cockpit projection adoption contract; fuegt ein reines Cockpit-ViewModel fuer
  Operator-Inspection hinzu. Blockierte und Review-Zustaende bleiben sichtbar, aber nicht
  ausfuehrbar.
- BPK-010: Live AICOS/Card binding intake; fuegt eine reine Intake-Schicht hinzu, die
  uebergebene AICOS-Card-Snapshots prueft und nur sichere DispatchConditionCard-Daten weitergibt.
- BPK-011: BPK branch merge/release sequencing; fuegt einen reinen Planer fuer Branch-Reihenfolge,
  Blocker und Release Notes hinzu. Keine Merge-, PR-, GitHub- oder Deploy-Aktion.

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

Nach BPK-011 ist die angeforderte Viererfolge abgeschlossen: Runtime Dispatch Integration
Contract, Cockpit Projection Adoption Contract, Live AICOS/Card Binding Intake und Branch
Merge/Release Sequencing liegen als reine Contract-/Planungsschicht vor.

Naechste Hauptbloecke:

1. PR/Review Execution: BPK-008 bis BPK-011 als PRs pruefen und in Reihenfolge mergen.
2. Runtime Dry-Run Adapter: erst nach Merge entscheiden, ob BPK-008 in einen trockenen
   Runtime-Pfad verdrahtet wird.
3. Cockpit UI Implementation: erst nach Contract-Stabilitaet und mit Sicht-Test-Evidence.
4. Live AICOS Fetch/Cache: erst nach Intake-Stabilitaet und mit Auth-/Cache-Vertrag.

Die alten Optionen bleiben historische Richtung, werden aber nicht still mit Runtime Adoption
vermischt:

1. Separat entscheiden, ob `MAYA_BUILDER_WRITE_PERMIT_ENFORCEMENT` zur Dauerregel werden soll.
2. Mayas spaetere direkte Schreibautonomie als Policy-Entscheidung umsetzen: innerhalb enger
   Regeln darf Maya selbst One-Shot-Permits ausstellen, ausserhalb eskaliert sie an den Menschen.
3. Erst danach den Permit-Pfad von der festen Probe-Datei auf echte, begrenzte Builder-Aufgaben
   erweitern.

Nicht beides still zusammenziehen, wenn Auth, Deploy, Live-Builder oder globale Steuerung beruehrt
werden.
