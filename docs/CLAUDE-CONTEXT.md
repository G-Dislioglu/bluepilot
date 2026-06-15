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
- Aktueller BPK-Arbeitsbranch: `bpk-183-186-consume-execution-receipt-record-audit-receipt-record-preflight`.
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
- BPK-039: `builder/src/cockpitRouteSourceMountPrep.ts` bereitet eine kuenftige Cockpit-
  Source-Mount-Integration vor, ohne Route oder Server zu aendern.
- BPK-040: `builder/src/liveAicosMemoryCacheReadFacade.ts` buendelt Memory-Cache-Read und
  Lifecycle-Guard als read-only Fassade. Kein Durable Store.
- BPK-041: `builder/src/runtimeExecutionRouteMountContract.ts` definiert einen Mount-Contract
  fuer eine spaetere Runtime-Execution-Route. Keine Servermutation und keine Execution.
- BPK-042: `builder/src/prReceiptFileLoaderContract.ts` definiert einen Request/Response-
  Contract fuer spaeteres PR-Receipt-File-Loading. Auch Erfolg liest keine Datei.
- BPK-043: `builder/src/cockpitRouteSourceHandlerSkeleton.ts` waehlt zwischen Sample- und
  geliefertem Live-Cockpit-Modell nach ready BPK-039-Prep. Keine Route, keine Renderer-Aenderung,
  Actions bleiben disabled.
- BPK-044: `builder/src/liveAicosMemoryCacheStoreShell.ts` ergaenzt eine in-process Store-Shell
  fuer explizite Live-AICOS-Memory-Entries. Reads nutzen die bestehende Fresh/Stale/Missing-
  Semantik; durable Persistenz bleibt geschlossen.
- BPK-045: `builder/src/runtimeExecutionRouteHandlerSkeleton.ts` validiert Runtime-Execution-
  Requests gegen BPK-034/BPK-041. Keine Route-Mounts, kein Orchestrator und weiterhin
  `executionAllowed:false`.
- BPK-046: `builder/src/prReceiptFileLoaderImplementation.ts` liest lokale PR-Receipt-JSON-
  Dateien nur unter BPK-038/BPK-042-, Root-, Path- und Max-Byte-Guard und importiert sie ueber
  BPK-031. Kein GitHub, keine PR-Erstellung, kein Merge.
- BPK-047: `builder/src/cockpitHandlerMountReadiness.ts` bewertet, ob der BPK-043-Cockpit-
  Handler default-off mount-ready ist. Keine Server-, Route- oder Renderer-Aenderung.
- BPK-048: `builder/src/memoryCacheFacadeStoreBinding.ts` bindet die BPK-044-Store-Shell an die
  BPK-040-Read-Facade ueber Lifecycle-Checks. Kein Durable Store.
- BPK-049: `builder/src/runtimeHandlerMountReadiness.ts` bewertet, ob der BPK-045-Runtime-
  Handler default-off mount-ready ist. Keine Route, kein Orchestrator und keine Execution.
- BPK-050: `builder/src/prReceiptLoaderOperatorRunbook.ts` erzeugt einen Operator-Runbook-
  Contract fuer BPK-046-Loader-Evidence. Keine File-Reads, GitHub-Aktionen, PRs oder Merges.
- BPK-051: `builder/src/cockpitDefaultOffMountContract.ts` beschreibt den kuenftigen Cockpit-
  Handler-Mount als default-off Contract. Keine Server- oder Route-Aenderung.
- BPK-052: `builder/src/memoryCacheOperatorInvalidationContract.ts` invalidiert Memory-Cache-
  Entries nur operator-gated und in-process. Kein Durable Store, kein Scheduler.
- BPK-053: `builder/src/runtimeDefaultOffMountContract.ts` beschreibt den kuenftigen Runtime-
  Handler-Mount als default-off Contract. Keine Route, kein Orchestrator und keine Execution.
- BPK-054: `builder/src/prReceiptLoaderEvidencePack.ts` buendelt Loader-/Runbook-Evidence
  review-only. Kein File-Read, kein GitHub, kein PR, kein Merge.
