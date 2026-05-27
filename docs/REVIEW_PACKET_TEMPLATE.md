# Review Packet Template

Pflichtausgabe nach jedem Task. Kein Freitext "fertig".

```text
TASK_ID:
TASK_NAME:
TASK_TYPE:    [code_task / doc_task / ui_task / config_task / governance_task]
MODE:         [lite / standard / critical / dual-control]
COMPLETED_AT:

---

1. GOAL (aus Contract)
[Kopie]

---

2. PREFLIGHT CHECK
git status --short vor Task:
-> [CLEAN / DIRTY]

---

3. CHANGED_FILES
git diff --name-only Output:
[Output]

---

4. DOD_CHECK
- [x]/[ ] Punkt 1 | Befehl: ... | Ergebnis: ...
- [x]/[ ] Punkt 2 | Befehl: ... | Ergebnis: ...

---

5. CLAIMS_CHECK
- [x]/[ ] Claim 1: [bewiesen durch: Typ + Referenz]
- [x]/[ ] Claim 2: ...

---

6. ASSUMPTIONS_CHECK
- [x]/[ ] Assumption 1: [validiert / verletzt / unklar]
- [x]/[ ] Assumption 2: ...

---

7. EVIDENCE
| Typ | Befehl / Referenz | Ergebnis |
|---|---|---|
| diff_ref | git diff --name-only | ... |
| test_result | [Befehl] | PASS/FAIL |
| runtime_check | [Befehl] | [Output] |
| build_result | [Befehl] | exit 0/1 |
| content_check | [Befehl] | OK/FAIL |

Pflicht je task_type:
  code_task:       test_result ODER runtime_check
  doc_task:        content_check ODER link_check
  ui_task:         visual_ref ODER screenshot_check
  config_task:     diff_ref + build_result/lint_result
  governance_task: diff_ref + content_check

---

8. DRIFT_CHECK
node tools/verify-task-lock.cjs TASK_ID --verify Output:
[Output]

Forbidden violations: JA/NEIN
Outside ALLOWED: JA/NEIN

---

9. AUDITOR_FINDINGS
[Adversarisch - echte Risiken, keine "alles gut"]
-
-

---

10. SELF_SCORE
Score: [0-100]
Begruendung:
- DoD erfuellt: x/y
- Claims bewiesen: x/y
- Assumptions validiert: x/y
- Drift: keine/minor/major
- Evidence: stark/mittel/schwach

---

11. DECISION
[ ] COMPLETE  Score >= 75, kein Drift, alle Pflicht-Evidence gruen
[ ] REWORK    Score 50-74 oder minor Drift (ausser mode:critical)
[ ] STOP      Score < 50 oder Forbidden-Violation oder mode:critical + Drift

Begruendung: [1-2 Saetze]
Self-Score ist Signal. Finales Gate ist Gurcan oder VAL-K2.

---

12. REUSE_NOTE
Wichtig fuer [naechste TASK_ID]: [Was muss der naechste Task wissen?]

SESSION-LOG-Eintrag:
- Ergebnis: COMPLETE/REWORK/STOP
- Score: [0-100]
- Drift: keine/minor/major
- Key Finding: [1 Satz]
- Reuse durch: [TASK_ID]
```
