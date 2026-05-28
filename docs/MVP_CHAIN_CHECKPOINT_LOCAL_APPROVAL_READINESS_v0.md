# MVP Chain Checkpoint Through Local Approval Readiness v0

Datum: 2026-05-28
Status: BP-061 checkpoint

Dieser Checkpoint haelt fest, wo Bluepilot nach der lokalen Approval-Readiness-Candidate-Stufe steht.

## Lokale MVP-Kette

Aktuell ist diese Kette lokal reviewbar:

```text
Idea
-> Phase Scanner
-> Scope Resolver
-> Builder Task Contract Candidate
-> Human Gate Candidate
-> Approval Readiness Candidate
```

Jede Stufe ist lokal, deterministisch und fixture-getestet.

## Was aktuell erledigt ist

Erledigt ist eine lokale Review-Kette mit folgenden Bausteinen:

- Phase Scanner Runtime mit Fixture-, CLI-Fehler-, Output-Invariant- und Coverage-Map-Tests.
- Scope Resolver Mock mit Fixture-, Output-Invariant- und Coverage-Map-Tests.
- Builder Task Candidate Mock mit Fixture-, Output-Invariant- und Coverage-Map-Tests.
- Human Gate Candidate Mock mit Fixture-, Output-Invariant- und Coverage-Map-Tests.
- Approval Readiness Candidate Mock mit Fixture-, Output-Invariant- und Coverage-Map-Tests.
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
- Review- und Blockgruende bleiben sichtbar,
- Auth-/Identity- und Persistenzgrenzen bleiben als offen markiert,
- Task Create und Execute bleiben trotz Kandidatenstatus blockiert,
- Approval bleibt wirkungslos,
- Approval Recording bleibt blockiert.

## Was weiterhin blockiert bleibt

Weiterhin nicht erlaubt:

- echte Approval-Wirkung,
- Human Approval Recording,
- Auth-/Identity-Implementierung,
- DB oder Persistenz,
- Builder Task Create,
- Builder Execute,
- Builder Approve,
- Builder Push,
- Deploy,
- Live Builder Calls,
- Secrets,
- Ziel-Datei-Writes,
- UI-Approval-Flows.

## Aktuelle Coverage-Dokumente

Aktuelle Abdeckung steht in:

- `docs/PHASE_SCANNER_FIXTURE_COVERAGE_v0.md`
- `docs/SCOPE_RESOLVER_FIXTURE_COVERAGE_v0.md`
- `docs/BUILDER_TASK_CANDIDATE_FIXTURE_COVERAGE_v0.md`
- `docs/HUMAN_GATE_CANDIDATE_FIXTURE_COVERAGE_v0.md`
- `docs/APPROVAL_READINESS_CANDIDATE_FIXTURE_COVERAGE_v0.md`

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
Approval Readiness Candidate -> Auth/Persistence Readiness Contract
```

Warum:

- Approval Readiness sagt nur, ob die lokale Review-Huelle bereit aussieht.
- Es gibt noch keine Identitaet des approvenden Menschen.
- Es gibt noch keine Persistenz fuer Approval Records.
- Es gibt noch keine Audit-Regel fuer wirksames Approval.
- Es gibt noch keine Regel, wann ein Approval spaeter Task Create erlauben duerfte.

## BP-062 Empfehlung

BP-062 sollte nur den Auth/Persistence Readiness Contract definieren.

Erlaubt:

- lokales Contract-Dokument,
- Input-/Output-Huelle fuer Auth/Persistence Readiness,
- Regeln fuer Identity Boundary,
- Regeln fuer Persistence Boundary,
- Regeln fuer spaeteren Approval Record,
- Nicht-Ziele und Fail-Verhalten.

Nicht erlaubt:

- Auth implementieren,
- Identity Provider anbinden,
- DB/Persistenz einfuehren,
- Approval speichern,
- Builder Task Create,
- Builder Execute,
- Live Builder Call,
- UI bauen.

## Review-Kriterium fuer den naechsten Block

Der naechste Block ist erfolgreich, wenn ein Reviewer beantworten kann:

1. Welche Approval-Readiness-Felder gehen in Auth/Persistence Readiness?
2. Welche Auth-/Identity-Grenzen bleiben offen?
3. Welche Persistenzgrenzen bleiben offen?
4. Warum bleibt Approval Recording noch blockiert?
5. Warum bleibt Task Create noch blockiert?
