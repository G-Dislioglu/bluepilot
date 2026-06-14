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
- Aktueller Arbeitsbranch: `bpk-095-098-request-packets`.
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
- BPK-012 ergaenzt einen side-effect-freien PR-/Review-Execution-Receipt-Evaluator. Er prueft
  uebergebene PR-Metadaten gegen eine BPK-Release-Sequenz und blockiert fehlende PRs, Commit-
  Mismatches, rote Checks oder Changes-Requested, ohne GitHub-Aktionen auszufuehren.
- BPK-013 ergaenzt einen side-effect-freien Runtime-Dry-Run-Adapter-Vertrag. Er erzeugt aus dem
  Runtime-Integrationsvertrag eine trockene Invocation-Planung mit geschlossenen Provider-, DB-,
  GitHub-, Deploy- und Runtime-Route-Gates.
- BPK-014 ergaenzt einen side-effect-freien Cockpit-UI-Implementation-Planer. Er erzeugt aus dem
  Cockpit-Projection-Vertrag Screens, deaktivierte Controls und Visual-Evidence-Gates, ohne UI-
  Dateien zu erstellen.
- BPK-015 ergaenzt einen side-effect-freien Live-AICOS-Fetch-/Cache-Readiness-Vertrag. Endpoint-
  Referenz, Auth-Referenz, Cache-TTL, Stale-Verhalten, Quarantaene und Fetch-Limits werden
  geprueft, ohne AICOS live aufzurufen oder Cache-Persistenz anzulegen.
- BPK-016 ergaenzt einen side-effect-freien Manual-PR-/Review-Receipt-Normalizer. Operator-
  uebergebene PR-Metadaten werden in BPK-012-kompatible Review-Records ueberfuehrt oder
  quarantaenisiert, ohne GitHub aufzurufen.
- BPK-017 ergaenzt einen side-effect-freien Runtime-Dry-Run-Route-Vertrag. Eine kuenftige
  HTTP-Request-Form wird gegen einen BPK-013-Plan validiert, ohne `server.ts`, Route oder
  Orchestrator zu verdrahten.
- BPK-018 ergaenzt einen read-only Cockpit-HTML-Renderer. BPK-009-Projektionen koennen als
  statisches HTML mit deaktivierten Actions dargestellt werden, ohne Route oder Runtime-
  Verdrahtung.
- BPK-019 ergaenzt einen side-effect-freien Live-AICOS-Connector-through-Intake-Adapter. Ein
  uebergebener AICOS-Payload wird nur bei ready BPK-015-Vertrag akzeptiert und dann durch
  BPK-010-Intake normalisiert.
- BPK-020 mountet eine default-off Runtime-Dry-Run-Contract-Route unter
  `/probe/runtime-dry-run`. Sie gibt nur einen BPK-013/BPK-017-Plan zurueck, ruft keinen
  Orchestrator auf und bleibt ohne `BLUEPILOT_RUNTIME_DRY_RUN_ROUTE_ENABLED=true` geschlossen.
- BPK-021 mountet eine default-off Cockpit-Read-Only-Route unter `/cockpit/read-only`. Sie
  rendert BPK-018-HTML als Sample-Preview oder aus uebergebenem Cockpit-Modell, ohne Runtime-,
  Provider-, DB-, GitHub- oder Live-AICOS-Aktion.
- BPK-022 ergaenzt einen isolierten Live-AICOS-Network-Connector. Er fetched nur bei ready
  BPK-015-Vertrag, HTTPS-URL und Auth-Token-Provider und routet Payloads sofort durch BPK-019,
  ohne Route, Scheduler, Cache-Persistenz, DB, GitHub, Cockpit-Live-Quelle oder Runtime-
  Ausfuehrung.
- BPK-023 ergaenzt eine side-effect-freie Branch/PR-Konsolidierung. Sie kombiniert BPK-011-
  Sequencing mit BPK-012-Review-Receipts, ohne GitHub-Aufruf, PR-Erstellung oder Merge.
- BPK-024 ergaenzt eine side-effect-freie Cockpit-Live-Model-Source-Decision. Live-AICOS-Daten
  duerfen erst nach accepted Network Intake und Operator-Review als kuenftige read-only Cockpit-
  Quelle gelten.
- BPK-025 ergaenzt eine side-effect-freie Live-AICOS-Cache-Persistence-Decision. Memory-only
  kann spaeter bereit sein; durable Cache bleibt bis zu einem separaten Storage-Vertrag blockiert.