- BPK-055: `builder/src/cockpitMountImplementationPlan.ts` plant den kuenftigen Cockpit-Mount
  aus BPK-051. Keine Server- oder Route-Datei wird geaendert.
- BPK-056: `builder/src/memoryCacheInvalidationEvidenceBinding.ts` bindet BPK-052-
  Invalidation-Evidence an die BPK-048 Store/Facade-Bindung. Kein Durable Store.
- BPK-057: `builder/src/runtimeMountImplementationPlan.ts` plant den kuenftigen Runtime-Mount
  aus BPK-053. Keine Route, kein Orchestrator und keine Execution.
- BPK-058: `builder/src/prReceiptEvidencePromotionGate.ts` gated BPK-054 Evidence-Promotion in
  Release-Governance. Kein Merge und keine externe Aktion.
- BPK-059: `builder/src/cockpitMountPatchPreflight.ts` prueft geplante Cockpit-Mount-Patches
  gegen Plan, Route, Env-Gate und geplante Dateien. Keine Datei wird geaendert.
- BPK-060: `builder/src/memoryCacheInvalidationAuditTrail.ts` erzeugt einen auditierbaren Trail
  aus BPK-056-Invalidation-Evidence. Kein Durable Store.
- BPK-061: `builder/src/runtimeMountPatchPreflight.ts` prueft geplante Runtime-Mount-Patches
  gegen Plan, Route, Env-Gate und Execution-Closed-Gate. Keine Route und keine Execution.
- BPK-062: `builder/src/prReceiptGovernanceReleaseDecision.ts` bewertet PR-Receipt-Promotion
  fuer Release-Governance. Kein Merge und keine externe Aktion.
- BPK-063: `builder/src/cockpitServerPatchCandidate.ts` erzeugt Cockpit-Server-Patch-
  Kandidaten aus BPK-059-Preflight. Patch-Anwendung, Servermutation und Route-Mutation bleiben
  geschlossen.
- BPK-064: `builder/src/memoryCacheAuditExportContract.ts` beschreibt Memory-Cache-Audit-Export
  aus BPK-060-Audit-Trail. Datei-Write, Durable Store und externe Aktionen bleiben geschlossen.
- BPK-065: `builder/src/runtimeServerPatchCandidate.ts` erzeugt Runtime-Server-Patch-Kandidaten
  aus BPK-061-Preflight. Patch-Anwendung, Servermutation, Route-Mutation und Execution bleiben
  geschlossen.
- BPK-066: `builder/src/releaseGovernanceHandoffPacket.ts` buendelt BPK-062-
  Release-Governance-Entscheidungen fuer Operator-Handoff. Merge und externe Aktionen bleiben
  geschlossen.
- BPK-067: `builder/src/cockpitServerPatchApplicationReadiness.ts` bewertet Cockpit-
  Patch-Kandidaten fuer spaetere Anwendung. Patch-Anwendung, Servermutation, Route-Mutation und
  Executable Actions bleiben geschlossen.
- BPK-068: `builder/src/memoryCacheAuditExportEvidencePack.ts` buendelt Memory-Cache-
  Audit-Export-Contracts als Evidence-Pack. Datei-Write, Durable Store und externe Aktionen
  bleiben geschlossen.
- BPK-069: `builder/src/runtimeServerPatchApplicationReadiness.ts` bewertet Runtime-
  Patch-Kandidaten fuer spaetere Anwendung. Patch-Anwendung, Servermutation, Route-Mutation,
  Execution und Execution-Allowance bleiben geschlossen.
- BPK-070: `builder/src/releaseGovernanceOperatorApprovalGate.ts` legt Release-Governance-
  Handoffs hinter ein explizites Operator-Approval-Gate. Merge und externe Aktionen bleiben
  geschlossen.
- BPK-071: `builder/src/cockpitServerPatchOperatorDryRun.ts` simuliert Cockpit-
  Patch-Anwendung als Operator-Dry-Run. Patch-Anwendung, Servermutation, Route-Mutation und
  Executable Actions bleiben geschlossen.
