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
- Aktueller BPK-Arbeitsbranch: `bpk-009-cockpit-projection-adoption-contract`.
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

Nach BPK-009 darf erst Live AICOS/Card Binding Intake geoeffnet werden, wenn:

- das Review-Packet fuer BPK-009 existiert,
- `npx tsx --test tests/cockpitProjectionAdoptionContract.test.ts` und `npm run typecheck` in
  `builder/` gruen sind,
- `node tools/verify-task-lock.cjs BPK-009 --verify` gruen ist,
- `git diff --check` gruen ist,
- keine Runtime-, Auth-, DB-, Deploy-, Live-Write- oder UI-Freigabe still mitgezogen wurde.

Naechste Hauptbloecke:

1. Live AICOS/Card Binding.
2. Merge/Release Sequencing.