- BPK-026 ergaenzt eine side-effect-freie Runtime-Execution-Decision. Contract-only bleibt
  geschlossen, Dry-run-Ausfuehrung braucht explizite Evidence, Write-Ausfuehrung bleibt blockiert.
- BPK-027 ergaenzt einen side-effect-freien Branch/PR-Receipt-Intake-Report. Manuelle PR-
  Receipts werden normalisiert und gegen BPK-023 ausgewertet, ohne GitHub-Aufruf, PR-Erstellung
  oder Merge.
- BPK-028 ergaenzt einen side-effect-freien Cockpit-Live-Model-Adapter-Plan. Accepted Live-
  AICOS-Cards koennen als kuenftiges read-only Cockpit-Panel geplant werden, ohne Route oder
  Renderer zu aendern.
- BPK-029 ergaenzt einen side-effect-freien Live-AICOS-Memory-Cache-Adapter-Plan. TTL und
  Expiry werden berechnet, aber es wird nichts persistiert.
- BPK-030 ergaenzt einen side-effect-freien Runtime-Execution-Mount-Preflight. Eine spaetere
  neue Runtime-Execution-Route wird vorgeprueft, ohne bestehende Routen zu mutieren.
- BPK-031 ergaenzt einen side-effect-freien PR-Receipt-Artifact-Import. Uebergebene Objekte oder
  JSON-Strings werden in den BPK-027-Report ueberfuehrt, ohne Filesystem-Load oder GitHub.
- BPK-032 ergaenzt einen side-effect-freien Cockpit-Live-Model-Adapter. Ready Plaene werden als
  read-only Cockpit-Modell materialisiert, ohne Route-Wiring.
- BPK-033 ergaenzt einen In-Memory-Live-AICOS-Cache-Adapter. Eintraege sind explizite Objekte mit
  Fresh/Stale-Pruefung, ohne Durable Store.
- BPK-034 ergaenzt einen Runtime-Execution-Route-Contract. Request/Response wird validiert, aber
  auch ein Erfolg erlaubt keine Execution.
- BPK-035 ergaenzt einen Cockpit-Live-Model-Route-Source-Contract. Ein materialisiertes Modell
  kann als kuenftige Quelle fuer `/cockpit/read-only` klassifiziert werden, ohne Route-Aenderung.
- BPK-036 ergaenzt einen Live-AICOS-Memory-Cache-Lifecycle-Guard. Max-Age, Stale-Policy und
  Invalidation-Ref werden geprueft, ohne Persistenz.
- BPK-037 ergaenzt Runtime-Execution-Route-Mount-Readiness. BPK-030 und BPK-034 werden
  zusammengefuehrt, ohne Mount und ohne Execution.
- BPK-038 ergaenzt eine PR-Receipt-Artifact-File-Loader-Decision. Sichere lokale JSON-Pfade
  koennen bewertet werden, ohne Dateien zu lesen.
- BPK-039 ergaenzt Cockpit-Route-Source-Mount-Prep. Eine kuenftige Source-Selector-
  Verdrahtung fuer `/cockpit/read-only` wird vorbereitet, ohne Route oder Server zu aendern.
- BPK-040 ergaenzt eine Live-AICOS-Memory-Cache-Read-Facade. Fresh Read und Lifecycle-Guard
  werden gebuendelt, ohne Persistenz.
- BPK-041 ergaenzt einen Runtime-Execution-Route-Mount-Contract. Mount-Form wird beschrieben,
  aber Servermutation und Execution bleiben aus.
- BPK-042 ergaenzt einen PR-Receipt-File-Loader-Contract. Request/Response wird beschrieben,
  aber auch Erfolg liest keine Datei.
- BPK-043 ergaenzt einen Cockpit-Route-Source-Handler-Skeleton. Er waehlt zwischen Sample- und
  geliefertem Live-Cockpit-Modell nach ready BPK-039-Prep, ohne Route oder Renderer zu aendern.
- BPK-044 ergaenzt eine Live-AICOS-Memory-Cache-Store-Shell. Explizite Entries koennen
  in-process gehalten, gelesen und invalidiert werden; durable Persistenz bleibt geschlossen.
