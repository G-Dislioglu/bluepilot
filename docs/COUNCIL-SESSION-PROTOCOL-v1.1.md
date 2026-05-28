# Council Session Protocol v1.1
# Bluepilot - Maya-orchestrated multi-agent coordination

Status: governance spec - ready for BP-C1 implementation
Erstellt: 2026-05-28 (BP-086)
Basiert auf: externer AI/User-Spezifikation vom 2026-05-28, angepasst an Bluepilot-Konventionen

Aenderungen gegenueber v1.0:
- NEU: Idempotency via status_revision + task_attempt (kein Timestamp)
- NEU: HARD STOP Recovery Flow (expliziter Resume)
- NEU: Context Delta Directive (Maya pushed Kontext-Updates)
- NEU: directive_cursor in agents/agent-N.json (kein acknowledged_by_agent in session.json)
- ANGEPASST: review-packets/ statt contracts/reviews/
- ANGEPASST: ASCII-sicheres Encoding

## Verzeichnisstruktur

```text
.bluepilot/
  council/
    session.json          <- Maya schreibt (Directives, Task-Queue, Status)
    agents/
      agent-1.json        <- nur Agent 1 schreibt
      agent-2.json        <- nur Agent 2 schreibt
    events.jsonl          <- append-only, alle schreiben, nie ueberschreiben
    context-snapshot.json <- Maya laedt einmal, read-only fuer Agents
    dedup.json            <- Idempotency-Register, Maya schreibt
```

Regel: Jede Datei hat genau einen Schreiber.

- `session.json` gehoert Maya.
- `agents/agent-N.json` gehoert Agent N.
- `events.jsonl` ist append-only fuer alle.
- `dedup.json` gehoert Maya.

## 1. Grundprinzip: kein Polling

Agents schreiben ihre Statusdatei. Maya reagiert via File-Watch in unter 100ms.
Kein Agent fragt aktiv in einem Zeitintervall nach Nachrichten. Kein 3-Minuten-Loop.

```text
Agent schreibt agents/agent-1.json -> Watcher feuert Event -> Maya reagiert sofort
```

## 2. session.json - Mayas Datei

Maya ist die einzige Instanz, die `session.json` schreibt. Agents lesen sie, schreiben nie hinein.

```json
{
  "session_id": "cs-20260528-001",
  "opened_at": "2026-05-28T10:00:00.000Z",
  "closed_at": null,
  "goal_ref": ".specify/.app-goal.md",
  "status": "active",
  "agents_registered": ["agent-1", "agent-2"],
  "task_queue": [
    {
      "task_id": "TASK_001",
      "title": "Multi-model pool aufbauen",
      "contract_path": "contracts/TASK_001.json",
      "status": "assigned",
      "assigned_to": "agent-1",
      "assigned_at": "2026-05-28T10:01:00.000Z",
      "depends_on": [],
      "priority": 1
    },
    {
      "task_id": "TASK_002",
      "title": "Context broker aufbauen",
      "contract_path": "contracts/TASK_002.json",
      "status": "queued",
      "assigned_to": null,
      "assigned_at": null,
      "depends_on": ["TASK_001"],
      "priority": 2
    }
  ],
  "directives": [
    {
      "directive_id": "dir-001",
      "issued_at": "2026-05-28T10:01:00.000Z",
      "target": "agent-1",
      "type": "assign",
      "payload": {
        "task_id": "TASK_001",
        "contract_path": "contracts/TASK_001.json",
        "aicos_refs": ["sol-dev-006"],
        "context_hint": null
      }
    }
  ],
  "hard_stop_log": [],
  "session_summary": null
}
```

Status-Werte `session.status`:

- `active`: Session laeuft.
- `paused`: Maya hat pausiert, zum Beispiel nach HARD STOP.
- `waiting_human`: User muss entscheiden.
- `complete`: Alle Tasks sind abgeschlossen.
- `failed`: Unbehebbarer HARD STOP.

Status-Werte `task_queue[].status`:

