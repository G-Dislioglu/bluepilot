# BP-C3 Parallel Executor Contract v0

Datum: 2026-05-28
Status: BP-095 runtime contract
Phase: BP-C3

## Entscheidung

Der erste Parallel-Executor-Slice verwaltet nur Git-Worktrees.

Er startet keine Agents und fuehrt keine Arbeit in den Worktrees aus.

## Enthalten

- `worktree-list`
- `worktree-add`
- `worktree-remove`
- `withWorktree(...)` mit Cleanup in `finally`

## Nicht enthalten

- kein Agent-Spawning,
- keine Parallel-Ausfuehrung von Prozessen,
- kein Merge,
- kein Push,
- kein Deploy,
- kein UI,
- kein BP-C4.

## Sicherheitsregeln

- Git-Fehler werden als strukturierter `HARD_STOP`-Fehler ausgegeben.
- Tests laufen in temporaeren Git-Repos.
- Der echte Bluepilot-Repo-Worktree wird im Test nicht veraendert.
- Worktree-Pfade duerfen nicht unkontrolliert ausserhalb des gewuenschten Parent-Ordners erzeugt werden.

## CLI

```bash
node tools/parallel-executor.cjs list --repo .
node tools/parallel-executor.cjs add --repo . --agent agent-1 --parent C:/temp/bluepilot-worktrees
node tools/parallel-executor.cjs remove --repo . --path C:/temp/bluepilot-worktrees/agent-1
```
