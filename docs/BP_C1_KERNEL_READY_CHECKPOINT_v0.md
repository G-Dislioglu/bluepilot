# BP-C1 Kernel Ready Checkpoint v0

Datum: 2026-05-28
Status: BP-090 checkpoint

## Entscheidung

BP-C1 ist als lokaler Council Kernel bereit fuer die naechste Phase-Vorbereitung.

Bereit heisst hier:

- Council Session kann lokal initialisiert werden.
- Agent-Dateien koennen registriert und atomar aktualisiert werden.
- Maya Watcher verarbeitet Agent-Aenderungen event-getrieben.
- `done`, `hard_stop`, Dedup, Events und Session-Close sind lokal getestet.
- Runtime-State kann in einem alternativen Root laufen.
- Kein `.bluepilot/` Runtime-State wird committed.

## Korrektur des manuellen Smoke-Vorschlags

Der externe Vorschlag:

```bash
node tools/maya-council-watcher.cjs init .
node tools/council-agent-client.cjs done . agent-1 TASK_001
```

ist fuer den aktuellen Code nicht ausreichend, weil `init .` ohne Task-Queue keine `TASK_001` anlegt. Dann kann Maya `TASK_001` nicht als `done` in `session.task_queue` markieren.

BP-090 ersetzt das durch:

```bash
node tools/council-kernel-smoke.cjs
```

Der Smoke nutzt einen Temp-Root, erzeugt eine Session mit `TASK_001`, startet den Watcher, registriert `agent-1`, meldet Start und Abschluss und prueft Events sowie Session-Close.

## Evidence

Gruene Pflicht-Evidence:

- `node --check tools/council-kernel-smoke.cjs`
- `node tools/council-kernel-smoke.cjs`
- `node tools/test-bluepilot-review-suite.cjs`
- `node tools/verify-task-lock.cjs BP-090 --verify`
- `git diff --check`

## BP-C2 Gate

BP-C2 darf jetzt vorbereitet werden, aber nur als neuer WLP-Task.

Erlaubt als naechster Schritt:

- BP-C2 Contract fuer drei parallele Linien vorbereiten:
  - Multi-model Pool,
  - Context Broker,
  - WLP Tooling.

Nicht erlaubt ohne neuen Contract:

- BP-C2 Runtime direkt bauen,
- echte parallele Codex-Prozesse starten,
- UI bauen,
- Auth, Secrets, DB oder Deploy einfuehren,
- AICOS schreiben,
- Soulmatch-Dateien kopieren.

## Reuse Note

Jeder BP-C2-Task muss eine aktive Council Session als Voraussetzung nennen und darf nur innerhalb der BP-C2-Phase parallelisiert werden.