- `queued`: wartet auf Dependency oder freien Agent.
- `assigned`: Agent hat Auftrag.
- `in_progress`: Agent arbeitet.
- `done`: abgeschlossen.
- `rework`: Agent muss wiederholen.
- `hard_stop`: blockiert.
- `skipped`: von Maya explizit uebersprungen.

Hinweis: `acknowledged_by_agent` existiert nicht in `session.json`.
Agents bestaetigen Directives ueber `directive_cursor` in ihrer eigenen Datei.

## 3. agents/agent-N.json - Agent-Datei

Jeder Agent schreibt nur seine eigene Datei.
Atomic write: immer `.tmp` schreiben, dann `rename`; niemals direkt ueberschreiben.

```json
{
  "agent_id": "agent-1",
  "agent_name": "worker-multi-model-pool",
  "registered_at": "2026-05-28T10:00:30.000Z",
  "last_updated": "2026-05-28T10:45:00.000Z",
  "status": "done",
  "status_revision": 3,
  "task_attempt": 1,
  "current_task_id": "TASK_001",
  "directive_cursor": {
    "last_seen_directive_id": "dir-001",
    "last_seen_at": "2026-05-28T10:01:05.000Z"
  },
  "progress": {
    "phase": "verify",
    "percent": 100,
    "last_step": "node tools/verify-task-lock.cjs TASK_001 --verify"
  },
  "result": {
    "outcome": "COMPLETE",
    "self_score": 88,
    "review_packet_path": "review-packets/TASK_001.md",
    "committed_sha": "a3f9c12",
    "key_finding": "Pool-Routing wiederverwendet aus Builder poolState.ts",
    "reuse_note": "TASK_002 kann direkt auf providers.ts aufbauen"
  },
  "blockers": [],
  "message_to_maya": "TASK_001 complete. /api/pool/route ist live."
}
```

Zaehler-Regeln:

- `status_revision`: inkrementiert bei jeder Statusaenderung. Startet bei 0.
  Beispiel: `idle=0`, `assigned=1`, `in_progress=2`, `done=3`.
- `task_attempt`: inkrementiert bei jedem REWORK. Erster Versuch ist 1, nach REWORK 2.
- `directive_cursor`: Agent schreibt seine letzte gesehene Directive. Nie in `session.json`.

Status-Werte `agent.status`:

```text
idle | assigned | in_progress | done | hard_stop | waiting | offline
```

## 4. Idempotency - kein doppeltes Assignment

Problem: Agent schreibt `done` zweimal, zum Beispiel durch Retry oder Crash-Recovery.
Ohne Schutz wuerde Maya denselben Task zweimal vergeben.

Loesung: deterministischer Composite Key ohne Timestamp.

Composite Key:

```text
{session_id}::{agent_id}::{task_id}::{task_attempt}::{event_type}::{status_revision}
```

Beispiele:

```text
cs-20260528-001::agent-1::TASK_001::1::done::3   <- erster Versuch
cs-20260528-001::agent-1::TASK_001::2::done::6   <- nach REWORK
```

`dedup.json`:

```json
{
  "session_id": "cs-20260528-001",
  "processed_events": [
    "cs-20260528-001::agent-1::TASK_001::1::done::3"
  ],
  "last_updated": "2026-05-28T10:45:00.000Z"
}
```

Maya-Logik:

```text
key = buildKey(session_id, agent_id, task_id, task_attempt, status, status_revision)
if key in dedup.processed_events:
  appendEvent('event_deduplicated')
  return  <- kein zweites Assignment
dedup.processed_events.push(key)
writeAtomic(DEDUP_FILE, dedup)
// normale Reaktionslogik
```

Warum kein Timestamp: REWORK innerhalb derselben Minute wuerde faelschlich dedupliziert.
`task_attempt` und `status_revision` sind deterministisch eindeutig.

## 5. Directive-Ack - korrekte Loesung

Falsch in v1.0: `acknowledged_by_agent` in `session.json`.
Das zwingt Agents, `session.json` zu schreiben, und verletzt das Ein-Owner-Prinzip.