- BPK-072: `builder/src/memoryCacheAuditExportRenderDryRun.ts` rendert Memory-Cache-
  Audit-Export-Evidence als Preview. Datei-Write, Durable Store und externe Aktionen bleiben
  geschlossen.
- BPK-073: `builder/src/runtimeServerPatchOperatorDryRun.ts` simuliert Runtime-
  Patch-Anwendung als Operator-Dry-Run. Patch-Anwendung, Servermutation, Route-Mutation,
  Execution und Execution-Allowance bleiben geschlossen.
- BPK-074: `builder/src/releaseGovernanceOperatorActionRunbook.ts` beschreibt
  Release-Governance-Operator-Aktionen als Runbook. Merge und externe Aktionen bleiben
  geschlossen.
- BPK-075: `builder/src/cockpitPatchOperatorDryRunEvidence.ts` buendelt Cockpit-
  Operator-Dry-Run-Evidence. Patch-Anwendung, Servermutation, Route-Mutation und Executable
  Actions bleiben geschlossen.
- BPK-076: `builder/src/memoryCacheAuditExportPreviewEvidence.ts` buendelt Memory-Cache-
  Audit-Export-Preview-Evidence. Datei-Write, Durable Store und externe Aktionen bleiben
  geschlossen.
- BPK-077: `builder/src/runtimePatchOperatorDryRunEvidence.ts` buendelt Runtime-
  Operator-Dry-Run-Evidence. Patch-Anwendung, Servermutation, Route-Mutation, Execution und
  Execution-Allowance bleiben geschlossen.
- BPK-078: `builder/src/releaseGovernanceRunbookEvidence.ts` buendelt Release-Governance-
  Runbook-Evidence. Merge und externe Aktionen bleiben geschlossen.
- BPK-079: `builder/src/cockpitPatchOperatorDecisionGate.ts` bewertet Cockpit-Dry-Run-
  Evidence gegen explizite Operator-Entscheidung. Patch-Anwendung, Servermutation,
  Route-Mutation und Executable Actions bleiben geschlossen.
- BPK-080: `builder/src/memoryCacheAuditExportDecisionGate.ts` bewertet Memory-Cache-
  Preview-Evidence gegen explizite Operator-Entscheidung. Datei-Write, Durable Store und
  externe Aktionen bleiben geschlossen.
- BPK-081: `builder/src/runtimePatchOperatorDecisionGate.ts` bewertet Runtime-Dry-Run-
  Evidence gegen explizite Operator-Entscheidung. Patch-Anwendung, Servermutation,
  Route-Mutation, Execution und Execution-Allowance bleiben geschlossen.
- BPK-082: `builder/src/releaseGovernanceFinalDecisionGate.ts` bewertet Release-Governance-
  Runbook-Evidence gegen explizite finale Entscheidung. Merge und externe Aktionen bleiben
  geschlossen.
- BPK-083: `builder/src/cockpitPatchApprovedActionPermitPrep.ts` bereitet Permit-Request-
  Metadaten fuer approved Cockpit-Patch-Entscheidungen vor. Permit-Ausstellung, Patch-Anwendung,
  Servermutation und Route-Mutation bleiben geschlossen.
- BPK-084: `builder/src/memoryCacheAuditExportApprovedActionPermitPrep.ts` bereitet Permit-
  Request-Metadaten fuer approved Memory-Cache-Audit-Export-Entscheidungen vor. Permit-
  Ausstellung, Datei-Write, Durable Store und externe Aktionen bleiben geschlossen.
- BPK-085: `builder/src/runtimePatchApprovedActionPermitPrep.ts` bereitet Permit-Request-
  Metadaten fuer approved Runtime-Patch-Entscheidungen vor. Permit-Ausstellung, Patch-Anwendung,
  Servermutation, Route-Mutation und Execution bleiben geschlossen.
- BPK-086: `builder/src/releaseGovernanceApprovedActionHandoffPrep.ts` bereitet Handoff-
  Metadaten fuer approved Release-Governance-Entscheidungen vor. Merge und externe Aktionen
  bleiben geschlossen.
