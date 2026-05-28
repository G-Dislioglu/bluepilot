# Council Kernel Runtime Contract v0

Datum: 2026-05-28
Status: BP-088 minimal runtime contract
Phase: BP-C1 Council Kernel

## Entscheidung

BP-C1 startet als kleine lokale Node-CJS-Runtime, nicht als TypeScript- oder UI-Block.

Grund: Das aktuelle Bluepilot-Repo nutzt fuer lokale Tools bereits `tools/*.cjs`. Ein direkter `.ts`-Start wuerde neue Runtime-Fragen erzeugen, bevor der Council Kernel selbst pruefbar ist.

## Enthalten in BP-088

- `tools/council-agent-client.cjs`
- `tools/maya-council-watcher.cjs`
- `tools/test-council-kernel-fixtures.cjs`

## Nicht enthalten

- keine BP-C2-Module,
- kein echtes Agent-Spawning,
- kein UI,
- keine Auth,
- keine Secrets,
- keine DB,
- kein Deploy,
- kein Live Builder,
- kein AICOS-Write,
- kein Soulmatch-Copy,
- kein committed `.bluepilot/` Runtime-State.

## Runtime-State

Der Runtime-State liegt standardmaessig unter:

```text
.bluepilot/council/
```

Tools muessen aber einen alternativen Root akzeptieren. Tests verwenden temporaere Verzeichnisse und committen keinen Runtime-State.

## Agent Client Pflichtfaehigkeiten

Der Agent Client muss koennen:

- Agent-Datei registrieren,
- naechste Directive lesen,
- Directive ueber `directive_cursor` bestaetigen,
- Task-Start melden,
- Task-Abschluss melden,
- HARD STOP melden,
- alle Agent-Dateien atomar schreiben.

Agents schreiben nie `session.json`.

## Maya Watcher Pflichtfaehigkeiten

Der Watcher muss im ersten Slice koennen:

- Agent-Dateien lesen,
- Status-Events deterministisch deduplizieren,
- `done` in `session.task_queue` uebernehmen,
- `hard_stop` in `session.status = paused` uebernehmen,
- dependency-ready Tasks an idle Agents zuweisen,
- Directives in `session.json` schreiben,
- Events nach `events.jsonl` append-only schreiben,
- `dedup.json` atomar aktualisieren.

## Harte Grenze

BP-088 beweist den lokalen Council-Kernel-Mechanismus. Es beweist noch nicht, dass mehrere echte Codex-Prozesse parallel arbeiten.

Parallel-Agent-Ausfuehrung beginnt erst in spaeteren BP-C1/BP-C2-Folgetasks, nachdem dieser Kernel gruen ist.
