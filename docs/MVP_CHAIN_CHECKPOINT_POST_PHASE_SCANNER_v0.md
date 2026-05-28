# MVP Chain Checkpoint After Phase Scanner v0

Datum: 2026-05-28
Status: BP-043 checkpoint

Dieser Checkpoint haelt fest, wo Bluepilot nach der Phase-Scanner-Haertung steht.

## Aktueller Stand

Phase Scanner ist lokal reviewbar:

- deterministisches CLI-Tool vorhanden,
- Golden-Fixtures fuer aktuelle Decision- und Risiko-Faelle vorhanden,
- Output-Invariant-Test vorhanden,
- CLI-Fehlerpfade getestet,
- Coverage Map vorhanden,
- Coverage-Map-Drift wird lokal geprueft,
- `node tools/test-bluepilot-review-suite.cjs` prueft den gesamten lokalen Review-Pfad.

Aktueller Coverage-Stand:

```text
docs/PHASE_SCANNER_FIXTURE_COVERAGE_v0.md:
Keine aktuell dokumentierte Fixture-Luecke offen.
```

## Was damit erledigt ist

Erledigt ist nur diese MVP-Kettenstelle:

```text
Idea -> Phase Scanner
```

Der Phase Scanner kann lokal entscheiden:

- `allow_single_track`
- `require_human_review`
- `reject`

Er kann seine Entscheidung mit Check-Ergebnissen, Confidence, Stoplight, Evidence-Anforderungen und Human-Gate-Status ausgeben.

## Was noch nicht erledigt ist

Noch nicht erledigt:

- Scope Resolver Ausfuehrung.
- Builder Task Create.
- Builder Execute.
- Builder Observe.
- echtes Evidence Bundle aus Builder.
- Maya Review Surface.
- Human Gate Ausfuehrung.

Noch nicht erlaubt:

- Live Builder Call.
- Auth oder Secret Handling.
- Datenbank oder Persistenz.
- Deploy.
- Execute / Run / Approve / Push.
- Task-Erstellung.

## Naechste nicht wegstreichbare Grenze

Der naechste MVP-Schritt ist nicht Task Create.

Der naechste Schritt ist:

```text
Phase Scanner Output -> Scope Resolver Input Contract
```

Warum:

- Task Create braucht erlaubte Dateigrenzen.
- Execute braucht Scope-Gates vor jedem Write.
- Evidence braucht nachvollziehbaren Scope-Bezug.
- Human Review braucht sichtbare Erklaerung, warum ein Scope erlaubt oder blockiert wurde.

## BP-044 Empfehlung

BP-044 soll nur den Scope Resolver Handoff Contract definieren.

Erlaubt:

- lokales Contract-Dokument,
- Input-/Output-Huelle fuer Scope Resolver,
- Mapping von Phase-Scanner-Feldern auf Scope-Resolver-Felder,
- Fail-Verhalten,
- Mock-/Fixture-Anforderungen fuer spaeter.

Nicht erlaubt:

- Builder live aufrufen,
- Builder `builderScopeResolver.ts` importieren,
- Auth oder Secrets einfuehren,
- DB/Persistenz einfuehren,
- Task Create oder Execute bauen.

## Review-Kriterium fuer den naechsten Block

Der naechste Block ist erfolgreich, wenn ein Reviewer beantworten kann:

1. Welche Phase-Scanner-Felder gehen in den Scope Resolver?
2. Welche Scope-Inputs sind Pflicht?
3. Welche Scope-Outputs sind MVP-pflichtig?
4. Wann wird blockiert?
5. Warum ist noch kein Builder-Task entstanden?