- BPK-087: `builder/src/cockpitPatchPermitPrepEvidence.ts` buendelt Cockpit-Patch-Permit-Prep-
  Metadaten mit Evidence- und Reviewer-Bezuegen. Permit-Ausstellung, Patch-Anwendung,
  Servermutation und Route-Mutation bleiben geschlossen.
- BPK-088: `builder/src/memoryCacheAuditExportPermitPrepEvidence.ts` buendelt Memory-Cache-
  Audit-Export-Permit-Prep-Metadaten mit Evidence- und Reviewer-Bezuegen. Permit-Ausstellung,
  Datei-Write, Durable Store und externe Aktionen bleiben geschlossen.
- BPK-089: `builder/src/runtimePatchPermitPrepEvidence.ts` buendelt Runtime-Patch-Permit-Prep-
  Metadaten mit Evidence- und Reviewer-Bezuegen. Permit-Ausstellung, Patch-Anwendung,
  Servermutation, Route-Mutation und Execution bleiben geschlossen.
- BPK-090: `builder/src/releaseGovernanceHandoffPrepEvidence.ts` buendelt Release-Governance-
  Handoff-Prep-Metadaten mit Evidence- und Reviewer-Bezuegen. Merge und externe Aktionen bleiben
  geschlossen.
- BPK-091: `builder/src/cockpitPatchPermitIssuanceReadiness.ts` bewertet Cockpit-Patch-Permit-
  Issuance-Readiness aus Evidence, Issuer und Policy. Permit-Ausstellung, Patch-Anwendung,
  Servermutation und Route-Mutation bleiben geschlossen.
- BPK-092: `builder/src/memoryCacheAuditExportPermitIssuanceReadiness.ts` bewertet Memory-
  Cache-Audit-Export-Permit-Issuance-Readiness aus Evidence, Issuer und Policy. Permit-
  Ausstellung, Datei-Write, Durable Store und externe Aktionen bleiben geschlossen.
- BPK-093: `builder/src/runtimePatchPermitIssuanceReadiness.ts` bewertet Runtime-Patch-Permit-
  Issuance-Readiness aus Evidence, Issuer und Policy. Permit-Ausstellung, Patch-Anwendung,
  Servermutation, Route-Mutation und Execution bleiben geschlossen.
- BPK-094: `builder/src/releaseGovernanceApprovedActionReadiness.ts` bewertet Release-
  Governance-Approved-Action-Readiness aus Evidence, Approver und Policy. Merge und externe
  Aktionen bleiben geschlossen.
- BPK-095: `builder/src/cockpitPatchPermitIssuanceRequestPacket.ts` uebersetzt Cockpit-Patch-
  Permit-Issuance-Readiness in ein Request-Packet. Permit-Ausstellung, Patch-Anwendung,
  Servermutation und Route-Mutation bleiben geschlossen.
- BPK-096: `builder/src/memoryCacheAuditExportPermitIssuanceRequestPacket.ts` uebersetzt
  Memory-Cache-Audit-Export-Permit-Issuance-Readiness in ein Request-Packet. Permit-Ausstellung,
  Datei-Write, Durable Store und externe Aktionen bleiben geschlossen.
- BPK-097: `builder/src/runtimePatchPermitIssuanceRequestPacket.ts` uebersetzt Runtime-Patch-
  Permit-Issuance-Readiness in ein Request-Packet. Permit-Ausstellung, Patch-Anwendung,
  Servermutation, Route-Mutation und Execution bleiben geschlossen.
- BPK-098: `builder/src/releaseGovernanceApprovedActionRequestPacket.ts` uebersetzt Release-
  Governance-Approved-Action-Readiness in ein Request-Packet. Merge und externe Aktionen bleiben
  geschlossen.
- BPK-099: `builder/src/cockpitPatchAuthorityReviewIntake.ts` nimmt Cockpit-Patch-Permit-
  Issuance-Request-Packets fuer Authority Review an. Permit-Ausstellung, Patch-Anwendung,
  Servermutation und Route-Mutation bleiben geschlossen.
