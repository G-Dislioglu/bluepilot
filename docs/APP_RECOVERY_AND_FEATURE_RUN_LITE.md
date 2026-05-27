# App Recovery and Feature Run Lite v1.1

Layer ueber WLP 0.1b:

```text
LAYER 0 - WLP 0.1b           Task-Sicherheit
LAYER 1 - App Goal Lite       Zielbild (.specify)
LAYER 2 - Recovery Scan       Ist-Zustand aus 4 Quellen
LAYER 3 - Feature Run         Autonom bauen
LAYER 4 - Human UI Gate       Menschenfreundlichkeit
```

## Layer 1 - App Goal Lite

Templates liegen in `.specify/`.

| Datei | Zweck |
|---|---|
| `.specify/.app-goal.md` | Was soll diese App leisten? |
| `.specify/.feature-goals.md` | Was soll jedes Feature erreichen? |
| `.specify/.recovery-scan.md` | Was ist aktuell kaputt? |

Goal-Delta-Regel:

- Codex aendert Goals nicht still.
- Wenn das Goal nicht mehr passt, kommt ein `GOAL_DELTA_PROPOSAL` ins Review Packet.
- Gurcan oder Claude entscheiden.

## Layer 2 - Recovery Scan

Recovery Scan ist read-only. Erst lesen, dann urteilen, nicht gleichzeitig reparieren.

### Quelle 1 - Static Repo Scan

Pruefe:

- Architektur gegen Goal.
- Tote Pfade.
- Unfertige Features.
- Fehlende Fehlerbehandlung.
- Provider ohne Fallback.
- ENV ohne Check.

Output-Klassen: `BROKEN`, `INCOMPLETE`, `INCONSISTENT`, `DEBT`.

### Quelle 2 - Runtime Smoke Scan

`SAFE_ENV` ist Pflicht:

- Keine echten API-Keys.
- Keine echten Orders, Payments oder Mails.
- Worker und Cron deaktiviert.
- Test-DB oder read-only DB.
- Externe Calls gemockt oder blockiert.

Beispielchecks:

```bash
npm run build
npm run test
curl localhost:PORT/health
```

Logs duerfen nur gelesen werden, wenn sie keine Secrets enthalten.

### Quelle 3 - Playwright Flow Scan

Pruefe:

- Seite laedt.
- Navigation funktioniert.
- Primaer-Flow ist erreichbar.
- Screenshots sind verwertbar.
- Console-Errors sind dokumentiert.

### Quelle 4 - Vision/UI Screenshot Scan

Vision-KI bewertet nach Human UI Gate. Sie ist Auditor, nicht Wahrheit.

### Recovery Scan Output

```markdown
## RECOVERY SCAN RESULT

### BROKEN | INCOMPLETE | INCONSISTENT | DEBT | UI_ISSUES

### RUNTIME_CHECKS
| Check | Ergebnis | Evidence |
|---|---|---|

### TOP 3 KRITISCHSTE FINDINGS

### RECOMMENDATION
```

## Layer 3 - Feature Run Protocol

Codex arbeitet autonom bis `FEATURE COMPLETE` oder `HARD STOP`.

Feature Contract:

```text
FEATURE_ID:
APP:
FEATURE_GOAL: [1-2 Saetze]
ALLOWED_AREAS:
FORBIDDEN_AREAS:
ACCEPTANCE:
- [ ]
REQUIRED_CHECKS:
- node tools/verify-task-lock.cjs TASK_ID --verify
HARD_STOP:
- FORBIDDEN noetig
- Auth-Risiko
- Goal unklar
- Scope-Erweiterung
```

Autonomie-Regeln:

1. Tasks selbst aufteilen.
2. Durcharbeiten ohne Pause.
3. Nicht fragen ausser bei `HARD STOP`.
4. Goal nicht still aendern.

Completion Signal:

```markdown
## FEATURE COMPLETE - [ID]

### Tasks
### Acceptance Check
### Evidence
### Drift
### Human UI Check
### Risks
### Goal Delta Proposal
### Self Score
### Decision
```

### Research Scout Optional

Vor einem Feature Run darf ein kurzer Research Scout laufen:

- maximal 20 Minuten,
- maximal 5-8 Quellen,
- Output: `adopt`, `adapt`, `ignore`.

Adoption Gate:

- Lizenz ok?
- Aktiv gewartet?
- Passt zum Goal?
- Kleiner als Eigenbau?
- Sicher?

## Layer 4 - Human UI Gate

### Ziel-Personas

| Persona | Einsatz |
|---|---|
| `beginner_user` | Hauptscreen Pflicht |
| `operator_user` | Hauptscreen Pflicht |
| `power_user` | Detailbereiche |

Systembegriffe wie Workcell, Scout oder Runtime gehoeren nicht in den Hauptscreen.

### 5 Grundfragen

Ein Mensch muss ohne Erklaerung beantworten koennen:

1. Wo bin ich?
2. Was ist wichtig?
3. Was kann ich tun?
4. Was passiert danach?
5. Wie komme ich zurueck?

### 8 Kriterien

1. First-Glance-Test: Zweck in 5 Sekunden?
2. One Primary Action: genau eine Hauptaktion?
3. User Language: Nutzersprache statt Systembegriffe?
4. Flow vor Architektur: Nutzerfluss vor Systemstruktur?
5. Error Recovery: Zurueck, abbrechen, neu versuchen?
6. Visual Hierarchy: wichtig vs. sekundaer vs. Debug?
7. Accessibility Basic: Tastatur, Labels, Kontrast, Fehlertext?
8. Cognitive Load: Hauptscreen hilft bei Entscheidung?

### Human UI Review Packet

```markdown
## HUMAN UI REVIEW

TARGET_PERSONA: [beginner_user / operator_user / power_user]

1. First-Glance-Test: PASS/FAIL + Begruendung
2. One Primary Action: PASS/FAIL + Begruendung
3. User Language: PASS/FAIL + Begruendung
4. Flow vor Architektur: PASS/FAIL + Begruendung
5. Error Recovery: PASS/FAIL + Begruendung
6. Visual Hierarchy: PASS/FAIL + Begruendung
7. Accessibility Basic: PASS/FAIL + Begruendung
8. Cognitive Load: PASS/FAIL + Begruendung

Screenshots: before / after / playwright_flow
Decision: HUMAN_READY / NEEDS_UI_REWORK / BLOCKED
```

Auto-`NEEDS_UI_REWORK`:

- kein klarer naechster Schritt,
- mehr als eine Primaeraktion,
- Systembegriffe im Hauptscreen,
- First-Glance-Test fail.