- BPK-045 ergaenzt einen Runtime-Execution-Route-Handler-Skeleton. Er validiert gegen BPK-034
  und BPK-041, ohne zu mounten, zu orchestrieren oder auszufuehren.
- BPK-046 ergaenzt eine lokale PR-Receipt-File-Loader-Implementation. Sie liest nur unter
  BPK-038/BPK-042-, Root-, Path- und Max-Byte-Guard und importiert ueber BPK-031; GitHub/PR/Merge
  bleiben geschlossen.
- BPK-047 ergaenzt Cockpit-Handler-Mount-Readiness. Ready Handler Output, Default-off-Env-Gate
  und Route-Module-Ref werden geprueft, ohne Server, Route oder Renderer zu aendern.
- BPK-048 ergaenzt Memory-Cache-Facade-Store-Binding. Die in-process Store-Shell speist die
  Read-Facade unter Lifecycle-Checks; Durable Store bleibt geschlossen.
- BPK-049 ergaenzt Runtime-Handler-Mount-Readiness. Ready Handler Output und Mount-Contract
  werden geprueft, ohne Mount, Orchestrator oder Execution.
- BPK-050 ergaenzt einen PR-Receipt-Loader-Operator-Runbook-Contract. Loader-Evidence,
  Operator-Freigabe, Root-Policy und Evidence-Refs werden beschrieben, ohne File-Read oder
  externe Aktion.
- BPK-051 ergaenzt einen Cockpit-Default-off-Mount-Contract. Die kuenftige Mount-Form wird
  beschrieben, ohne `server.ts`, Route oder Renderer zu aendern.
- BPK-052 ergaenzt einen Memory-Cache-Operator-Invalidation-Contract. Invalidation braucht
  Confirm, Operator-Freigabe und Reason-Ref und betrifft nur den in-process Store.
- BPK-053 ergaenzt einen Runtime-Default-off-Mount-Contract. Die kuenftige Mount-Form wird
  beschrieben, Execution bleibt geschlossen.
- BPK-054 ergaenzt ein PR-Receipt-Loader-Evidence-Pack. Loader- und Runbook-Evidence werden
  review-only gebuendelt; Merge und externe Aktionen bleiben false.
- BPK-055 ergaenzt einen Cockpit-Mount-Implementation-Plan. Geplante Server-/Route-Dateien und
  Gates werden beschrieben, aber nicht geaendert.
- BPK-056 ergaenzt Memory-Cache-Invalidation-Evidence-Binding. Invalidation-Evidence wird an
  die bestehende Store/Facade-Bindung geknuepft.
- BPK-057 ergaenzt einen Runtime-Mount-Implementation-Plan. Geplante Server-/Route-Dateien und
  Gates werden beschrieben, Execution bleibt nicht ausgefuehrt.
- BPK-058 ergaenzt ein PR-Receipt-Evidence-Promotion-Gate. Evidence darf in Release-Governance
  promoted werden, Merge und externe Aktionen bleiben false.
- BPK-059 ergaenzt Cockpit-Mount-Patch-Preflight. Geplante Dateien, Route, Env-Gate und Reviewer
  werden geprueft, ohne Dateien zu aendern.
- BPK-060 ergaenzt einen Memory-Cache-Invalidation-Audit-Trail. Evidence-Binding wird als
  auditierbarer Trail abgebildet, ohne Durable Store.
- BPK-061 ergaenzt Runtime-Mount-Patch-Preflight. Geplante Dateien, Route, Env-Gate und
  Execution-Closed-Gate werden geprueft, ohne Dateien zu aendern.
- BPK-062 ergaenzt eine PR-Receipt-Governance-Release-Decision. Promotion wird fuer Release-
  Governance bewertet, Merge und externe Aktionen bleiben false.

## Phasen

- C1 Kernel: gruen.
- C2 Context Broker / Multi-Model-Pool / Council Session Guard: gruen.
- C3 AICOS Auto-Query / Maya Memory v0 / Parallel Executor: gruen.
- C4 Browser-Preview / DiffLens / Human UI Review Gate / Screenshot: technisch gruen.
- C5 Integration: laeuft; Entry am 2026-05-29 freigegeben.

## Contracts

- Hoechster Contract: BP-149. Aktueller BPK-Contract: BPK-062.
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
- BPK-012: PR/review execution contract; fuegt eine reine Receipt-Schicht fuer uebergebene PR-
  und Review-Metadaten hinzu. Keine PR-Erstellung, kein Merge, kein GitHub-API-Aufruf.