- BPK-100: `builder/src/memoryCacheAuditExportAuthorityReviewIntake.ts` nimmt Memory-Cache-
  Audit-Export-Permit-Issuance-Request-Packets fuer Authority Review an. Permit-Ausstellung,
  Datei-Write, Durable Store und externe Aktionen bleiben geschlossen.
- BPK-101: `builder/src/runtimePatchAuthorityReviewIntake.ts` nimmt Runtime-Patch-Permit-
  Issuance-Request-Packets fuer Authority Review an. Permit-Ausstellung, Patch-Anwendung,
  Servermutation, Route-Mutation und Execution bleiben geschlossen.
- BPK-102: `builder/src/releaseGovernanceAuthorityReviewIntake.ts` nimmt Release-Governance-
  Approved-Action-Request-Packets fuer Authority Review an. Merge und externe Aktionen bleiben
  geschlossen.
- BPK-103: `builder/src/cockpitPatchAuthorityReviewDecisionGate.ts` bewertet Cockpit-Patch-
  Authority-Review-Intake gegen explizite Authority-Entscheidungen. Permit-Ausstellung,
  Patch-Anwendung, Servermutation und Route-Mutation bleiben geschlossen.
- BPK-104: `builder/src/memoryCacheAuditExportAuthorityReviewDecisionGate.ts` bewertet Memory-
  Cache-Audit-Export-Authority-Review-Intake gegen explizite Authority-Entscheidungen. Permit-
  Ausstellung, Datei-Write, Durable Store und externe Aktionen bleiben geschlossen.
- BPK-105: `builder/src/runtimePatchAuthorityReviewDecisionGate.ts` bewertet Runtime-Patch-
  Authority-Review-Intake gegen explizite Authority-Entscheidungen. Permit-Ausstellung,
  Patch-Anwendung, Servermutation, Route-Mutation und Execution bleiben geschlossen.
- BPK-106: `builder/src/releaseGovernanceAuthorityReviewDecisionGate.ts` bewertet Release-
  Governance-Authority-Review-Intake gegen explizite Authority-Entscheidungen. Merge und externe
  Aktionen bleiben geschlossen.
- BPK-107: `builder/src/cockpitPatchPermitIssuePreflight.ts` prueft approved Cockpit-Patch-
  Authority-Entscheidungen fuer spaeteres Permit-Issue vor. Permit-Ausstellung, Patch-Anwendung,
  Servermutation und Route-Mutation bleiben geschlossen.
- BPK-108: `builder/src/memoryCacheAuditExportPermitIssuePreflight.ts` prueft approved Memory-
  Cache-Audit-Export-Authority-Entscheidungen fuer spaeteres Permit-Issue vor. Permit-
  Ausstellung, Datei-Write, Durable Store und externe Aktionen bleiben geschlossen.
- BPK-109: `builder/src/runtimePatchPermitIssuePreflight.ts` prueft approved Runtime-Patch-
  Authority-Entscheidungen fuer spaeteres Permit-Issue vor. Permit-Ausstellung, Patch-Anwendung,
  Servermutation, Route-Mutation und Execution bleiben geschlossen.
- BPK-110: `builder/src/releaseGovernanceApprovedActionPreflight.ts` prueft approved Release-
  Governance-Authority-Entscheidungen fuer spaetere Approved Action vor. Merge und externe
  Aktionen bleiben geschlossen.
- BPK-111: `builder/src/cockpitPatchPermitIssueAuthority.ts` zeichnet ein side-effect-freies
  Cockpit-Patch-Permit-Artefakt auf. Consume, Patch-Anwendung, Servermutation und Route-Mutation
  bleiben geschlossen.
- BPK-112: `builder/src/memoryCacheAuditExportPermitIssueAuthority.ts` zeichnet ein side-effect-
  freies Memory-Cache-Audit-Export-Permit-Artefakt auf. Consume, Datei-Write, Durable Store und
  externe Aktionen bleiben geschlossen.