Richtig in v1.1: `directive_cursor` in `agents/agent-N.json`.

Agent schreibt nach dem Lesen einer Directive:

```json
"directive_cursor": {
  "last_seen_directive_id": "dir-001",
  "last_seen_at": "2026-05-28T10:01:05.000Z"
}
```

Maya liest `directive_cursor.last_seen_directive_id` und vergleicht mit der hoechsten gesendeten Directive-ID.
Wenn `last_seen >= issued_directive`, gilt die Directive als verarbeitet.
Maya berechnet Ack-Status immer aus dem Agent-Cursor; kein Feld in `session.json`.

## 6. HARD STOP Recovery Flow

Schritt 1 - HARD STOP eingetreten:

```text
session.status = 'paused'
session.hard_stop_log.push({ ts, agent, task_id, reason })
Broadcast-Directive an alle Agents: type='broadcast', action='pause_and_wait'
Notification an User (Remote Control ist BP-C5; bis dahin: console.error)
```

Schritt 2 - Entscheidung als Directive in `session.json`:

```json
{ "type": "hard_stop_resolution", "decision": "skip_task", "task_id": "TASK_003" }
```

```json
{
  "type": "hard_stop_resolution",
  "decision": "rework_task",
  "task_id": "TASK_003",
  "assigned_to": "agent-1",
  "context_hint": "Fehler lag in falscher Datei"
}
```

```json
{ "type": "hard_stop_resolution", "decision": "abort_session" }
```

Schritt 3 - Maya verarbeitet:

- `skip_task`: `task.status='skipped'`, `session.status='active'`, weiter.
- `rework_task`: `task.status='rework'`, `agent.status='assigned'`, neuer Assign-Directive, `session.status='active'`.
- `abort_session`: `session.status='failed'`, Broadcast `session_aborted` an alle.

## 7. REWORK Flow

Maya oder Auditor entscheidet: Task nicht akzeptabel, wiederholen.

Agent-Status-Reset:

```text
task.status = 'rework'
agent.status = 'assigned'
agent.result = null
agent.task_attempt += 1
agent.status_revision += 1
agent.progress = { phase: 'preflight', percent: 0, last_step: 'rework triggered' }
```

Neuer Assign-Directive mit `context_hint`, der erklaert, was falsch war.

Dedup bei REWORK: `task_attempt` ist hoeher, also entsteht ein neuer Composite Key.
Der neue `done`-Event nach REWORK hat einen anderen `task_attempt` und/oder `status_revision`.

## 8. Context Delta Directive

Maya pushed Kontext-Updates wenn:

- Abhaengigkeit aufgeloest wurde und fuer wartende Agents relevant ist.
- Agent hat `reuse_note` hinterlassen.
- AICOS-Card wurde durch Task-Run als relevant identifiziert.
- Context Broker meldet Architektur-Update.

Format:

```json
{
  "directive_id": "dir-delta-001",
  "issued_at": "2026-05-28T11:00:00.000Z",
  "target": "agent-2",
  "type": "context_delta",
  "payload": {
    "delta_reason": "TASK_001 reuse note",
    "additions": [
      {
        "type": "reuse_note",
        "content": "Pool-Router ist live unter /api/pool/route",
        "source_task": "TASK_001",
        "source_agent": "agent-1"
      }
    ],
    "removals": []
  }
}
```

Agent liest via `readNextDirective()` vor jedem Build-Schritt.
Findet er `context_delta`, ruft er `acknowledgeDirective()` auf und integriert Additions.

## 9. events.jsonl - Append-only Log

Jeder Eintrag ist eine JSON-Zeile. Nie ueberschreiben.

```jsonl
{"ts":"...","from":"maya","type":"session_opened","payload":{}}
{"ts":"...","from":"maya","type":"task_assigned","payload":{"task_id":"TASK_001","to":"agent-1"}}
{"ts":"...","from":"agent-1","type":"directive_acknowledged","payload":{"directive_id":"dir-001"}}
{"ts":"...","from":"agent-1","type":"task_started","payload":{"task_id":"TASK_001"}}
{"ts":"...","from":"agent-1","type":"task_done","payload":{"task_id":"TASK_001","score":88}}
{"ts":"...","from":"maya","type":"event_deduplicated","payload":{"key":"...","ignored":true}}
```

