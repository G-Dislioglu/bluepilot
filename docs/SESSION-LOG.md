# SESSION-LOG - Bluepilot

> Anker nach `docs/CLAUDE-CONTEXT.md` lesen. Neueste Eintraege oben.
> Jeder Eintrag: Datum, was entschieden oder gebaut wurde, Ergebnis, roter Faden fuer den naechsten Block.

---

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
