# Pre-Live Hardening Decision v0

Datum: 2026-05-28
Status: BP-077 governance decision

Diese Entscheidung legt fest, was lokal gehaertet werden muss, bevor Bluepilot ueber irgendeinen echten Live-Builder-Adapter-Schritt nachdenken darf.

Sie implementiert keinen Live Builder Call, keine Auth, keine Secrets, keine Persistenz und keine Builder-Mutation.

## Entscheidung

Der naechste Schritt nach Live Builder Adapter Readiness ist nicht Live Builder.

Der naechste Schritt ist lokale Haertung:

```text
Live Builder Adapter Readiness Candidate -> Pre-Live Hardening
```

Live Builder bleibt blockiert, bis die unten genannten lokalen Gates durch separate WLP-Tasks erledigt und reviewed sind.

## Warum diese Grenze noetig ist

Die lokale Kette beweist aktuell:

- Readiness-Huellen koennen deterministisch vorbereitet oder blockiert werden.
- Task Create bleibt blockiert.
- Execute bleibt blockiert.
- Live Builder Calls bleiben blockiert.
- Network-Effekte bleiben blockiert.
- Auth, Secrets, DB/Persistenz und Approval Recording bleiben blockiert.

Die lokale Kette beweist noch nicht:

- dass eine Live-Builder-Zielumgebung sicher benannt ist,
- dass Auth sicher ausserhalb des Repos geloest ist,
- dass Secrets nie geloggt oder committed werden,
- dass Fehlerformen fuer Live-Nahe stabil genug sind,
- dass Human Approval wirksam, auditierbar und persistiert ist,
- dass Evidence aus einem echten Builder-System vertrauenswuerdig gemappt werden kann,
- dass Task Create oder Execute sicher erlaubt werden duerfen.

## Pflicht-Haertungen vor Live-Naehe

Vor jedem Live-Builder-Adapter-Implementierungstask muessen mindestens diese lokalen Haertungen existieren:

1. Missing-Required-Fields Fixtures fuer Live Builder Adapter Readiness.
2. Block-Fixtures fuer `builder_adapter_mode` ungleich `none`.
3. Block-Fixtures fuer `task_create_effect` ungleich `none`.
4. Block-Fixtures fuer `execute_effect` ungleich `none`.
5. Block-Fixtures fuer `builder_task_create_allowed: true`.
6. Block-Fixtures fuer `builder_execute_allowed: true`.
7. Block-Fixtures fuer `live_builder_call_allowed: true`.
8. Block-Fixtures fuer fehlendes oder unklares `target_repo`.
9. CLI-Fehlerformat fuer fehlende oder unlesbare Inputs.
10. Review-Suite-Eintrag fuer alle neuen Härtungs-Fixtures.

Diese Haertungen bleiben lokal. Sie duerfen keine URL fetchen, keine Secrets lesen und keine externen Systeme beruehren.

## Promotion-Blocker

Live Builder bleibt blockiert, solange einer dieser Punkte offen ist:

- keine echte Auth-Posture als separater Contract,
- keine Secret-Quelle als separater Contract,
- keine Approval-Record-Persistenz als separater Contract,
- keine Human-Gate-Entscheidung mit wirksamer Identitaet,
- kein klares Evidence-Mapping fuer echte Builder-Responses,
- keine Entscheidung, ob die alte read-only Probe-Linie wiederverwendet wird,
- offene Fixture-Gaps aus `docs/LIVE_BUILDER_ADAPTER_READINESS_CANDIDATE_FIXTURE_COVERAGE_v0.md`,
- fehlende Review-Packets fuer lokale Haertungen.

## Erlaubte naechste BP-Schritte

Erlaubt als kleine lokale Folgeaufgaben:

| BP | Zweck | Art |
|---|---|---|
| BP-078 | Missing-Required-Fields und CLI-Fehler-Tests fuer Live Builder Adapter Readiness Candidate | code_task |
| BP-079 | zusaetzliche Block-Fixtures fuer Adapter Mode, Task Create, Execute und Live Flag | code_task |
| BP-080 | Coverage Map und Review Suite nach den Haertungen aktualisieren | code_task |
| BP-081 | naechster lokaler Checkpoint nach Pre-Live Hardening | governance_task |

Diese Schritte duerfen nur lokal arbeiten.

## Weiterhin nicht erlaubt

Nicht erlaubt:

- Builder live aufrufen,
- Builder Task Create bauen,
- Builder Execute bauen,
- Builder Approve, Push oder Deploy bauen,
- Builder Adapter konfigurieren,
- echte Auth implementieren,
- Secrets einfuehren oder lesen,
- DB oder Persistenz einfuehren,
- Approval speichern,
- Approval Record erlauben,
- Ziel-Dateien schreiben,
- UI bauen.

## Fail-Verhalten

Wenn ein Folgeblock Live Builder, Auth, Secrets, DB/Persistenz, Task Create oder Execute braucht:

```text
HARD STOP - Pre-Live Hardening verletzt
```

Wenn ein Folgeblock nur lokale Fixtures oder lokale Tests ergaenzt:

```text
weiter mit WLP-Contract, Preflight, Build, Verify, Review Packet
```

Wenn eine neue Luecke entdeckt wird:

```text
Coverage Map aktualisieren und als Blocker benennen, nicht still als erledigt ausgeben
```

## Review-Kriterium

Ein Reviewer muss nach BP-077 beantworten koennen:

1. Warum ist Live Builder weiterhin blockiert?
2. Welche lokalen Haertungs-Fixtures fehlen?
3. Welche Promotion-Blocker verhindern Live-Naehe?
4. Welche Folge-BPs sind erlaubt?
5. Welche Folge-BPs waeren ein Hard Stop?
