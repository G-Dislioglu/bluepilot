# Workcell Lock Protocol (WLP) v0.1b

Status: Bootstrap Candidate
Gilt fuer: Bluepilot, Soulmatch, Maya Core, AICOS - alle Codex-Tasks
AICOS Referenz: sol-cross-057, sol-dev-006, sol-cross-058, err-arch-context-attraction-without-repulsion

## 9 Kernregeln

```text
REGEL 1  Kein Task ohne Contract (JSON, maschinenverbindlich).
REGEL 2  FORBIDDEN_FILES ist ein binaeres Gate: Verletzung = HARD STOP.
REGEL 3  ALLOWED_FILES bestimmt den Scope. Outside = Drift. Behandlung je mode.
REGEL 4  Keine Architektur-Erweiterung ausserhalb des Task-Ziels.
REGEL 5  Keine Opportunitaetsfixes. Keine stillen Refactors.
REGEL 6  Kein Commit, kein Push, ausser ausdruecklich im Contract erlaubt.
REGEL 7  Review Packet mit typisierter Evidence, kein Freitext "fertig".
REGEL 8  Self-Score ist Signal, kein Gate. Das Gate ist Gurcan oder VAL-K2.
REGEL 9  Jeder Contract hat einen definierten Reuse-Pfad. Sonst ungueltig.
```

## 5-Phasen-Flow

```text
PHASE 1 - PRE-LOCK
  Contract ausfuellen (JSON).
  Prior-Task REUSE_NOTE lesen (PRIOR_TASK_FINDINGS).
  Dann: Prompt an Codex.

PHASE 2 - PREFLIGHT (vor Build)
  node tools/verify-task-lock.cjs TASK_ID --preflight
  Working Tree muss clean sein. Sonst HARD STOP.

PHASE 3 - BUILD (Split-Role)
  EXECUTOR: Code nach Contract bauen. Nur ALLOWED_FILES.
  AUDITOR: Adversarisch pruefen nach Fertigstellung.

PHASE 4 - MACHINE VERIFICATION
  node tools/verify-task-lock.cjs TASK_ID --verify
  Evidence je task_type ausfuehren.

PHASE 5 - REVIEW PACKET + DECISION GATE
  Typisierte Evidence. Self-Score. COMPLETE / REWORK / STOP.
  Finales Gate: Gurcan oder VAL-K2.
```

## STOP-Regeln

```text
FORBIDDEN violation         -> HARD STOP (immer, jeder mode)
Outside ALLOWED:
  mode: critical            -> HARD STOP
  mode: dual-control        -> HARD STOP
  mode: standard            -> REWORK
  mode: lite                -> REWORK
```

## Mode-Tabelle

| Mode | Wann | Drift-Behandlung |
|---|---|---|
| lite | Routine-Fix, weniger als 3 Dateien | Outside ALLOWED -> REWORK |
| standard | Normaler Feature-Task | Outside ALLOWED -> REWORK |
| critical | DB-Schema, Auth, Core | Outside ALLOWED -> HARD STOP |
| dual-control | Planner + Auditor separat | Outside ALLOWED -> HARD STOP |

## Evidence je task_type

| task_type | Pflicht |
|---|---|
| code_task | test_result ODER runtime_check |
| doc_task | content_check ODER link_check |
| ui_task | screenshot_check + playwright_flow + human_ui_review |
| config_task | diff_ref + build_result/lint_result |
| governance_task | diff_ref + content_check |

## Split-Role Mechanik

EXECUTOR: Baut nach Contract. Nur ALLOWED_FILES.

AUDITOR (nach Fertigstellung, adversarisch):

- Was koennte hier falsch sein?
- Habe ich wirklich nur ALLOWED_FILES veraendert?
- Sind alle DoD-Punkte bewiesen, nicht nur behauptet?
- Welche Claims kann ich nicht durch Evidence belegen?
- Welche Assumptions habe ich nicht geprueft?

Der Auditor gibt keine neue Richtung. Er prueft.

## Verifier-Verwendung

```bash
# Vor dem Task (Working Tree Check):
node tools/verify-task-lock.cjs TASK_ID --preflight

# Nach dem Task (Drift Check):
node tools/verify-task-lock.cjs TASK_ID --verify

# Mit Custom Contract-Pfad:
node tools/verify-task-lock.cjs TASK_ID --verify --contract contracts/custom.json
```

Exit Codes:

- 0 = clean
- 1 = REWORK
- 2 = HARD STOP
