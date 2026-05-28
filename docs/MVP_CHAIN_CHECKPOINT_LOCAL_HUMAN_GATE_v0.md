# MVP Chain Checkpoint Through Local Human Gate v0

Datum: 2026-05-28
Status: BP-056 checkpoint

Dieser Checkpoint haelt fest, wo Bluepilot nach der lokalen Human-Gate-Candidate-Stufe steht.

## Lokale MVP-Kette

Aktuell ist diese Kette lokal reviewbar:

```text
Idea
-> Phase Scanner
-> Scope Resolver
-> Builder Task Contract Candidate
-> Human Gate Candidate
```

Jede Stufe ist lokal, deterministisch und fixture-getestet.

## Was aktuell erledigt ist

Erledigt ist eine lokale Review-Kette mit folgenden Bausteinen:

- Phase Scanner Runtime mit Fixture-, CLI-Fehler-, Output-Invariant- und Coverage-Map-Tests.
- Scope Resolver Mock mit Fixture-, Output-Invariant- und Coverage-Map-Tests.
- Builder Task Candidate Mock mit Fixture-, Output-Invariant- und Coverage-Map-Tests.
- Human Gate Candidate Mock mit Fixture-, Output-Invariant- und Coverage-Map-Tests.
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
- Review- und Blockgruende bleiben sichtbar,
- Task Create und Execute bleiben trotz Kandidatenstatus blockiert,
- Approval bleibt wirkungslos.

## Was weiterhin blockiert bleibt

Weiterhin nicht erlaubt:

- echte Approval-Wirkung,
- Human Approval Recording,
- Builder Task Create,
- Builder Execute,
- Builder Approve,
- Builder Push,
- Deploy,
- Live Builder Calls,
- Auth oder Secrets,
- DB oder Persistenz,
- Ziel-Datei-Writes,
- UI-Approval-Flows.

## Aktuelle Coverage-Dokumente

Aktuelle Abdeckung steht in:

- `docs/PHASE_SCANNER_FIXTURE_COVERAGE_v0.md`
- `docs/SCOPE_RESOLVER_FIXTURE_COVERAGE_v0.md`
- `docs/BUILDER_TASK_CANDIDATE_FIXTURE_COVERAGE_v0.md`
- `docs/HUMAN_GATE_CANDIDATE_FIXTURE_COVERAGE_v0.md`

Diese Dokumente nennen auch offene Fixture-Luecken.

## Aktuelle Review-Suite-Grenze

Die Review Suite ist ein lokaler Sicherheitsnachweis.

Sie beweist nicht:

- Live Builder Bereitschaft,
- echte Auth,
- Secret Handling,
- Datenbankverhalten,
- Deploy-Faehigkeit,
- echte Human Approval,
- echte Maya Review UI.

## Naechste nicht wegstreichbare Grenze

Der naechste MVP-Schritt ist nicht Task Create.

Der naechste sichere Schritt ist:

```text
Human Gate Candidate -> Approval Readiness Contract
```

Warum:

- Human Gate Candidate bereitet nur Review-Fragen vor.
- Es gibt noch keinen wirksamen Approval Record.
- Es gibt noch keine Auth-/Identitaetsgrenze.
- Es gibt noch keine Persistenzgrenze.
- Es gibt noch keine Regel, wann ein Approval spaeter Task Create erlauben duerfte.

## BP-057 Empfehlung

BP-057 sollte nur den Approval Readiness Contract definieren.

Erlaubt:

- lokales Contract-Dokument,
- Input-/Output-Huelle fuer Approval Readiness,
- Regeln fuer `approval_effect`,
- Regeln fuer spaeteren Approval Record,
- Nicht-Ziele und Fail-Verhalten.

Nicht erlaubt:

- echte Approval-Aktion,
- Approval speichern,
- Builder Task Create,
- Builder Execute,
- Live Builder Call,
- Auth oder Secrets,
- DB/Persistenz,
- UI bauen.

## Review-Kriterium fuer den naechsten Block

Der naechste Block ist erfolgreich, wenn ein Reviewer beantworten kann:

1. Welche Human-Gate-Felder gehen in Approval Readiness?
2. Welche Bedingungen muessen vor echter Approval-Wirkung sichtbar sein?
3. Warum bleibt Task Create noch blockiert?
4. Welche Risiken erzwingen weiterhin Human Review oder Block?
5. Warum braucht echte Approval-Wirkung spaeter eigene Auth-/Persistenzentscheidungen?