- BPK-013: Runtime dry-run adapter contract; fuegt eine reine Adapter-Planung fuer trockene
  Runtime-Invocation hinzu. Keine Route, kein Orchestrator-Aufruf, kein Provider, kein Write.
- BPK-014: Cockpit UI implementation plan; fuegt eine reine Planungsfunktion fuer Screens,
  Controls und Visual-Evidence-Gates hinzu. Keine UI-Dateien.
- BPK-015: Live AICOS fetch/cache contract; fuegt eine reine Readiness-Klassifizierung fuer
  Endpoint/Auth/Cache/Quarantaene hinzu. Kein Live-Fetch, kein Cache-Write.
- BPK-016: PR review manual receipts; fuegt eine reine Normalisierungsschicht fuer manuell
  uebergebene PR-/Review-Receipts hinzu. Kein GitHub-Connector, kein Merge.
- BPK-017: Runtime dry-run route contract; fuegt eine reine HTTP-aehnliche Request/Response-
  Contract-Schicht hinzu. Keine gemountete Route, kein Runtime-Call.
- BPK-018: Cockpit read-only UI; fuegt einen reinen statischen HTML-Renderer fuer Cockpit-
  Projection-Modelle hinzu. Keine Route, keine Runtime, alle Actions disabled.
- BPK-019: Live AICOS connector through intake; fuegt einen reinen Adapter fuer bereits
  uebergebene AICOS-Payloads hinzu. Kein Fetch, kein Cache-Write, Intake bleibt Pflicht.
- BPK-020: Runtime route mounting dry run; mountet eine default-off Route, die nur den
  Contract-Plan zurueckgibt. Kein Orchestrator, kein Provider, kein Write.
- BPK-021: Cockpit route mounting read-only; mountet eine default-off Route fuer statisches
  Cockpit HTML. Keine ausfuehrbaren Actions, keine Live-Datenquelle.
- BPK-022: Live AICOS network connector; fetched Card-Payloads nur ueber explizite HTTPS-URL
  und Auth-Token-Provider bei ready Fetch-/Cache-Vertrag und leitet danach durch Intake. Keine
  Route, keine Persistenz, keine Cockpit- oder Runtime-Verdrahtung.
- BPK-023: Branch/PR consolidation; kombiniert Sequencing und manuelle Review-Receipts. Keine
  GitHub-Aktion, keine PR-Erstellung, kein Merge.
- BPK-024: Cockpit live model source decision; entscheidet read-only Live-Quelle nur nach
  accepted Network Intake und Operator-Review. Keine Cockpit-Verdrahtung.
- BPK-025: Live AICOS cache persistence decision; erlaubt nur kuenftige Memory-only-Bereitschaft.
  Durable Cache bleibt blockiert. Keine Persistenz.
- BPK-026: Runtime execution decision; Dry-run-Ausfuehrung nur als spaetere Option mit Evidence,
  Write-Ausfuehrung blockiert. Keine Runtime-Verdrahtung.
- BPK-027: Branch/PR receipt intake report; normalisiert manuelle PR-Receipts und erzeugt
  Coverage-/Merge-Readiness-Report. Keine GitHub-Aktion.
- BPK-028: Cockpit live model adapter plan; plant read-only Live-AICOS-Panel im Cockpit-Modell.
  Keine Route, kein Renderer-Wiring.
- BPK-029: Live AICOS memory cache adapter plan; plant Memory-only Cache mit TTL-Evidence. Keine
  Persistenz.
- BPK-030: Runtime execution mount preflight; prueft neue Route/Env-Gate/Runbook fuer spaeteren
  Mount. Keine Route-Aenderung.
- BPK-031: PR receipt artifact import; importiert supplied object/JSON in BPK-027. Kein
  Filesystem-Load, kein GitHub.
- BPK-032: Cockpit live model adapter; materialisiert read-only Cockpit-Modell. Kein Route-
  Wiring.
- BPK-033: Live AICOS memory cache adapter; explizite In-Memory-Eintraege mit Fresh/Stale-
  Pruefung. Kein Durable Store.
- BPK-034: Runtime execution route contract; validiert kuenftigen Request/Response, aber
  `executionAllowed:false`.
- BPK-035: Cockpit live model route source contract; entscheidet kuenftige Quelle fuer
  `/cockpit/read-only`. Keine Route-Aenderung.
