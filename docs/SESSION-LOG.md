# SESSION-LOG - Bluepilot

> Anker nach `docs/CLAUDE-CONTEXT.md` lesen. Neueste Eintraege oben.
> Jeder Eintrag: Datum, was entschieden oder gebaut wurde, Ergebnis, roter Faden fuer den naechsten Block.

---

## 2026-06-01 - Sandbox Write Readiness (BP-139)

- Gebaut: `bluepilot-sandbox` als eigenes, write-disabled Target-Profil und
  `POST /probe/sandbox-write-check` als guarded Readiness-Probe fuer den deployten
  GitHub-Token.
- Ergebnis: Der Probe schreibt nach expliziter Bestaetigung nur in
  `G-Dislioglu/bluepilot-sandbox`, legt eine kleine temporaere Datei unter `.bluepilot/`
  an und loescht sie wieder. Repo, Owner und Pfad werden nicht aus dem Request gelesen;
  Token-Werte werden nicht serialisiert.
- Sicherheitsentscheidung: Der Maya-Kill-Switch bleibt geschlossen. `opusSmartPush`,
  Orchestrator, Provider, Maya-Gate und Default-Target bleiben unveraendert, weil SmartPush
  derzeit noch hart auf `G-Dislioglu/soulmatch` zeigt.
- Beweis: `node tools/verify-task-lock.cjs BP-139 --preflight`, `npm test`,
  `npm run typecheck`, `node tools/verify-task-lock.cjs BP-139 --verify` und
  `git diff --check` sind gruen.
- Roter Faden weiter: Nach Merge und Deploy den Sandbox-Write-Probe live ausfuehren. Erst wenn
  er `writable` meldet, BP-140 fuer einen echten, eng begrenzten Sandbox-Mini-Write schneiden.

## 2026-06-01 - Builder Repo Index Runtime Artifact (BP-138)

- Gebaut: `builder/data/builder-repo-index.json` als Runtime-Artefakt fuer den Phase-A-Dry-Run
  und `builder/scripts/generate-repo-index.mjs` als Generator/Normalizer.
- Ergebnis: Der erste Live-Blocker aus BP-137 ist adressiert. `builderScopeResolver` findet jetzt
  den Index unter dem Render-Root `builder/` und kann Scope-Aufloesung starten, statt sofort mit
  `builder-repo-index.json not found` zu werfen.
- Korrektur am Claude-Paket: Der Index darf nicht Bluepilots eigenes `builder/src` beschreiben,
  weil der Orchestrator aktuell auf das Default-Target `soulmatch` zeigt und danach Dateien aus
  `G-Dislioglu/soulmatch` holt. BP-138 erzeugt deshalb einen Soulmatch-Zielindex mit Pfaden wie
  `server/src/lib/opusTaskOrchestrator.ts`.
- Beweis: `npm test` in `builder/` laeuft mit 25 Tests gruen; der neue Test prueft Artifact-Form,
  Generator-Check und `resolveScope` ohne Missing-Index-Fehler. `npm run typecheck` ist gruen.
- Roter Faden weiter: Nach Merge und Render-Deploy `POST /probe/dry-run` erneut mit einem echten
  indexed Soulmatch-Pfad testen. Falls danach Provider- oder Orchestrator-Fehler sichtbar werden,
  ist das die naechste Schicht und kein Rueckfall.

## 2026-06-01 - Phase-A Dry-Run Trigger (BP-137)

- Gebaut: `POST /probe/dry-run` im Bluepilot-Builder. Der Endpunkt nimmt `{ instruction }`
  entgegen und ruft den bestehenden `orchestrateTask`-Pfad mit serverseitig erzwungenem
  `dryRun: true` und `skipDeploy: true` auf.
- Ergebnis: Phase A bekommt einen echten externen Startknopf ohne Render-Shell. Der Endpunkt
  gibt `status`, `runId`, `summary`, extrahierte `scopeFiles`, Phasenuebersicht und eine lokale
  Safety-Zusammenfassung zurueck.
- Korrektur am Claude-Paket: `OpusTaskResult` hat kein direktes `scopeFiles`-Feld; die Dateien
  werden aus der `scope`-Phase extrahiert. Ausserdem beweist der Orchestrator-Dry-Run nicht
  nochmals die externe Maya-Gate-Reachability, weil der Dry-Run vor realem SmartPush endet.
  Maya-Gate-Reachability ist der separate BP-135/BP-136-Beweis.