- BPK-113: `builder/src/runtimePatchPermitIssueAuthority.ts` zeichnet ein side-effect-freies
  Runtime-Patch-Permit-Artefakt auf. Consume, Patch-Anwendung, Servermutation, Route-Mutation und
  Execution bleiben geschlossen.
- BPK-114: `builder/src/releaseGovernanceApprovedActionAuthority.ts` zeichnet ein side-effect-
  freies Release-Governance-Approved-Action-Artefakt auf. Action-Consume, Merge und externe
  Aktionen bleiben geschlossen.
- BPK-115: `builder/src/cockpitPatchPermitConsumePreflight.ts` prueft ein ausgestelltes Cockpit-
  Patch-Permit fuer spaeteren Konsum vor. Consume, Patch-Anwendung, Servermutation und Route-
  Mutation bleiben geschlossen.
- BPK-116: `builder/src/memoryCacheAuditExportPermitConsumePreflight.ts` prueft ein
  ausgestelltes Memory-Cache-Audit-Export-Permit fuer spaeteren Konsum vor. Consume, Datei-Write,
  Durable Store und externe Aktionen bleiben geschlossen.
- BPK-117: `builder/src/runtimePatchPermitConsumePreflight.ts` prueft ein ausgestelltes Runtime-
  Patch-Permit fuer spaeteren Konsum vor. Consume, Patch-Anwendung, Servermutation, Route-Mutation
  und Execution bleiben geschlossen.
- BPK-118: `builder/src/releaseGovernanceApprovedActionConsumePreflight.ts` prueft ein
  autorisiertes Release-Governance-Approved-Action-Artefakt fuer spaeteren Konsum vor. Action-
  Consume, Merge und externe Aktionen bleiben geschlossen.
- BPK-119: `builder/src/cockpitPatchPermitConsumeAuthority.ts` zeichnet ein side-effect-freies
  Cockpit-Patch-Permit-Consume-Authorization-Artefakt auf. Consume, Patch-Anwendung,
  Servermutation und Route-Mutation bleiben geschlossen.
- BPK-120: `builder/src/memoryCacheAuditExportPermitConsumeAuthority.ts` zeichnet ein
  side-effect-freies Memory-Cache-Audit-Export-Permit-Consume-Authorization-Artefakt auf.
  Consume, Datei-Write, Durable Store und externe Aktionen bleiben geschlossen.
- BPK-121: `builder/src/runtimePatchPermitConsumeAuthority.ts` zeichnet ein side-effect-freies
  Runtime-Patch-Permit-Consume-Authorization-Artefakt auf. Consume, Patch-Anwendung,
  Servermutation, Route-Mutation und Execution bleiben geschlossen.
- BPK-122: `builder/src/releaseGovernanceApprovedActionConsumeAuthority.ts` zeichnet ein
  side-effect-freies Release-Governance-Approved-Action-Consume-Authorization-Artefakt auf.
  Action-Consume, Merge und externe Aktionen bleiben geschlossen.
- BPK-123: `builder/src/cockpitPatchPermitConsumeApplicationPreflight.ts` prueft Cockpit-Patch-
  Consume-Authorization fuer spaetere Anwendung vor. Consume, Patch-Anwendung, Servermutation und
  Route-Mutation bleiben geschlossen.
- BPK-124: `builder/src/memoryCacheAuditExportPermitConsumeApplicationPreflight.ts` prueft
  Memory-Cache-Audit-Export-Consume-Authorization fuer spaetere Anwendung vor. Consume,
  Datei-Write, Durable Store und externe Aktionen bleiben geschlossen.
- BPK-125: `builder/src/runtimePatchPermitConsumeApplicationPreflight.ts` prueft Runtime-Patch-
  Consume-Authorization fuer spaetere Anwendung vor. Consume, Patch-Anwendung, Servermutation,
  Route-Mutation und Execution bleiben geschlossen.