- BPK-036: Live AICOS memory cache lifecycle guard; prueft Max-Age/Stale/Invalidation. Keine
  Persistenz.
- BPK-037: Runtime execution route mount readiness; kombiniert Preflight und Contract. Kein
  Mount.
- BPK-038: PR receipt artifact file loader decision; bewertet sichere Pfade. Kein File-Read.
- BPK-039: Cockpit route source mount prep; bereitet default-off Source-Selector vor. Kein
  Mount.
- BPK-040: Live AICOS memory cache read facade; read-only Fassade ueber fresh Memory Entry. Kein
  Store.
- BPK-041: Runtime execution route mount contract; Mount-Contract ohne Servermutation.
- BPK-042: PR receipt file loader contract; Request/Response ohne File-Read.
- BPK-043: Cockpit route source handler skeleton; Sample/Live-Modell-Auswahl ohne Route- oder
  Renderer-Aenderung.
- BPK-044: Live AICOS memory cache store shell; in-process Store/Read/Invalidate ohne Durable
  Store.
- BPK-045: Runtime execution route handler skeleton; Contract-Validierung ohne Mount und ohne
  Execution.
- BPK-046: PR receipt file loader implementation; lokaler JSON-Read unter engen Guards, Import
  ueber BPK-031, keine GitHub-Aktion.
- BPK-047: Cockpit handler mount readiness; default-off Mount-Bereitschaft ohne Server- oder
  Route-Aenderung.
- BPK-048: Memory cache facade store binding; Store-Shell und Read-Facade gebunden ohne Durable
  Store.
- BPK-049: Runtime handler mount readiness; default-off Mount-Bereitschaft ohne Execution.
- BPK-050: PR receipt loader operator runbook; Operator-Prozess als Contract ohne File-Read oder
  externe Aktion.
- BPK-051: Cockpit default-off mount contract; Mount-Form ohne Server-Aenderung.
- BPK-052: Memory cache operator invalidation contract; operator-gated in-process Invalidation.
- BPK-053: Runtime default-off mount contract; Mount-Form ohne Execution.
- BPK-054: PR receipt loader evidence pack; review-only Evidence ohne Merge.
- BPK-055: Cockpit mount implementation plan; geplante Dateien/Gates ohne Umsetzung.
- BPK-056: Memory cache invalidation evidence binding; Invalidation-Evidence an Binding
  geknuepft.
- BPK-057: Runtime mount implementation plan; geplante Dateien/Gates ohne Execution.
- BPK-058: PR receipt evidence promotion gate; Release-Governance-Promotion ohne Merge.
- BPK-059: Cockpit mount patch preflight; Patch-Vorpruefung ohne Datei-Aenderung.
- BPK-060: Memory cache invalidation audit trail; auditierbarer Trail ohne Durable Store.
- BPK-061: Runtime mount patch preflight; Patch-Vorpruefung ohne Execution.
- BPK-062: PR receipt governance release decision; Release-Governance-Entscheidung ohne Merge.
- BPK-063: Cockpit server patch candidate; konkrete Patch-Kandidaten-Daten ohne Anwendung.
- BPK-064: Memory cache audit export contract; Export-Manifest ohne Datei-Write oder Durable Store.
- BPK-065: Runtime server patch candidate; konkrete Patch-Kandidaten-Daten ohne Anwendung oder
  Execution.
- BPK-066: Release governance handoff packet; Operator-Handoff ohne Merge oder externe Aktion.
- BPK-067: Cockpit server patch application readiness; Anwendungsvorbereitung ohne Patch-Apply.
- BPK-068: Memory cache audit export evidence pack; Export-Evidence ohne Datei-Write.
- BPK-069: Runtime server patch application readiness; Anwendungsvorbereitung ohne Execution.
- BPK-070: Release governance operator approval gate; Approval-Schwelle ohne Merge oder externe
  Aktion.
- BPK-071: Cockpit server patch operator dry run; Anwendungssimulation ohne Patch-Apply.
- BPK-072: Memory cache audit export render dry run; Preview ohne Datei-Write.
- BPK-073: Runtime server patch operator dry run; Anwendungssimulation ohne Execution.
- BPK-074: Release governance operator action runbook; Operator-Anleitung ohne Merge oder
  externe Aktion.
