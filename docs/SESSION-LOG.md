# SESSION-LOG - Bluepilot

> Anker nach `docs/CLAUDE-CONTEXT.md` lesen. Neueste Eintraege oben.
> Jeder Eintrag: Datum, was entschieden oder gebaut wurde, Ergebnis, roter Faden fuer den naechsten Block.

---

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
