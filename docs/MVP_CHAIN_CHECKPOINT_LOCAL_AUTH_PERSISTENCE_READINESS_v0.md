# MVP Chain Checkpoint Through Local Auth/Persistence Readiness v0

Datum: 2026-05-28
Status: BP-066 checkpoint

Dieser Checkpoint haelt fest, wo Bluepilot nach der lokalen Auth/Persistence-Readiness-Candidate-Stufe steht.

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
```

Jede Stufe ist lokal, deterministisch und fixture-getestet.

## Was aktuell erledigt ist

Erledigt ist eine lokale Review-Kette mit folgenden Bausteinen:

- Phase Scanner Runtime mit Fixture-, CLI-Fehler-, Output-Invariant- und Coverage-Map-Tests.
- Scope Resolver Mock mit Fixture-, Output-Invariant- und Coverage-Map-Tests.
- Builder Task Candidate Mock mit Fixture-, Output-Invariant- und Coverage-Map-Tests.
- Human Gate Candidate Mock mit Fixture-, Output-Invariant- und Coverage-Map-Tests.
- Approval Readiness Candidate Mock mit Fixture-, Output-Invariant- und Coverage-Map-Tests.
- Auth/Persistence Readiness Candidate Mock mit Fixture-, Output-Invariant- und Coverage-Map-Tests.
- Gemeinsamer Review-Einstieg:

```bash
node tools/test-bluepilot-review-suite.cjs
```

## Was die Kette beweist

Die Kette beweist lokal:

- eine Idee kann deterministisch vorsortiert werden,
- Scope kann lokal begrenzt oder blockiert werden,
- ein Builder-Task-Contract-Kandidat kann lokal beschrieben werden,
- eine Human-Gate-Review-Huelle kann lokal vorbereitet werden,
- Approval Readiness kann lokal vorbereitet oder blockiert werden,
- Auth/Persistence Readiness kann lokal vorbereitet oder blockiert werden,
- Review- und Blockgruende bleiben sichtbar,
- Auth-/Identity- und Persistenz bleiben unkonfiguriert,
- Secrets werden nicht eingefuehrt,
- Task Create und Execute bleiben trotz Kandidatenstatus blockiert,
- Approval bleibt wirkungslos,
- Approval Recording bleibt blockiert.

## Was weiterhin blockiert bleibt

Weiterhin nicht erlaubt:

- echte Approval-Wirkung,
- Human Approval Recording,
- Auth-/Identity-Implementierung,
- Identity Provider,
- Secrets,
- DB oder Persistenz,
- Builder Task Create,
- Builder Execute,
- Builder Approve,
- Builder Push,
- Deploy,
- Live Builder Calls,
- Ziel-Datei-Writes,
- UI-Approval-Flows.

## Aktuelle Coverage-Dokumente

Aktuelle Abdeckung steht in:

- `docs/PHASE_SCANNER_FIXTURE_COVERAGE_v0.md`
- `docs/SCOPE_RESOLVER_FIXTURE_COVERAGE_v0.md`
- `docs/BUILDER_TASK_CANDIDATE_FIXTURE_COVERAGE_v0.md`
- `docs/HUMAN_GATE_CANDIDATE_FIXTURE_COVERAGE_v0.md`
- `docs/APPROVAL_READINESS_CANDIDATE_FIXTURE_COVERAGE_v0.md`
- `docs/AUTH_PERSISTENCE_READINESS_CANDIDATE_FIXTURE_COVERAGE_v0.md`

Diese Dokumente nennen auch offene Fixture-Luecken.

## Aktuelle Review-Suite-Grenze

Die Review Suite ist ein lokaler Sicherheitsnachweis.

Sie beweist nicht:

- Live Builder Bereitschaft,
- echte Auth,
- Identity-Pruefung,
- Secret Handling,
- Datenbankverhalten,
- Persistenzverhalten,
- Deploy-Faehigkeit,
- echte Human Approval,
- Approval Record,
- echte Maya Review UI.

## Naechste nicht wegstreichbare Grenze

Der naechste MVP-Schritt ist nicht Task Create.

Der naechste sichere Schritt ist:

```text
Auth/Persistence Readiness Candidate -> Builder Task Create Readiness Contract
```

Warum:

- Auth/Persistence Readiness beweist nur, dass diese Grenzen lokal sichtbar bleiben.
- Es gibt weiterhin keine echte Identitaet des approvenden Menschen.
- Es gibt weiterhin keine Persistenz fuer Approval Records.
- Es gibt weiterhin keine wirksame Approval-Entscheidung.
- Builder Task Create darf erst dann betrachtet werden, wenn ein eigener Readiness Contract seine Vorbedingungen blockierend beschreibt.

## BP-067 Empfehlung

BP-067 sollte nur den Builder Task Create Readiness Contract definieren.

Erlaubt:

- lokales Contract-Dokument,
- Input-/Output-Huelle fuer Builder Task Create Readiness,
- Regeln fuer Scope, Evidence, Approval, Auth/Persistence und Adaptergrenzen,
- Nicht-Ziele und Fail-Verhalten.

Nicht erlaubt:

- Builder Task Create bauen,
- Builder live aufrufen,
- Auth implementieren,
- Secrets einfuehren,
- DB/Persistenz einfuehren,
- Approval speichern,
- Execute / Approve / Push / Deploy bauen,
- UI bauen.

## Review-Kriterium fuer den naechsten Block

Der naechste Block ist erfolgreich, wenn ein Reviewer beantworten kann:

1. Welche Auth/Persistence-Readiness-Felder gehen in Builder Task Create Readiness?
2. Warum ist Task Create weiterhin blockiert?
3. Welche Auth-/Identity-/Persistence-Grenzen bleiben offen?
4. Welche Approval-/Evidence-Grenzen bleiben offen?
5. Warum darf noch kein Live Builder Call passieren?