- BPK-126: `builder/src/releaseGovernanceApprovedActionConsumeApplicationPreflight.ts` prueft
  Release-Governance-Approved-Action-Consume-Authorization fuer spaetere Anwendung vor. Action-
  Consume, Merge und externe Aktionen bleiben geschlossen.
- BPK-127: `builder/src/cockpitPatchPermitConsumeApplicationAuthority.ts` zeichnet ein side-
  effect-freies Cockpit-Patch-Consume-Application-Authorization-Artefakt auf. Consume,
  Patch-Anwendung, Servermutation und Route-Mutation bleiben geschlossen.
- BPK-128: `builder/src/memoryCacheAuditExportPermitConsumeApplicationAuthority.ts` zeichnet ein
  side-effect-freies Memory-Cache-Audit-Export-Consume-Application-Authorization-Artefakt auf.
  Consume, Datei-Write, Durable Store und externe Aktionen bleiben geschlossen.
- BPK-129: `builder/src/runtimePatchPermitConsumeApplicationAuthority.ts` zeichnet ein side-
  effect-freies Runtime-Patch-Consume-Application-Authorization-Artefakt auf. Consume,
  Patch-Anwendung, Servermutation, Route-Mutation und Execution bleiben geschlossen.
- BPK-130: `builder/src/releaseGovernanceApprovedActionConsumeApplicationAuthority.ts` zeichnet
  ein side-effect-freies Release-Governance-Approved-Action-Consume-Application-Authorization-
  Artefakt auf. Action-Consume, Merge und externe Aktionen bleiben geschlossen.
- BPK-131: `builder/src/cockpitPatchPermitConsumeExecutionPreflight.ts` prueft Cockpit-Patch-
  Consume-Application-Authority fuer spaetere Execution vor. Consume, Patch-Anwendung,
  Servermutation und Route-Mutation bleiben geschlossen.
- BPK-132: `builder/src/memoryCacheAuditExportPermitConsumeExecutionPreflight.ts` prueft
  Memory-Cache-Audit-Export-Consume-Application-Authority fuer spaetere Execution vor. Consume,
  Datei-Write, Durable Store und externe Aktionen bleiben geschlossen.
- BPK-133: `builder/src/runtimePatchPermitConsumeExecutionPreflight.ts` prueft Runtime-Patch-
  Consume-Application-Authority fuer spaetere Execution vor. Consume, Patch-Anwendung,
  Servermutation, Route-Mutation und Runtime-Execution bleiben geschlossen.
- BPK-134: `builder/src/releaseGovernanceApprovedActionConsumeExecutionPreflight.ts` prueft
  Release-Governance-Approved-Action-Consume-Application-Authority fuer spaetere Execution vor.
  Action-Consume, Merge und externe Aktionen bleiben geschlossen.
- BPK-135: `builder/src/cockpitPatchPermitConsumeExecutionAuthority.ts` zeichnet ein side-
  effect-freies Cockpit-Patch-Consume-Execution-Authorization-Artefakt auf. Consume,
  Patch-Anwendung, Servermutation und Route-Mutation bleiben geschlossen.
- BPK-136: `builder/src/memoryCacheAuditExportPermitConsumeExecutionAuthority.ts` zeichnet ein
  side-effect-freies Memory-Cache-Audit-Export-Consume-Execution-Authorization-Artefakt auf.
  Consume, Datei-Write, Durable Store und externe Aktionen bleiben geschlossen.
- BPK-137: `builder/src/runtimePatchPermitConsumeExecutionAuthority.ts` zeichnet ein side-
  effect-freies Runtime-Patch-Consume-Execution-Authorization-Artefakt auf. Consume,
  Patch-Anwendung, Servermutation, Route-Mutation und Runtime-Execution bleiben geschlossen.
- BPK-138: `builder/src/releaseGovernanceApprovedActionConsumeExecutionAuthority.ts` zeichnet
  ein side-effect-freies Release-Governance-Approved-Action-Consume-Execution-Authorization-
  Artefakt auf. Action-Consume, Merge und externe Aktionen bleiben geschlossen.
