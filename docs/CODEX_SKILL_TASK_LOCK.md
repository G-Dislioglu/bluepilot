# Codex Skill: Workcell Lock Protocol v0.1b

Diesen Prompt vor jedem Task an Codex uebergeben.

## Full Prompt (standard / critical / dual-control)

```text
Du arbeitest unter dem WORKCELL LOCK PROTOCOL v0.1b.

SCHRITT 0 - PRIOR TASK FINDINGS

Lese PRIOR_TASK_FINDINGS aus dem Contract.
Wenn nicht leer: Pruefe, ob ein Finding diesen Task betrifft.
Notiere relevante Punkte fuer ASSUMPTIONS_CHECK.

SCHRITT 1 - PREFLIGHT

Fuehre aus:
  node tools/verify-task-lock.cjs TASK_ID --preflight

Wenn exit code != 0:
-> HARD STOP - dirty working tree
-> Nicht weiterarbeiten.

SCHRITT 2 - TASK CONTRACT

[HIER DEN AUSGEFUELLTEN CONTRACT EINFUEGEN]

TASK_ID:
TASK_NAME:
MODE:           [lite / standard / critical / dual-control]
TASK_TYPE:      [code_task / doc_task / ui_task / config_task / governance_task]
RISK_CLASS:     [low / medium / high / critical]
GOAL:
ALLOWED_FILES:
FORBIDDEN_FILES:
CLAIMS:
ASSUMPTIONS:
DOD:
EVIDENCE_REQUIRED:
PRIOR_TASK_FINDINGS:

SCHRITT 3 - ELIGIBILITY GATE

FORBIDDEN_FILES = binaeres Gate.
Wenn du eine FORBIDDEN-Datei brauchst:
-> HARD STOP: "STOP - FORBIDDEN: [Datei] matcht [Pattern]"

SCHRITT 4 - KERNREGELN

1. Nur ALLOWED_FILES (picomatch-Patterns).
2. Keine Architektur-Erweiterung ausserhalb des Ziels.
3. Keine Opportunitaetsfixes. Keine stillen Refactors.
4. Kein Commit / Push ausser explizit erlaubt.
5. Unsicher ob Datei im Scope -> STOP, fragen.

Stop-Regeln:
  FORBIDDEN violated -> HARD STOP (immer)
  Outside ALLOWED + mode critical/dual-control -> HARD STOP
  Outside ALLOWED + mode standard/lite -> REWORK

SCHRITT 5 - SPLIT-ROLE BUILD

EXECUTOR: Baue nach Contract. Nur ALLOWED_FILES.

AUDITOR (danach, adversarisch):
- Was koennte falsch sein?
- Habe ich nur ALLOWED_FILES veraendert?
- Welche Claims kann ich nicht belegen?
- Welche Assumptions habe ich nicht geprueft?

Auditor gibt keine neue Richtung. Er prueft.

SCHRITT 6 - MACHINE VERIFICATION

Fuehre aus:
  git diff --name-only
  node tools/verify-task-lock.cjs TASK_ID --verify
  [alle REQUIRED_COMMANDS aus Contract]

Fuege alle Outputs ins Review Packet ein.
Exit codes: 0=clean, 1=REWORK, 2=HARD STOP

SCHRITT 7 - REVIEW PACKET

Format: siehe docs/REVIEW_PACKET_TEMPLATE.md

Sektionen (alle Pflicht):
1. GOAL | 2. PREFLIGHT CHECK | 3. CHANGED_FILES
4. DOD_CHECK | 5. CLAIMS_CHECK | 6. ASSUMPTIONS_CHECK
7. EVIDENCE | 8. DRIFT_CHECK | 9. AUDITOR_FINDINGS
10. SELF_SCORE | 11. DECISION | 12. REUSE_NOTE

Score: 75-100=COMPLETE, 50-74=REWORK, 0-49=STOP
Finales Gate: immer Gurcan oder VAL-K2.
```

## Kurzversion (nur mode:lite)

```text
WORKCELL LOCK (lite):
TASK_ID:
GOAL: [1 Satz]
ALLOWED: [picomatch-Patterns]
FORBIDDEN: [picomatch-Patterns - binaeres Gate]
DOD: [1-3 pruefbare Punkte]
EVIDENCE: [Pflicht je task_type]
STOP wenn: FORBIDDEN verletzt / DOD nicht erfuellbar / Scope unklar

OUTPUT: Changed files + DOD (PASS/FAIL) + Evidence + DECISION + REUSE_NOTE
```

Kurzversion NICHT fuer mode:critical oder dual-control.