Event-Typen:

```text
session_opened | session_closed | task_assigned | task_started | task_done
task_hard_stop | task_rework | directive_acknowledged | broadcast
event_deduplicated | hard_stop_resolved | context_delta_pushed | agent_registered
```

## 10. Maya Watcher - Pseudocode

Vollstaendige Implementierung: BP-C1.

```text
watch AGENTS_DIR with await-write-finish
on agent file change:
  agent = readAgent(agentId)
  session = readSession()
  dedup = readDedup()

  key = buildKey(
    session.session_id,
    agent.agent_id,
    agent.current_task_id,
    agent.task_attempt,
    agent.status,
    agent.status_revision
  )

  if key in dedup.processed_events:
    appendEvent('maya', 'event_deduplicated', { key })
    return

  dedup.processed_events.push(key)
  writeAtomic(DEDUP_FILE, dedup)

  if agent.status == 'done':
    mark task done
    resolve dependencies
    assign next task if available
    push context delta if reuse_note exists
    close session if all tasks done

  if agent.status == 'hard_stop':
    pause session
    broadcast to all agents
    notify user
```

## 11. Agent Client - Pflicht-Calls

Implementierung in BP-C1:

```text
reportStarted(agentId, taskId)
acknowledgeDirective(agentId, dirId)
reportDone(agentId, taskId, result)
reportHardStop(agentId, taskId, reason)
readNextDirective(agentId)
```

Atomic write Pflicht:

```text
writeAtomic(filePath, data):
  tmp = filePath + '.tmp'
  write tmp
  rename tmp -> filePath
```

## 12. Startup-Sequenz

```text
1. User oder Maya schreibt session.json mit Task-Queue.
2. Context Broker schreibt context-snapshot.json.
3. maya-council-watcher startet.
4. Codex Agents starten und registrieren sich in agents/agent-N.json mit status idle.
5. Maya sendet initiale Directives fuer verfuegbare Tasks.
6. Agents lesen Directives, schreiben directive_cursor und starten Tasks.
7. Maya reagiert auf jeden Agent-Update in unter 100ms.
8. Session schliesst, wenn alle Tasks done sind oder abort_session eintritt.
```

## 13. Vergleich Mailbox vs Council Session

| | Mailbox (alt) | Council Session v1.1 |
|---|---|---|
| Latenz | 0-3 Minuten | unter 100ms |
| Idempotency | keine | status_revision + task_attempt |
| HARD STOP Recovery | undefiniert | 3-Schritt-Flow |
| Context Updates | kein Mechanismus | Context Delta Directive |
| REWORK | undefiniert | task_attempt inkrementiert |
| Race Conditions | moeglich | ausgeschlossen durch Owner-Regel |
| Debugging | Logs suchen | events.jsonl vollstaendige History |

## 14. WLP-Integration

- `reportDone` setzt voraus, dass `verify-task-lock --verify` gruen war.
- `review_packet_path` in `agent.result` zeigt auf `review-packets/TASK_ID.md`.
- HARD STOP setzt `session.status='paused'`. Keine neuen Assignments bis Resume.
- `dedup.json` ist Teil der Evidence: Maya kann beweisen, dass kein doppeltes Assignment stattgefunden hat.
- Session-Log-Eintrag ist Pflicht nach Session-Close.

## 15. Grenzen fuer BP-C1

BP-C1 darf diese Spec implementierungsnah verwenden, aber nur unter eigenem WLP-Contract.

BP-C1 darf nicht:

- BP-C2-Module starten,
- mehr als die im BP-C1-Contract erlaubte Agentenzahl orchestrieren,
- UI bauen,
- Auth, Secrets oder DB einfuehren,
- AICOS schreiben,
- Soulmatch-Dateien kopieren.