- BPK-139: `builder/src/cockpitPatchPermitConsumeExecutionReceiptPreflight.ts` prueft Cockpit-
  Patch-Consume-Execution-Authority fuer spaetere Receipt-Erfassung vor. Consume, Receipt-Write,
  Patch-Anwendung, Servermutation und Route-Mutation bleiben geschlossen.
- BPK-140: `builder/src/memoryCacheAuditExportPermitConsumeExecutionReceiptPreflight.ts` prueft
  Memory-Cache-Audit-Export-Consume-Execution-Authority fuer spaetere Receipt-Erfassung vor.
  Consume, Receipt-Write, Datei-Write, Durable Store und externe Aktionen bleiben geschlossen.
- BPK-141: `builder/src/runtimePatchPermitConsumeExecutionReceiptPreflight.ts` prueft Runtime-
  Patch-Consume-Execution-Authority fuer spaetere Receipt-Erfassung vor. Consume, Receipt-Write,
  Patch-Anwendung, Servermutation, Route-Mutation und Runtime-Execution bleiben geschlossen.
- BPK-142: `builder/src/releaseGovernanceApprovedActionConsumeExecutionReceiptPreflight.ts`
  prueft Release-Governance-Approved-Action-Consume-Execution-Authority fuer spaetere Receipt-
  Erfassung vor. Action-Consume, Receipt-Write, Merge und externe Aktionen bleiben geschlossen.
- BPK-143: `builder/src/cockpitPatchPermitConsumeExecutionReceiptAuthority.ts` zeichnet ein
  side-effect-freies Cockpit-Patch-Consume-Execution-Receipt-Authorization-Artefakt auf.
  Consume, Receipt-Write, Patch-Anwendung, Servermutation und Route-Mutation bleiben geschlossen.
- BPK-144: `builder/src/memoryCacheAuditExportPermitConsumeExecutionReceiptAuthority.ts`
  zeichnet ein side-effect-freies Memory-Cache-Audit-Export-Consume-Execution-Receipt-
  Authorization-Artefakt auf. Consume, Receipt-Write, Datei-Write, Durable Store und externe
  Aktionen bleiben geschlossen.
- BPK-145: `builder/src/runtimePatchPermitConsumeExecutionReceiptAuthority.ts` zeichnet ein
  side-effect-freies Runtime-Patch-Consume-Execution-Receipt-Authorization-Artefakt auf.
  Consume, Receipt-Write, Patch-Anwendung, Servermutation, Route-Mutation und Runtime-Execution
  bleiben geschlossen.
- BPK-146: `builder/src/releaseGovernanceApprovedActionConsumeExecutionReceiptAuthority.ts`
  zeichnet ein side-effect-freies Release-Governance-Approved-Action-Consume-Execution-Receipt-
  Authorization-Artefakt auf. Action-Consume, Receipt-Write, Merge und externe Aktionen bleiben
  geschlossen.

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

Nach BPK-186 ist das Permit-/Approved-Action-Consume-Execution-Receipt-Record-Audit-Receipt-Record-Preflight Bundle abgeschlossen, wenn:

- die Review-Packets fuer BPK-183 bis BPK-186 existieren,
- die vier fokussierten Consume-Execution-Receipt-Record-Audit-Receipt-Record-Preflight-Tests und `npm run typecheck` in `builder/` gruen
  sind,
- `node tools/verify-task-lock.cjs BPK-183 --verify` bis BPK-186 gruen sind,
- `git diff --check` gruen ist,
- keine Server-Mounts, keine Renderer-Aenderung, keine Durable Persistenz, keine DB, kein
  Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein Write, kein Deploy und
  keine Package-Aenderung still mitgezogen wurde.

Naechste Hauptbloecke:

1. Cockpit Patch Permit Consume Execution Receipt Record Audit Receipt Record Authority.
2. Memory Cache Audit Export Permit Consume Execution Receipt Record Audit Receipt Record Authority.
3. Runtime Patch Permit Consume Execution Receipt Record Audit Receipt Record Authority.
4. Release Governance Approved Action Consume Execution Receipt Record Audit Receipt Record Authority.
