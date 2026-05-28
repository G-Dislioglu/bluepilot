# MVP Chain Checkpoint After Pre-Live Hardening v0

Datum: 2026-05-28
Status: BP-083 checkpoint

Dieser Checkpoint haelt fest, wo Bluepilot nach der lokalen Pre-Live-Haertung steht.

## Lokale MVP-Kette

Aktuell ist diese Kette lokal reviewbar:

```text
Idea
-> Phase Scanner
-> Scope Resolver
-> Builder Task Contract Candidate
-> Human Gate Candidate
-> Approval Readiness Candidate
-> Auth/Persistence Readiness Candidate
-> Builder Task Create Readiness Candidate
-> Live Builder Adapter Readiness Candidate
-> Pre-Live Hardening Fixtures
```

Jede Stufe bleibt lokal, deterministisch und fixture-getestet.

## Was jetzt lokal abgedeckt ist

Die Live Builder Adapter Readiness Candidate Coverage Map deckt lokal ab:

- vorbereitete Readiness,
- Human-Review-Readiness-Notes,
- non-prepared Builder Task Create Readiness,
- Live Builder Target / Auth / Secret / Persistence / Network Request,
- fehlende Pflichtfelder,
- CLI-Fehler fuer fehlenden oder unlesbaren Input,
- `builder_adapter_mode` ungleich `none`,
- `task_create_effect` ungleich `none`,
- `execute_effect` ungleich `none`,
- `builder_task_create_allowed: true`,
- `builder_execute_allowed: true`,
- `live_builder_call_allowed: true`,
- fehlendes `target_repo`.

Aktuelle Abdeckung steht in:

- `docs/LIVE_BUILDER_ADAPTER_READINESS_CANDIDATE_FIXTURE_COVERAGE_v0.md`

## Was die lokale Haertung beweist

Die lokale Haertung beweist:

- Live Builder bleibt trotz Readiness-Huelle blockiert,
- Network-Effekte bleiben `none`,
- Task Create bleibt blockiert,
- Execute bleibt blockiert,
- gefaehrliche True-Flags werden auf blockierte Outputs gemappt,
- fehlende Pflichtfelder werden sichtbar blockiert,
- CLI-Fehler liefern keinen scheinbar erfolgreichen Output,
- die gemeinsame Review Suite prueft die neue Haertung.

## Was weiterhin blockiert bleibt

Weiterhin nicht erlaubt:

- Live Builder Calls,
- echter Builder Task Create,
- Builder Execute,
- Builder Approve,
- Builder Push,
- Deploy,
- echte Approval-Wirkung,
- Human Approval Recording,
- Auth-/Identity-Implementierung,
- Identity Provider,
- Secrets,
- DB oder Persistenz,
- Ziel-Datei-Writes,
- UI-Approval-Flows.

## Keine bekannte lokale Fixture-Luecke

Nach BP-081 und BP-082 blockiert keine bekannte lokale Fixture-Luecke den Checkpoint.

Das ist keine Live-Freigabe.

Live-Naehe bleibt trotzdem blockiert, weil dafuer separate Entscheidungen fehlen:

- Auth-Posture,
- Secret-Quelle,
- Approval-Record-Persistenz,
- Human-Gate-Identitaet,
- Evidence Mapping fuer echte Builder-Responses,
- Zielumgebung,
- Entscheidung zur Wiederverwendung der alten read-only Probe-Linie.

## Naechste nicht wegstreichbare Grenze

Der naechste sichere Schritt ist nicht Live Builder.

Der naechste sichere Schritt ist:

```text
Pre-Live Hardening -> Live Readiness Boundary Decision
```

Diese Entscheidung muss klaeren, ob Bluepilot als naechstes:

- die alte read-only Probe-Linie weiter haertet,
- eine neue Live-Readiness-Candidate-Huelle definiert,
- oder zuerst Auth/Secret/Persistence/Approval als separate Contract-Linien braucht.

## BP-084 Empfehlung

BP-084 sollte eine Live Readiness Boundary Decision sein.

Erlaubt:

- lokales Entscheidungsdokument,
- Vergleich alte read-only Probe-Linie vs. neue Readiness-Candidate-Linie,
- Liste der noch fehlenden Contracts,
- klare Nicht-Ziele.

Nicht erlaubt:

- Builder live aufrufen,
- Builder Task Create bauen,
- Builder Adapter konfigurieren,
- Auth implementieren,
- Secrets einfuehren,
- DB/Persistenz einfuehren,
- Approval speichern,
- Execute / Approve / Push / Deploy bauen,
- UI bauen.

## Review-Kriterium fuer den naechsten Block

Der naechste Block ist erfolgreich, wenn ein Reviewer beantworten kann:

1. Welche Linie ist vor Live-Naehe die richtige: alte read-only Probe oder neue Readiness-Candidate-Huelle?
2. Welche Contracts fehlen vor jedem Live-Read?
3. Warum bleibt Task Create weiterhin blockiert?
4. Warum bleiben Auth, Secrets und Persistence getrennte Linien?
5. Warum darf noch kein Network-Effekt passieren?
