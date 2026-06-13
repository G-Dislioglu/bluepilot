# CLAUDE-CONTEXT - Bluepilot

> Anker-Dokument nach ANKER-REGEL. Vor jeder Session zuerst diese Datei lesen,
> dann `docs/SESSION-LOG.md`, dann `STATE.md`, dann den aktuellen Contract und
> die im Contract genannten Dateien.
>
> Stand: 2026-06-13. Anker aktualisiert durch BPK-001 auf reale BP-149-Wahrheit.

## Was Bluepilot ist

Bluepilot ist ein vorsichtiges, contract-gesteuertes System, das aus einer Bau-
Idee einen begrenzten Builder-Task macht, Evidence erzeugt und Maya/Gurcan zur
Entscheidung vorlegt. Bluepilot ist nicht als unkontrollierter autonomer App-
Builder zu behandeln.

## Aktuelle Arbeitsregel

Der aktuelle Arbeitsanker ist:

- `docs/CODEX-RICHTUNGSBRIEF-optimized.md`

Der BPK-Pfad arbeitet in fester Reihenfolge:

```text
BPK-001 Doc-Drift-Hygiene
BPK-002 Permit-Generalisierung
BPK-003 WorkerPacket-to-WLP-Adapter
Card-Conditioned Dispatch
Pre-Registered Claims
CLI-Deduplizierung / Schema-Generierung
Dispatch / Frontend zuletzt
```

Keine spaeteren Bloecke werden vorgezogen. Gute Ideen ausserhalb des Contracts
werden als `GOAL_DELTA_PROPOSAL` dokumentiert, nicht still eingebaut.

## WLP-Kern

- Kein Task ohne JSON-Contract unter `contracts/`.
- Kein Feature ohne Goal in `.specify/.feature-goals.md`.
- Preflight vor Build, Verify nach Build mit `tools/verify-task-lock.cjs`.
- Kein Commit ohne Review Packet.
- `FORBIDDEN_FILES` ist ein binaeres Gate.
- Scope- oder Goal-Drift wird nicht still umgesetzt.
- Externe KI-Outputs werden kritisch geprueft und gegen echten Repo-Stand
  korrigiert.
- UI-Aenderungen brauchen Sicht-Test-Evidence; reine Build- oder Typechecks
  reichen fuer UI nicht.

## Aktueller Repo-Stand

- Repo-Kandidat: dieses Bluepilot-Repo auf Branch `main` vor BPK-001.
- Aktueller BPK-Arbeitsbranch: `bpk-035-038-route-cache-runtime-file-decisions`.
- Hoechster dokumentierter Contract-/State-Stand: BP-149.
- `docs/CLAUDE-CONTEXT.md` war vor BPK-001 veraltet und beschrieb noch die
  BP-121/BP-125-nahe Welt. Dieser Anker ersetzt diese alte Wahrheit.

## Phasen

- C1 Kernel: gruen.
- C2 Context Broker / Multi-Model-Pool / Council Session Guard: gruen.
- C3 AICOS Auto-Query / Maya Memory v0 / Parallel Executor: gruen.
- C4 Browser-Preview / DiffLens / Human UI Review Gate / Screenshot: technisch
  gruen.
- C5 Integration: laufend; Entry am 2026-05-29 freigegeben.

## Builder- und Runtime-Linie BP-126 bis BP-149

- BP-126: eigenes TypeScript-Subpackage `builder/`, noch ohne migrierte
  Runtime-Module.
- BP-127: erste Builder-Code-Welle, 14 pure-logic Module unter `builder/src/`.
- BP-128: Builder-DB-Fundament mit eigener Env-Var
  `BLUEPILOT_BUILDER_DATABASE_URL`.
- BP-129: Provider-, Gate- und Write-Pfad-Welle, inklusive
  `mayaBuilderGateClient`.
- BP-130: Builder-Spitze migriert: Orchestrator, Pipeline, Architect, Judge,
  RenderBridge, SelfTest, ScopeResolver, ControlPlane und `devLogger`.