- Beweis: `npm test` in `builder/` laeuft mit 22 Tests gruen, inklusive erzwungenem Dry-Run und
  400/405-Guards. `npm run typecheck` ist gruen.
- Roter Faden weiter: Nach Merge und Render-Deploy `POST /probe/dry-run` live mit einer kleinen
  harmlosen Instruction testen. Erwartet ist `status: "dry_run"` und `safety.pushAllowed: false`.

## 2026-06-01 - Maya-Gate Readiness Probe (BP-135)

- Gebaut: `GET /health/maya-gate` im Bluepilot-Builder. Der Endpunkt ruft die bestehenden
  Gate-Client-Funktionen `assessBudget`, `assessCorridor` und `recordCost` mit synthetischen
  Probe-Daten auf.
- Ergebnis: Der Free-Render-Dienst braucht keine Shell mehr, um das Bluepilot -> maya-core
  Token-Binding zu pruefen. Die Antwort enthaelt `mayaCoreConfigured` und pro Gate
  `reachable`/`reason`, aber keine Secret-Werte.
- Korrektur am Claude-Paket: Der Probe ist nicht streng read-only, weil `recordCost` einen
  kleinen Cost-Record in maya-core erzeugen kann. Das ist als best-effort Readiness-Side-Effect
  dokumentiert. `assessCorridor` nutzt korrekt `actionKind: 'push'` plus `dryRun: true`.
- Beweis: `npm test` in `builder/` laeuft mit 18 Tests gruen, inklusive Token-Abwesenheitscheck
  in der serialisierten Probe-Antwort. `npm run typecheck` ist gruen.
- Roter Faden weiter: Nach Merge und Render-Deploy `/health/maya-gate` live abrufen. Wenn Budget
  und Corridor `reachable: true` und Cost `recorded: true` melden, ist das Maya-Gate-Binding
  bewiesen und Phase-A-Probelauf kann separat geplant werden.

## 2026-06-01 - BP-131 Identifier Scrub (BP-134)

- Gebaut: Die verbliebenen konkreten DB-Ressourcenkennungen in `contracts/BP-131.json` und
  `review-packets/BP-131.md` wurden durch neutrale Platzhalter ersetzt.
- Ergebnis: Der aktuelle Arbeitsbaum enthaelt die vier bekannten Kennungen nicht mehr. Defaults
  wie `neondb` und `neondb_owner` bleiben bewusst stehen, weil sie Produktdefaults und keine
  konkreten Ressourcenkoordinaten sind.
- Korrektur am Claude-Paket: Der gelieferte BP-134-Contract wiederholte die konkreten Kennungen
  in `assumptions`/`dod`; das haette den eigenen `git grep` scheitern lassen. Der Contract wurde
  vor dem Bootstrap so neutralisiert, dass er die Werte nicht erneut commitet.
- Beweis: `git grep` ueber den ganzen Arbeitsbaum findet die vier bekannten Kennungen nicht.
  `contracts/BP-131.json` bleibt valides JSON.
- Roter Faden weiter: Jetzt kann Maya-Gate-Infra als eigener Block folgen. Git-Historie ist
  bewusst unveraendert; ein History-Rewrite waere eine separate Entscheidung.

## 2026-05-31 - Builder Live-Deploy-Anker (BP-133)

- Gebaut: `docs/BUILDER_RENDER_DEPLOY_STATE.md` haelt den ersten Live-Deploy des
  Bluepilot-Builder-Dienstes fest: Render-Service, Public URL, Branch, Root, Build-/Start-Command
  und Health-Pfad.
- Ergebnis: `GET /health` liefert live HTTP 200 mit `status: ok`; `GET /health/db` liefert live
  HTTP 200 mit `status: reachable`. Die gesetzte DB-Variable wird nur als Name dokumentiert.
- Korrektur am Claude-Paket: Der Ansatz war richtig. Zusaetzlich wurden alte konkrete
  DB-Ressourcenkennungen aus den geaenderten Ankerdateien neutralisiert, damit der
  No-Identifier-Scan fuer BP-133 wirklich greift.
- Beweis: Live-Curl gegen `https://bluepilot-builder.onrender.com` bestaetigt beide Routen.
  Geaenderte BP-133-Dateien enthalten keine Connection Strings, Hosts, Projekt-/Branch-IDs,
  Rollen oder konkreten DB-Namen.