- BPK-075: Cockpit patch operator dry run evidence; Simulationsevidence ohne Patch-Apply.
- BPK-076: Memory cache audit export preview evidence; Preview-Evidence ohne Datei-Write.
- BPK-077: Runtime patch operator dry run evidence; Simulationsevidence ohne Execution.
- BPK-078: Release governance runbook evidence; Runbook-Evidence ohne Merge oder externe Aktion.
- BPK-079: Cockpit patch operator decision gate; Entscheidung ohne Patch-Apply.
- BPK-080: Memory cache audit export decision gate; Entscheidung ohne Datei-Write.
- BPK-081: Runtime patch operator decision gate; Entscheidung ohne Execution.
- BPK-082: Release governance final decision gate; finale Entscheidung ohne Merge oder externe
  Aktion.
- BPK-083: Cockpit patch approved action permit prep; Permit-Vorbereitung ohne Permit-Ausstellung
  oder Patch-Apply.
- BPK-084: Memory cache audit export approved action permit prep; Permit-Vorbereitung ohne
  Datei-Write.
- BPK-085: Runtime patch approved action permit prep; Permit-Vorbereitung ohne Execution.
- BPK-086: Release governance approved action handoff prep; Handoff-Vorbereitung ohne Merge oder
  externe Aktion.
- BPK-087: Cockpit patch permit prep evidence; Permit-Prep-Evidence ohne Permit-Ausstellung oder
  Patch-Apply.
- BPK-088: Memory cache audit export permit prep evidence; Export-Permit-Prep-Evidence ohne
  Datei-Write.
- BPK-089: Runtime patch permit prep evidence; Runtime-Permit-Prep-Evidence ohne Execution.
- BPK-090: Release governance handoff prep evidence; Handoff-Prep-Evidence ohne Merge oder
  externe Aktion.
- BPK-091: Cockpit patch permit issuance readiness; Permit-Issuance nur als Readiness, ohne
  Permit-Ausstellung oder Patch-Apply.
- BPK-092: Memory cache audit export permit issuance readiness; Export-Permit-Issuance nur als
  Readiness, ohne Datei-Write.
- BPK-093: Runtime patch permit issuance readiness; Runtime-Permit-Issuance nur als Readiness,
  ohne Execution.
- BPK-094: Release governance approved action readiness; Approved-Action nur als Readiness, ohne
  Merge oder externe Aktion.
- BPK-095: Cockpit patch permit issuance request packet; Issuance-Anfrage ohne Permit-
  Ausstellung oder Patch-Apply.
- BPK-096: Memory cache audit export permit issuance request packet; Export-Issuance-Anfrage
  ohne Datei-Write.
- BPK-097: Runtime patch permit issuance request packet; Runtime-Issuance-Anfrage ohne
  Execution.
- BPK-098: Release governance approved action request packet; Release-Action-Anfrage ohne Merge
  oder externe Aktion.

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

Nach BPK-098 ist das gebuendelte Issuance-/Approved-Action-Request-Packet Bundle abgeschlossen:
Readiness-Artefakte werden in Request-Packets fuer spaetere Authority-Review uebersetzt; externe
Side Effects bleiben geschlossen.

Naechste Hauptbloecke:

1. Cockpit Patch Authority Review Intake: Request-Packet fuer Review annehmen, ohne Issuance.
2. Memory Cache Audit Export Authority Review Intake: Export-Request fuer Review annehmen, ohne
   Datei-Write.
3. Runtime Patch Authority Review Intake: Runtime-Request fuer Review annehmen, ohne Execution.
4. Release Governance Authority Review Intake: Release-Action-Request fuer Review annehmen, ohne
   Merge oder externe Aktion.

Die alten Optionen bleiben historische Richtung, werden aber nicht still mit Runtime Adoption
vermischt:

1. Separat entscheiden, ob `MAYA_BUILDER_WRITE_PERMIT_ENFORCEMENT` zur Dauerregel werden soll.
2. Mayas spaetere direkte Schreibautonomie als Policy-Entscheidung umsetzen: innerhalb enger
   Regeln darf Maya selbst One-Shot-Permits ausstellen, ausserhalb eskaliert sie an den Menschen.
3. Erst danach den Permit-Pfad von der festen Probe-Datei auf echte, begrenzte Builder-Aufgaben
   erweitern.

Nicht beides still zusammenziehen, wenn Auth, Deploy, Live-Builder oder globale Steuerung beruehrt
werden.
