# Task Contract Template

MD: Human-Template zum Ausfuellen.
JSON: Maschinenverbindliche Quelle, die vom Verifier gelesen wird.
Bei Widerspruch gilt JSON.

## MD Human Template

```text
TASK_ID:        [z.B. BP-001]
TASK_NAME:      [Kurzer Name]
CREATED:        [Datum]
SCOPE:          [Repo / Modul]
MODE:           [lite / standard / critical / dual-control]
TASK_TYPE:      [code_task / doc_task / ui_task / config_task / governance_task]
RISK_CLASS:     [low / medium / high / critical]
IMPACT_CLASS:   [cosmetic / functional / architectural / governance]

GOAL:
[Ein Satz. Nicht mehr.]

ELIGIBLE_CONTEXT:
- docs/WORKCELL_LOCK_PROTOCOL.md
- [weitere erlaubte Dateien / Verzeichnisse]

EXCLUDED_CONTEXT:
- [was Codex nicht sehen darf - binaer]

ALLOWED_FILES:
[Nur picomatch-kompatible Patterns. Keine deutschen Saetze.]
-
-

FORBIDDEN_FILES:
[Binaeres Gate. Nur maschinenlesbare Patterns.]
- api/**
- frontend/**
- .env*
- package.json

SCOPE_OUT:
- [was explizit nicht Teil dieses Tasks ist]

CLAIMS:
[Was Codex behauptet zu liefern - wird gegen Evidence geprueft]
- [ ]
- [ ]

ASSUMPTIONS:
[Was Codex als gegeben annimmt - Auditor prueft diese durch]
- [ ]
- [ ]

DEFINITION_OF_DONE:
[Konkret und testbar - jeder Punkt belegbar]
- [ ]
- [ ]

EVIDENCE_REQUIRED:
[Pflicht-Evidence je task_type - siehe WORKCELL_LOCK_PROTOCOL.md]
-

REQUIRED_COMMANDS:
- node tools/verify-task-lock.cjs TASK_ID --preflight  (vor Task)
- node tools/verify-task-lock.cjs TASK_ID --verify     (nach Task)
- [task-spezifische Test-/Build-Befehle]

STOP_CONDITIONS:
- FORBIDDEN_FILES verletzt
- DoD-Punkt strukturell nicht erfuellbar
- [task-spezifisch]

PRIOR_TASK_FINDINGS:
[REUSE_NOTE aus Review Packet des vorherigen Tasks - leer wenn erster Task]

REUSE_TARGET:
[Mindestens eines Pflicht - sonst Contract ungueltig]
- [ ] Next-Task PRE-LOCK Read (naechste TASK_ID: ___)
- [ ] SESSION-LOG.md Eintrag
- [ ] AICOS Card Kandidat

BASELINE_REF: HEAD
```

## JSON Contract Schema (maschinenverbindlich)

Erstelle `contracts/BP-001.json`:

```json
{
  "task_id": "BP-001",
  "task_name": "Beispiel: DB Schema users table",
  "created": "2026-05-27",
  "scope": "bluepilot/db",
  "mode": "critical",
  "task_type": "code_task",
  "risk_class": "high",
  "impact_class": "architectural",
  "goal": "Ein Satz.",
  "eligible_context": [
    "docs/WORKCELL_LOCK_PROTOCOL.md",
    "db/"
  ],
  "excluded_context": [
    "frontend/**",
    "api/**"
  ],
  "allowed_files": [
    "db/schema.sql",
    "db/migrations/001_create_users.sql"
  ],
  "forbidden_files": [
    "api/**",
    "frontend/**",
    "package.json",
    ".env*"
  ],
  "claims": [
    "users-Tabelle existiert nach Task in der DB"
  ],
  "assumptions": [
    "DB-Verbindung via $DATABASE_URL ist erreichbar"
  ],
  "dod": [
    "psql $DATABASE_URL -c '\\dt users' liefert Ergebnis",
    "git diff --name-only enthaelt nur ALLOWED_FILES"
  ],
  "evidence_required": ["test_result", "runtime_check"],
  "required_commands": [
    "node tools/verify-task-lock.cjs BP-001 --preflight",
    "node tools/verify-task-lock.cjs BP-001 --verify"
  ],
  "stop_conditions": [
    "FORBIDDEN_FILES verletzt"
  ],
  "prior_task_findings": "",
  "reuse_target": ["next_task_pre_lock", "session_log"],
  "baseline_ref": "HEAD"
}
```