- BP-131: dedizierte Neon-DB-Grundlage fuer `bluepilot-builder`.
- BP-132: minimaler Builder-Runtime-Einstieg fuer Render mit `/health` und
  `/health/db`.
- BP-133: Live-Deploy-Anker fuer Render-Service `bluepilot-builder`.
- BP-134: Scrub alter konkreter DB-Ressourcenkennungen.
- BP-135: `/health/maya-gate` als sicherer Maya-Gate-Readiness-Probe.
- BP-137: `POST /probe/dry-run` als externer Phase-A-Startknopf, erzwungen
  trocken und ohne Deploy.
- BP-138: `builder/data/builder-repo-index.json` als Runtime-Artefakt fuer
  Scope-Aufloesung.
- BP-139: `bluepilot-sandbox` Target-Profil und guarded
  `/probe/sandbox-write-check`.
- BP-140: target-aware SmartPush.
- BP-141: guarded Sandbox-Real-Write-Vorbereitung.
- BP-142: Non-default Whole-file Write Adapter.
- BP-143: One-Shot Write Permit Design.
- BP-144: gemeinsame `contentHash`-Kanonisierung fuer Write-Permits.
- BP-145: Permit-Felder bis zum Bluepilot-Byte-Ausgang, finaler UTF-8-Hash und
  create/update Semantik.
- BP-146: enger `POST /probe/sandbox-permit-write` Trigger als Stage-3C-
  Vorbereitung.
- BP-147: erster echter permit-kontrollierter Sandbox-Write: Commit
  `5327082bb0804ff1728ee39b2744fcec79d32906`, Reuse mit `already_consumed`
  blockiert, Schreibfenster wieder geschlossen.
- BP-148: Legacy-Schreibpfade entschaerft. `/probe/sandbox-real-write`
  dauerhaft retired mit HTTP 410; `/probe/sandbox-write-check` default-off
  hinter `BLUEPILOT_SANDBOX_WRITE_CHECK_ENABLED=true`.
- BP-149: alter Permit-Demo-Trigger durch `POST /probe/sandbox-write` ersetzt.
  Der Handler akzeptiert nur `{ path, contentBase64 }` plus optional `op`,
  validiert Pfade, schreibt nur in `G-Dislioglu/bluepilot-sandbox` und
  entscheidet per GitHub-SHA zwischen create/update beziehungsweise delete.
- BPK-002: `POST /probe/sandbox-write` ist wieder an den bestehenden Permit-Korridor
  gebunden. Write-Operationen verlangen `permitId`, bestimmen create/update plus `baseSha`
  aus dem Sandbox-Dateistatus und rufen `smartPush(writePermit)` auf. Delete/Undo wird bis zu
  einem eigenen Permit-Vertrag fail-closed blockiert.
- BPK-003: `builder/src/workerPacketWlpAdapter.ts` erzeugt side-effect-frei WLP-Contract-
  Drafts aus expliziten WorkerPacket/EditEnvelope-Daten. Der Adapter lehnt ungueltige Metadaten,
  doppelte oder unsichere Edit-Pfade und geschuetzte Pfade ab. Keine Runtime-Integration.
- BPK-004: `builder/src/cardConditionedDispatch.ts` erzeugt side-effect-frei Card-
  conditioned Dispatch-Plaene. Explizite Card-Snapshots koennen Dispatch erlauben, auf Review
  herunterstufen oder blockieren; es gibt noch keine Runtime-Integration.
- BPK-005: `builder/src/preRegisteredClaims.ts` prueft Contract-Claims gegen explizite
  Vorregistrierungen mit Evidence. Ein review-pflichtiger oder blockierter Card-Plan wird
  dadurch nicht zu `allow`.
- BPK-006: `builder/scripts/generate-bpk-governance-manifest.mjs` erzeugt ein dedupliziertes
  Command-/Schema-Manifest fuer BPK-003 bis BPK-006. `builder/data/builder-repo-index.json`
  ist wieder generator-normalisiert; `npm test` im Builder ist gruen.