- Roter Faden weiter: Als naechstes Maya-Gate-Infra angehen, nicht sofort E2E. Erst wenn
  maya-core erreichbar ist und Token gesetzt sind, kann der Builder kontrolliert erlauben statt
  nur fail-closed zu blocken.

## 2026-05-31 - Builder Runtime Health Entry (BP-132)

- Gebaut: `builder/src/server.ts` startet einen minimalen HTTP-Prozess ueber Node `http`.
  `builder/src/health.ts` kapselt Liveness und DB-Readiness, damit die Logik ohne Port-Bindung
  testbar bleibt.
- Ergebnis: `GET /health` antwortet 200 und beruehrt die DB nicht. `GET /health/db` faengt
  fehlende oder unerreichbare DB-Konfiguration ab und antwortet mit JSON statt Prozess-Crash.
  Es gibt keine Build-Ausfuehrungsroute.
- Korrektur/Einordnung: Claudes BP-132-Contract war brauchbar, aber `baseline_ref: "HEAD"` wurde
  auf die echte BP-131-Basis `5716470` korrigiert. Der Live-DB-Secret-Check wurde nicht lokal in
  einen Shell-Befehl geschrieben; DB-Reichweite wurde ueber Neon-MCP mit `SELECT 1` bestaetigt.
- Beweis: `npm test` und `npm run typecheck` in `builder/` sind gruen. Lokaler `npm start`
  liefert `/health` 200 und `/health/db` 503 `not_configured`, wenn die Secret-Env-Var fehlt.
- Roter Faden weiter: Nach Merge kann der Render-Service mit Root Directory `builder/` angelegt
  und `BLUEPILOT_BUILDER_DATABASE_URL` als Secret gesetzt werden.

## 2026-05-31 - Builder Neon-DB-Infra (BP-131)

- Gebaut: Das bestehende Neon-Projekt `bluepilot-builder` wurde als Live-DB-Fundament fuer den
  migrierten Builder verwendet. In der dedizierten Builder-Datenbank wurden die 15 Tabellen aus
  `builder/src/schema/builder.ts` leer angelegt.
- Ergebnis: Die Datenbank ist separat von soulmatch, nutzt das Bluepilot-Ziel
  `BLUEPILOT_BUILDER_DATABASE_URL` und enthaelt keine Datenmigration. Secrets wurden nicht ins
  Repo geschrieben.
- Korrektur waehrend der Ausfuehrung: Der Screenshot zeigte noch die alte soulmatch-DB-Seite,
  aber das bestehende Builder-DB-Projekt wurde als Ziel bestaetigt und verwendet.
- Beweis: Neon listet 15 Builder-Tabellen; die Tabellenzaehlung fuer das definierte Builder-Set
  gibt `15` zurueck, und die erwarteten FKs zeigen auf `builder_tasks`.
- Roter Faden weiter: Nach Merge BP-131 kann der erste echte End-to-End-Probelauf mit gesetzter
  `BLUEPILOT_BUILDER_DATABASE_URL` geplant werden. Keine Secrets in Git.

## 2026-05-31 - Builder Spitze / Orchestrator-Tip (BP-130)

- Gebaut: die bestaetigte 9-Modul-Closure der Builder-Spitze nach `builder/src/` migriert:
  Orchestrator, Build-Pipeline, Architect, Judge, RenderBridge, SelfTest, ScopeResolver,
  ControlPlane und `devLogger`.
- Ergebnis: Keine zehnte Datei, kein `builderGithubBridge`, kein `builderExecutor`, keine
  Dependency-Aenderung. Die Spitze nutzt den bereits migrierten Smart-Push-Pfad.
- Beweis: Import-Smoke plus drei echte Spitzen-Tests (`architectPhase1`, `opusJudge`,
  `opusTaskOrchestratorScopeProposal`) laufen ohne Live-API-Keys, ohne Live-DB und ohne
  erreichbares maya-core. Typecheck ist gruen.
- Roter Faden weiter: Nach BP-130 keinen stillen Umzug mehr. Naechster sinnvoller Block ist ein
  expliziter End-to-End-Probelauf im Bluepilot-Builder und erst danach Anbindung/Abriss.

## 2026-05-31 - Builder Provider/Gate/Write-Pfad (BP-129)

