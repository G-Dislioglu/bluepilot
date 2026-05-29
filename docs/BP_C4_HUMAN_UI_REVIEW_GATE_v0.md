# BP-C4 Human UI Review Gate v0

Datum: 2026-05-29
Status: BP-107 gate
Phase: BP-C4

## Entscheidung

Human UI Review bleibt ein menschliches Gate.

DOM Smoke, Browser Automation Smoke und Screenshot Check koennen das Gate vorbereiten, aber nicht ersetzen.

## Was zaehlt als Human UI Review?

Human UI Review zaehlt nur, wenn ein Mensch die erzeugte Preview ansieht und eine Entscheidung dokumentiert.

Erforderlich:

- reviewer,
- Datum,
- Preview-Target oder Screenshot-Pfad,
- getestete Persona,
- Entscheidung,
- kurze Begruendung,
- offene Risiken.

## Erlaubte Entscheidungen

- `pass`: Preview ist fuer den aktuellen Zweck ausreichend.
- `pass_with_notes`: Preview ist ausreichend, aber es gibt Hinweise.
- `fail`: Preview ist nicht ausreichend.
- `not_reviewed`: Menschliches Review wurde noch nicht gemacht.

## Mindestfragen

Der Reviewer muss beantworten:

1. Ist klar, worum es in der Preview geht?
2. Sind Summary, Dateien und Risk Flags lesbar?
3. Ist erkennbar, ob ein Human Gate noetig ist?
4. Gibt es offensichtliche Layout- oder Lesbarkeitsprobleme?
5. Fehlt eine Evidence-Stufe, bevor BP-C4 als vollstaendig gelten darf?

## Nicht-Claims

Folgendes ist kein Human UI Review:

- DOM Smoke,
- Browser Automation Smoke,
- Screenshot Check,
- Codex-Zusammenfassung,
- LLM-Begruendung,
- bestandene Test-Suite.

## Human Review Record Template

```md
# BP-C4 Human UI Review Record

Reviewer:
Datum:
Persona: power_user
Preview Target:
Screenshot Path:
Decision: not_reviewed

## Antworten

1. Ist klar, worum es in der Preview geht?
2. Sind Summary, Dateien und Risk Flags lesbar?
3. Ist erkennbar, ob ein Human Gate noetig ist?
4. Gibt es offensichtliche Layout- oder Lesbarkeitsprobleme?
5. Fehlt eine Evidence-Stufe, bevor BP-C4 als vollstaendig gelten darf?

## Notes

## Open Risks
```

## BP-C4 Status-Regel

BP-C4 darf technisch gruen sein, wenn alle maschinellen Evidence-Stufen gruen sind:

- DiffLens,
- HTML Preview,
- DOM Smoke,
- Browser Automation Smoke,
- Screenshot Check.

BP-C4 darf erst vollstaendig gruen sein, wenn Human UI Review dokumentiert ist oder der konkrete Task kein Human UI Review verlangt.

## Naechster Schritt

Ein technischer BP-C4-Checkpoint darf gesetzt werden, wenn er klar sagt:

- technische Evidence gruen,
- Human UI Review offen,
- BP-C5 noch blockiert.