- BPK-007: `builder/src/dispatchFrontendReadiness.ts` fuehrt WLP-Contract-Draft,
  Card-Conditioned-Dispatch-Plan und Pre-Registered-Claims-Gate in eine side-effect-freie
  Readiness-Projektion zusammen. Dispatch bleibt zu, Frontend bleibt nur Projektion.
- BPK-008: `builder/src/runtimeDispatchIntegrationContract.ts` klassifiziert diese Projektion
  fuer spaetere Runtime-Adoption. Dry-run, operator-review und write-faehige Adoption bleiben
  getrennt; es gibt keine Runtime-Route.
- BPK-009: `builder/src/cockpitProjectionAdoptionContract.ts` erzeugt aus Readiness und
  Runtime-Integrationsstatus ein Cockpit-ViewModel. Blockierte und Review-Zustaende bleiben
  sichtbar, aber nicht ausfuehrbar; es gibt noch keine UI-Dateien.
- BPK-010: `builder/src/aicosCardBindingIntake.ts` normalisiert und prueft angelieferte
  AICOS-Card-Snapshots. Ungueltige, doppelte oder evidence-lose Cards werden quarantaenisiert;
  es gibt keinen Live-AICOS-Aufruf.
- BPK-011: `builder/src/bpkBranchMergeReleaseSequencing.ts` plant BPK-Branch-Merge-/Release-
  Reihenfolge, Blocker und Release Notes aus uebergebenen Metadaten. Es gibt keine GitHub-,
  Merge-, PR- oder Deploy-Aktion.
- BPK-012: `builder/src/bpkPrReviewExecution.ts` prueft uebergebene PR-/Review-Metadaten gegen
  eine BPK-Release-Sequenz. Missing PR, Commit-Mismatch, rote Checks und Changes-Requested
  blockieren. Es gibt keinen GitHub-Aufruf und keinen Merge.
- BPK-013: `builder/src/runtimeDryRunAdapterContract.ts` erzeugt aus einem Runtime-
  Integrationsvertrag einen trockenen Invocation-Plan. Deploy, Provider, DB, GitHub, Runtime-
  Route und Runtime-Dispatch bleiben geschlossen.
- BPK-014: `builder/src/cockpitUiImplementationPlan.ts` erzeugt aus dem Cockpit-
  Projection-Vertrag einen UI-Umsetzungsplan mit Screens, deaktivierten Controls und Visual-
  Evidence-Gates. Es gibt noch keine UI-Dateien.
- BPK-015: `builder/src/liveAicosFetchCacheContract.ts` klassifiziert Live-AICOS-Fetch-/Cache-
  Readiness. Endpoint- und Auth-Referenzen, TTL, Stale-Verhalten, Quarantaene und Limits werden
  geprueft. Es gibt keinen Live-Fetch und keinen Cache-Write.
- BPK-016: `builder/src/bpkPrReviewManualReceipts.ts` normalisiert manuell uebergebene PR-/
  Review-Receipts in BPK-012-kompatible Records oder Quarantaene. Es gibt keinen GitHub-
  Connector und keinen Merge.
- BPK-017: `builder/src/runtimeDryRunRouteContract.ts` validiert eine kuenftige Dry-Run-
  Request-Form gegen einen BPK-013-Plan. Es gibt keine gemountete Server-Route und keinen
  Orchestrator-Aufruf.
- BPK-018: `builder/src/cockpitReadOnlyHtml.ts` rendert BPK-009-Cockpit-Projektionen als
  statisches read-only HTML. Alle Actions bleiben disabled; es gibt keine Route und keine
  Runtime-Verdrahtung.
- BPK-019: `builder/src/liveAicosConnectorThroughIntake.ts` routet bereits gelieferte
  AICOS-Payloads nur bei ready BPK-015-Vertrag durch BPK-010-Intake. Es gibt keinen Live-Fetch
  und keinen Cache-Write.
