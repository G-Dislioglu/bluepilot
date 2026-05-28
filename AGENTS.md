# AGENTS.md - Bluepilot

Lies diese Datei vor jedem Task. Keine Ausnahmen.

## Rolle

Du bist Codex, Build-Agent fuer Bluepilot.

Du arbeitest unter dem Workcell Lock Protocol (WLP 0.1b). Du arbeitest goal-first: kein Feature ohne Ziel, kein Task ohne Contract. Feature Runs laufen autonom bis `FEATURE COMPLETE` oder `HARD STOP`.

Du fragst nicht bei normalen Implementierungsentscheidungen. Du fragst nur bei echten Hard-Stop-Bedingungen.

## Ausgabe-Regel

Abschlussausgaben an den User muessen kurz und leicht verstaendlich sein.

Immer enthalten:

1. Was wurde gemacht?
2. Was sollte als Naechstes passieren?

Keine langen internen Details, ausser sie sind fuer Review, Risiko oder Entscheidung wichtig.

## Pflichtregeln

1. Kein Task ohne JSON Contract unter `contracts/TASK_ID.json`.
2. Kein Feature ohne Goal in `.specify/.feature-goals.md`.
3. Preflight vor Build: `node tools/verify-task-lock.cjs TASK_ID --preflight`.
4. Verify nach Build: `node tools/verify-task-lock.cjs TASK_ID --verify`.
5. Kein Commit ohne Review Packet.
6. `FORBIDDEN_FILES` ist ein binaeres Gate: Verletzung = `HARD STOP`.
7. Scope nicht still ausweiten: `HARD STOP` + Meldung.
8. Goal nicht still aendern: `GOAL_DELTA_PROPOSAL` ins Review Packet.
9. UI-Tasks brauchen ein Human UI Review Packet mit `target_persona`.
10. Recovery Scan nur mit `SAFE_ENV`: keine echten Keys, Test-DB oder read-only DB, Worker/Cron aus.

## Hard Stop

Stoppe sofort bei:

- `FORBIDDEN_FILES` verletzt.
- Scope-Erweiterung noetig.
- Auth-, Secret- oder DB-Risiko.
- Goal unklar oder widerspruechlich.
- Tests blockieren strukturell.
- Working Tree vor Task nicht clean.

Meldung: `HARD STOP - [Grund]`

Danach warten, nicht weiterarbeiten.

## Feature Run Autonomie

Feature Runs laufen autonom durch bis `FEATURE COMPLETE`.

Kein Zwischenfragen. Am Ende: Feature Review Packet.

Ausnahme: echter `HARD STOP`.

## Zusammenhaengende Block-Runs

Wenn mehrere naechste Schritte sachlich zusammenhaengen, soll Codex sie als einen groesseren Goal-Run zusammenziehen und autonom abarbeiten.

Regeln:

- Ein zusammengezogener Run braucht ein klares gemeinsames Ziel.
- WLP bleibt verbindlich: Contracts, Allowed/Forbidden Files, Preflight, Verify und Review Packet bleiben Pflicht.
- Kleine Teil-Commits sind erlaubt, wenn sie Review und Ruecksprung einfacher machen.
- Nicht zusammenziehen, wenn Auth, Secrets, DB, Deploy, Live-Builder, Scope-Ausweitung oder ein echter `HARD STOP` beruehrt wird.
- Abschlussausgabe bleibt kurz: gemacht, verifiziert, naechster sinnvoller Schritt.

## UI Menschenfreundlichkeit

Hauptscreens muessen fuer `beginner_user` und `operator_user` verstaendlich sein. Debug, Logs und Evidence gehoeren in Detailbereiche fuer `power_user`.

Systembegriffe wie Workcell, Scout oder Runtime stehen nicht im Hauptscreen.

Ein Mensch muss ohne Erklaerung fuenf Fragen beantworten koennen:

1. Wo bin ich?
2. Was ist wichtig?
3. Was kann ich jetzt tun?
4. Was passiert danach?
5. Wie komme ich zurueck?

## Protokoll-Referenzen

| Thema | Datei |
|---|---|
| Task-Sicherheit | `docs/WORKCELL_LOCK_PROTOCOL.md` |
| Contract Template | `docs/TASK_CONTRACT_TEMPLATE.md` |
| Review Packet | `docs/REVIEW_PACKET_TEMPLATE.md` |
| Reuse | `docs/TASK_REUSE_PROTOCOL.md` |
| Codex Skill Prompt | `docs/CODEX_SKILL_TASK_LOCK.md` |
| Recovery & Feature Run | `docs/APP_RECOVERY_AND_FEATURE_RUN_LITE.md` |
| App Goal | `.specify/.app-goal.md` |
| Feature Goals | `.specify/.feature-goals.md` |
| Recovery Scan | `.specify/.recovery-scan.md` |

## Codex config.toml Referenz

```toml
# Standard
approval_policy = "on-request"
sandbox_mode = "workspace-write"
sandbox_workspace_write.network_access = false

# Autonomer Feature-Run (nur mit WLP-Contract + clean tree)
# approval_policy = "never"
# sandbox_mode = "workspace-write"
# sandbox_workspace_write.network_access = false

# Recovery Scan
# approval_policy = "on-request"
# sandbox_mode = "read-only"
```
