# BP-C2 Context Broker Contract v0

Datum: 2026-05-28
Status: BP-092 runtime contract
Phase: BP-C2

## Entscheidung

Der Context Broker v0 ist ein lokales read-only Tool fuer Session-Start-Kontext.

Er schreibt keinen Index und laedt keine externen Quellen.

## Session-Start Output

Der Broker gibt JSON zurueck mit:

- `task_id`,
- App Goal,
- Feature Goals,
- festen Governance-Dokumenten,
- Contract-Metadaten,
- geladenem `eligible_context`,
- fehlenden, geblockten und geladenen Dateien.

## Sicherheitsregeln

Geblockt:

- `.env*`,
- `.git/**`,
- `node_modules/**`,
- absolute Pfade,
- Parent-Traversal,
- Dateien ausserhalb des Repo-Roots.

## CLI

```bash
node tools/context-broker.cjs session-start BP-092
node tools/context-broker.cjs session-start BP-092 --include AGENTS.md
```

Die Ausgabe ist JSON.