- BPK-020: `builder/src/runtimeDryRunRoute.ts` mountet ueber `server.ts` eine default-off Route
  `/probe/runtime-dry-run`. Sie gibt nur einen BPK-013/BPK-017-Contract-Plan zurueck und ruft
  keinen Orchestrator auf.
- BPK-021: `builder/src/cockpitReadOnlyRoute.ts` mountet ueber `server.ts` eine default-off
  Route `/cockpit/read-only`. Sie rendert statisches Cockpit-HTML aus BPK-018, ohne Runtime-
  oder Live-Datenquelle.
- BPK-022: `builder/src/liveAicosNetworkConnector.ts` fetched Live-AICOS-Card-Payloads nur bei
  ready BPK-015-Vertrag, HTTPS-URL und Auth-Token-Provider und routet sie sofort durch BPK-019.
  Es gibt keine Route, keine Cache-Persistenz, keine DB, keine GitHub-Aktion und keine Cockpit-
  Live-Datenquelle.
- BPK-023: `builder/src/bpkBranchPrConsolidation.ts` kombiniert Branch-Sequencing und manuelle
  PR-Review-Receipts ohne GitHub-Aufruf, PR-Erstellung oder Merge.
- BPK-024: `builder/src/cockpitLiveModelSourceDecision.ts` entscheidet, ob accepted Live-AICOS-
  Daten spaeter als read-only Cockpit-Model-Quelle dienen duerfen. Ohne Operator-Review bleibt
  Live-Sourcing review-pflichtig.
- BPK-025: `builder/src/liveAicosCachePersistenceDecision.ts` entscheidet Cache-Persistenz nur
  als Bereitschaft. Memory-only kann spaeter erlaubt werden; durable Cache bleibt bis zu einem
  separaten Storage-Vertrag blockiert.
- BPK-026: `builder/src/runtimeExecutionDecision.ts` entscheidet Runtime-Ausfuehrungsbereitschaft
  ohne Ausfuehrung. Contract-only bleibt geschlossen, Dry-run-Ausfuehrung braucht Evidence,
  Write-Ausfuehrung bleibt blockiert.
- BPK-027: `builder/src/branchPrReceiptIntakeReport.ts` normalisiert manuelle PR-Receipts und
  erzeugt einen Konsolidierungsreport ohne GitHub-Aufruf, PR-Erstellung oder Merge.
- BPK-028: `builder/src/cockpitLiveModelAdapterPlan.ts` plant ein kuenftiges read-only Cockpit-
  Modell aus accepted Live-AICOS-Cards, ohne Route, Renderer oder Actions zu verdrahten.
- BPK-029: `builder/src/liveAicosMemoryCacheAdapterPlan.ts` plant einen kuenftigen Memory-only-
  Cache mit TTL-/Expiry-Evidence, ohne Speicher zu schreiben.
- BPK-030: `builder/src/runtimeExecutionMountPreflight.ts` prueft eine kuenftige neue Runtime-
  Execution-Route vor, ohne bestehende Routen oder Serverdateien zu aendern.
- BPK-031: `builder/src/prReceiptArtifactImport.ts` importiert uebergebene PR-Receipt-Artefakte
  als Objekt oder JSON-String in den BPK-027-Report. Kein Filesystem-Load und kein GitHub.
- BPK-032: `builder/src/cockpitLiveModelAdapter.ts` materialisiert ready BPK-028-Plaene als
  read-only Cockpit-Modell. Route-Wiring und executable Actions bleiben geschlossen.
- BPK-033: `builder/src/liveAicosMemoryCacheAdapter.ts` erzeugt und liest explizite In-Memory-
  Cache-Eintraege mit Fresh/Stale-Pruefung. Kein Durable Store.
- BPK-034: `builder/src/runtimeExecutionRouteContract.ts` definiert den Request/Response-Vertrag
  fuer eine spaetere Runtime-Execution-Route. Auch Erfolg bleibt `executionAllowed:false`.
