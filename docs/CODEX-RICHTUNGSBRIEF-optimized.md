# CODEX-RICHTUNGSBRIEF - Bluepilot

Status: verbindlicher Arbeitsanker ab BPK-001
Quelle: kritisch bereinigter Claude/Codex-Richtungsbrief vom 2026-06-13
Standard: PROOF CORE Lite v2, WLP 0.1b, ANKER-REGEL, NEUE LEHRE, SICHT-TEST-REGEL

## 0. Warum dieser Brief existiert

Der alte Anker `docs/CLAUDE-CONTEXT.md` driftete vom echten Repo-Stand weg:
er beschrieb BP-121/BP-125-nahe Wahrheit, waehrend `STATE.md` bis BP-149
lief. Bluepilot darf nicht aus einem falschen Anker heraus weitergebaut werden.

Dieser Brief setzt deshalb eine harte Reihenfolge:

1. Angefangene Linien zuerst abschliessen.
2. Einen Block erst als fertig melden, wenn der echte Repo-Stand die Aussage
   falsifiziert oder bestaetigt hat.
3. Externe KI-Outputs kritisch pruefen, nie blind uebernehmen.
4. Runtime-, Write-, Auth-, DB- und Deploy-Freigaben nicht still mitziehen.

## 1. Pflicht-Lesereihenfolge

Vor jeder Umsetzung in Bluepilot:

1. `docs/CLAUDE-CONTEXT.md`
2. `docs/SESSION-LOG.md`
3. `STATE.md`
4. der Contract des aktuellen Blocks unter `contracts/`
5. die im Contract genannten betroffenen Dateien

Wenn eine dieser Dateien fehlt oder dem echten Repo-Stand widerspricht, ist das
kein Anlass zum Raten. Der Widerspruch wird als Blocker oder als eigener
Doc-Drift-Block behandelt.

## 2. Bindende Block-Reihenfolge

Diese Reihenfolge gilt fuer den BPK-Pfad:

```text
[0] Anchor approved - abgeschlossen, nur Voraussetzung
[1] BPK-001 Doc-Drift-Hygiene
[2] BPK-002 Permit-Generalisierung
[3] BPK-003 WorkerPacket-to-WLP-Adapter
[4] Card-Conditioned Dispatch
[5] Pre-Registered Claims
[6] CLI-Deduplizierung / Schema-Generierung
[7] Dispatch / Frontend - zuletzt
```

Kein spaeterer Block wird vorgezogen. Frontend kommt zuletzt, ausser ein
UI-spezifischer Contract erlaubt genau diesen Scope.

## 3. Aktueller Block: BPK-001 Doc-Drift-Hygiene

BPK-001 hebt `docs/CLAUDE-CONTEXT.md` auf die BP-149-Wahrheit aus `STATE.md`.
Er korrigiert:

- den Stand des Ankers,
- die Builder-Subpackage-Linie unter `builder/`,
- den Live-Deploy `bluepilot-builder`,
- den ersten permit-kontrollierten Sandbox-Write mit Commit
  `5327082bb0804ff1728ee39b2744fcec79d32906`,
- die retired Legacy-Endpunkte,
- den neuen `POST /probe/sandbox-write` aus BP-149,
- den harten Fakt zum Maya-Core-Memory-Pfad.

Der Maya-Memory-Fakt muss per echtem Request belegt werden:

- `live`: Route antwortet erreichbar und semantisch als Memory-Route.
- `live-auth-required`: Route ist erreichbar, verweigert aber ohne Gate-Token.
- `not-live`: Route fehlt oder antwortet nicht als Memory-Route.
- `not-checkable`: kein belastbarer Request moeglich; Grund dokumentieren.

Ohne gesetztes `MAYA_CORE_URL` plus Gate-Token darf Bluepilot lokal weiterhin
ehrlich im Offline-Fallback bleiben.

## 4. Falsifikations-Gates

Jeder Block wird gegen echten Code und echten Git-Stand geprueft:

- G1 Repo-Wahrheit: Contract-Behauptungen stimmen mit Dateien/Diff ueberein.
- G2 Kein Doppelbau: Bestehende Funktion wird verdrahtet, nicht dupliziert.
- G3 Scope-Treue: Keine stille Ziel- oder Scope-Aenderung.
- G4 FORBIDDEN_FILES: Keine verbotene Datei beruehrt.
- G5 Sicht-Test: Nur bei UI; dann Playwright-Screenshot oder harter Blocker.

Rot bleibt rot. Ein rotes Gate wird nicht durch Prosa gruen geschrieben.

Charter-Check fuer Bluepilot-Bloecke: Fuegt dieser Block ein neues Limit, Gate,
Approval oder Spec-/Zeremonie ohne lauffaehiges Artefakt hinzu? Wenn ja, als
Entscheidungsvorschlag an Gurcan/Maya markieren und nicht still bauen. Bluepilot
referenziert dafuer die bestehende soulmatch-Autonomie-Familie statt eine neue
konkurrierende Charta zu schreiben.

## 5. Branch-, Commit- und Push-Regel

Normalfall:

1. ein Branch pro Block,
2. Contract,
3. Preflight,
4. Umsetzung,
5. Verify,
6. Review-Packet,
7. Commit,
8. Push, sofern ein Remote vorhanden und erreichbar ist,
9. STOPP fuer Review.

Wenn der Contract erst neu gebootstrapped werden muss, wird diese Abweichung im
Review-Packet als Bootstrap-Ausnahme dokumentiert. Ohne Remote wird nicht
so getan, als sei gepusht worden.

## 6. Definition of Done pro Block

Ein Block ist erst fertig, wenn:

1. ein gueltiger Contract existiert,
2. die Falsifikations-Gates belegt sind,
3. `STATE.md` und `docs/SESSION-LOG.md` aktualisiert sind,
4. ein Review-Packet mit echtem Diff existiert,
5. die im Contract verlangten Commands gelaufen sind,
6. Git-Status, Commit und Push-Status ehrlich dokumentiert sind.

## 7. Rueckmeldeformat

```text
BLOCK: BPK-00X - <Titel>
STATUS: GRUEN | ROT
GATES: G1 [ok/fail] G2 [ok/fail] G3 [ok/fail] G4 [ok/fail] G5 [ok/n.a.]
BELEG: <Branch> @ <Commit-SHA oder uncommitted> | Dateien | Diff-Auszug
ANKER: CLAUDE-CONTEXT / SESSION-LOG / STATE aktualisiert? [ok/fail]
OFFEN: <bewusst nicht gemacht + Grund>
NAECHSTER BLOCK: <nur wenn STATUS GRUEN>
```

## 8. Der Merksatz

Nicht das Glaenzende zuerst, sondern das Angefangene zu Ende:
ein Block, ein Beweis, ein sauberer Stopp.