- Gebaut: 9 Module der Provider-, Gate- und Write-Pfad-Welle nach `builder/src/` migriert,
  inklusive `providers`, `outboundHttp`, `opusSmartPush`, `opusPatchMode`,
  `opusErrorLearning` und `mayaBuilderGateClient`.
- Ergebnis: Die maschinelle Closure zieht keine Spitze nach. Kein Orchestrator, keine Pipeline,
  kein Judge, kein Architect und kein `builderGithubBridge` wurden migriert.
- Korrektur am Claude-Paket: `mayaBuilderGateClient` existiert lokal und ist Pflicht, weil
  `providers` und `opusSmartPush` ihn importieren. Der Contract wurde von 8 auf 9 Module
  korrigiert und WLP-gueltig gemacht.
- Beweis: Tests und Typecheck laufen ohne Live-API-Keys, ohne Live-DB und ohne erreichbares
  maya-core. Der Gate-Client-Test prueft fail-closed Verhalten und Gate-Token-Header mit Stub.
- Roter Faden weiter: Erst BP-129 reviewen/mergen. Danach die Spitze separat schneiden:
  Orchestrator/Pipeline/Judge/Architect nur nach neuer Closure-Pruefung.

## 2026-05-31 - Builder DB-Fundament (BP-128)

- Gebaut: eigenes Builder-DB-Fundament unter `builder/` mit kompletter Schema-Kopie,
  `builder/src/db.ts`, `BLUEPILOT_BUILDER_DATABASE_URL`, `.env.example` und den zwei DB-only
  Modulen `poolState` + `builderApprovalArtifacts`.
- Ergebnis: Keine Live-DB fuer lokale Verifikation noetig. `getDb()` scheitert ohne Env-Var klar,
  Tests und Typecheck laufen trotzdem gruen.
- Korrektur am Claude-Paket: `opusErrorLearning` bleibt draussen, weil es `providers` zieht.
  Die zwei migrierten DB-Module sind nicht bytegleich, sondern nur mit relativen Importpfaden ans
  neue `builder/src`-Layout angepasst. Das Schema selbst ist bytegleich.
- Roter Faden weiter: Naechste Welle kann Provider/Netz/Gates pruefen, aber erst wieder mit
  maschineller Closure. Keine DB-, Provider- oder Write-Pfad-Teile still vermischen.

## 2026-05-31 - Builder Umzugswelle 1: Logik-Closure (BP-127)

- Gebaut: 14 maschinell gepruefte pure-logic Builder-Module aus soulmatch wurden nach
  `builder/src/` kopiert. Die Moduldateien sind bytegleich mit den soulmatch-Quellen.
- Ergebnis: Kein Orchestrator, keine DB, kein Provider, kein Netz und kein Write-Pfad wurden
  migriert. `opusBuildPipeline` bleibt bewusst draussen.
- Beweis: `npm test` und `npm run typecheck` in `builder/` sind gruen. Der Import-Smoke-Test
  laedt alle 14 Module; `opusEnvelopeValidator.test.ts` ist als vorhandener Logiktest mitgezogen.
- Roter Faden weiter: Naechste Welle separat schneiden. Vorher wieder Import-Closure pruefen und
  nicht still Richtung Orchestrator, DB oder Write-Pfad wachsen lassen.

## 2026-05-31 - Builder TypeScript-Fundament (BP-126)

- Gebaut: `builder/` als eigenes TypeScript-Subpackage mit `package.json`, `tsconfig.json`,
  `tsx`/`typescript`, Smoke-Modul und Smoke-Test.
- Ergebnis: Bluepilots Root bleibt CJS/WLP-Governance; der kommende Builder bekommt ein eigenes
  TS-Stockwerk. Es wurde noch kein soulmatch-Builder-Modul kopiert oder bewegt.
- Korrektur am Claude-Paket: Der gelieferte Contract hatte noch keine gueltigen WLP-Felder
  `reuse_target` und `evidence_required`; die Matrix hatte Encoding-Mojibake und zu starke
  Aussagen zum geschlossenen Tier-1-Kern. BP-126 setzt beides korrigiert um.
- Roter Faden weiter: Vor dem ersten echten Modul-Umzug muss die Tier-1-Import-Closure weiter
  maschinell gegen den lokalen soulmatch-Code geprueft werden. Danach zuerst Logik-Blaetter,
  nicht Orchestrator-Spitze, migrieren.