- BPK-035: `builder/src/cockpitLiveModelRouteSourceContract.ts` entscheidet, ob ein
  materialisiertes Live-Modell spaeter Quelle fuer `/cockpit/read-only` sein darf. Keine Route-
  Aenderung.
- BPK-036: `builder/src/liveAicosMemoryCacheLifecycleGuard.ts` erzwingt Max-Age, Stale-Policy
  und Invalidation-Ref fuer Memory-Cache-Eintraege. Kein Durable Store.
- BPK-037: `builder/src/runtimeExecutionRouteMountReadiness.ts` bewertet Mount-Readiness aus
  BPK-030 und BPK-034. Kein Mount und weiterhin `executionAllowed:false`.
- BPK-038: `builder/src/prReceiptArtifactFileLoaderDecision.ts` entscheidet kuenftige lokale
  Receipt-Datei-Lesbarkeit anhand sicherer relativer JSON-Pfade, ohne Dateien zu lesen.

## Maya-Anbindung

Stufe 1 - Gedaechtnis:

- Bluepilot ist seit BP-123 als Client des gemeinsamen Block-2-Gedaechtnisses
  in maya-core gebaut.
- BP-124 bereitete die maya-core Memory-Route fuer Server-to-Server-Gate-Auth
  vor.
- Der lokale Bluepilot-Client sendet `x-maya-core-gate-token`, wenn
  `MAYA_CORE_GATE_TOKEN` oder `MAYA_BUILDER_GATE_TOKEN` gesetzt ist.
- Ohne `MAYA_CORE_URL` oder ohne Gate-Token nutzt Bluepilot korrekt den lokalen
  Offline-Fallback.

Harter Live-Fakt aus BPK-001:

- Request:
  `GET https://maya-core.onrender.com/api/maya/memory?origin=bluepilot`
- Ergebnis am 2026-06-13: HTTP 401 mit Body `{"error":"unauthorized"}`.
- Bewertung: `live-auth-required`. Die Route ist live erreichbar und fordert
  Auth. Diese Session hatte keinen Gate-Token in der Umgebung, daher wurde kein
  authentifizierter Bluepilot-Memory-Erfolg behauptet.

Stufe 2 - Persona/Stimme:

- Offen. Voraussetzung ist ein echter Maya-Review-Sprechort in Bluepilot.

Stufe 3 - Ethik + Builder-Schloss:

- Offen. Wenn Bluepilot echte Builds ausfuehrt, sollen sie durch maya-core-Tore
  laufen: Ethics, Budget, Korridor, fail-closed.

## Deploy-Hinweise

- Builder-Render-Service: `https://bluepilot-builder.onrender.com`
- Details: `docs/BUILDER_RENDER_DEPLOY_STATE.md`
- Bluepilot braucht fuer Live-Maya:
  - `MAYA_CORE_URL`
  - `MAYA_CORE_GATE_TOKEN` oder `MAYA_BUILDER_GATE_TOKEN`
- Ohne diese Variablen oder ohne deployten Auth-Pfad bleibt Bluepilot im
  Offline-Fallback.
- Details: `docs/DEPLOY_MAYA_CORE_BINDING.md`

## Naechster Block

Nach BPK-038 ist das Route/Cache/Runtime/File Decision Bundle abgeschlossen, wenn:

- die Review-Packets fuer BPK-035 bis BPK-038 existieren,
- die vier fokussierten Decision-Tests und `npm run typecheck` in `builder/` gruen sind,
- `node tools/verify-task-lock.cjs BPK-035 --verify` bis BPK-038 gruen sind,
- `git diff --check` gruen ist,
- keine Route-Aenderung, kein File-Read, keine GitHub-Aktion, keine Durable Persistenz, keine DB,
  kein Provider, keine Runtime-Ausfuehrung, kein Deploy und keine Package-Aenderung still
  mitgezogen wurde.

Naechste Hauptbloecke:

1. Cockpit Route Source Mount Prep.
2. Live AICOS Memory Cache Read Facade.
3. Runtime Execution Route Mount Contract.
4. PR Receipt File Loader Contract.