## 2026-05-31 - Anker und Leseregel (BP-125)

- Gebaut: `docs/SESSION-LOG.md`, `STATE.md`, `docs/DEPLOY_MAYA_CORE_BINDING.md` und eine
  Pflicht-Lesereihenfolge in `AGENTS.md`.
- Ergebnis: Bluepilot hat jetzt dieselbe Anker-Disziplin wie soulmatch und maya-core:
  erst `docs/CLAUDE-CONTEXT.md`, dann dieses Log, dann `STATE.md`, dann Contract und relevante
  Dateien.
- Korrektur am Claude-Paket: Die gelieferte BP-124-Nummer war schon durch die Auth-Aufgabe belegt,
  das Contract-Feld `docs_task` waere ungueltig gewesen, und die gelieferten Dateien hatten
  Encoding-Mojibake. BP-125 uebernimmt die Absicht mit gueltigem WLP und aktuellem Repo-Stand.
- Roter Faden weiter: Erst nach diesen Ankern sollte der groessere Builder-Umzug oder der echte
  "Maya Review"-Sprechort in Bluepilot beginnen.

## 2026-05-31 - Maya Memory Server-to-Server Auth (BP-124)

- Gebaut: maya-core `/api/maya/memory` nutzt den bestehenden Builder-Gate-Auth-Helfer. Bluepilots
  BP-123-Client sendet bereits `x-maya-core-gate-token`; dieser Header passt jetzt zu einem echten
  maya-core-Auth-Pfad.
- Ergebnis: In `aicos-registry` liegt Branch `bp-124-maya-memory-auth` mit Commit `bf9407e`.
  Bluepilot dokumentiert den Stand in `contracts/BP-124.json` und `review-packets/BP-124.md`.
- Wichtig fuers Deploy: Der maya-core-Commit muss gemergt/deployt werden. Erst dann ist der
  Cross-App-Memory-Pfad live; sonst bleibt Bluepilot im lokalen Offline-Fallback.
- Roter Faden weiter: Memory ist deployfest vorbereitet. Persona/Stimme und Ethics/Builder-Gates
  bleiben separate spaetere Schritte.

## 2026-05-31 - Maya-Anbindung Stufe 1: Gedaechtnis (BP-123)

- Gebaut: Bluepilots Maya-Memory wurde vom lokalen JSON-Store zum Client des gemeinsamen
  Block-2-Gedaechtnisses in maya-core.
- Verhalten: Schreibt nur Vorschlaege (`review_status='pending'`) mit `app_origin='bluepilot'`,
  liest nur bestaetigte Eintraege und faellt bei nicht erreichbarem maya-core ehrlich auf lokales
  JSON zurueck (`storage='local_json_fallback'`, `offline=true`).
- Ergebnis: `bluepilot/main` erreichte `109ca7a`.
- Roter Faden weiter: Der Client war logisch gebaut, aber echter Deploy brauchte die Auth-Klaerung
  aus BP-124.

## 2026-05-31 - Anker-Bootstrap (BP-122)

- Gebaut: `docs/CLAUDE-CONTEXT.md` als erster roter Faden fuer Bluepilot.
- Inhalt: Zweck, MVP-Kette, WLP-Regeln, Phasenstand, offene Punkte und Maya-Anbindungsplan.
- Ergebnis: BP-122 wurde gemergt; der Contract wurde zuerst als Bootstrap-Commit gesetzt, weil der
  Verifier einen existierenden Contract fuer sauberen Preflight braucht.
- Roter Faden weiter: `SESSION-LOG.md` und `STATE.md` fehlten noch als Anker-Ergaenzung.

## Bis 2026-05-29 - Phasen C1-C5

- C1 Kernel: gruen.
- C2 Context Broker, Multi-Model-Pool, Council Session Guard: gruen (BP-094, 2026-05-28).
- C3 AICOS Auto-Query, Maya Memory v0, Parallel Executor: gruen (BP-098, 2026-05-28).
- C4 Browser-Preview, DiffLens, Human UI Review Gate, Screenshot/Visual: technisch gruen.
- C5 Integration: Entry freigegeben (BP-110 Human Review APPROVED, 2026-05-29).
- Hinweis: Dieses Log wurde erst am 2026-05-31 eingefuehrt. Fruehere Details liegen in den
  jeweiligen Contracts, Checkpoints und Review-Packets.
