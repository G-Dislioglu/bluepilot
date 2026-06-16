# WLP Orphan Gate v0.1

`WIRE-GATE-001` adds an optional Workcell Lock Protocol contract field:

```json
{
  "orphan_gate": "off"
}
```

Allowed values:

| Value | Behavior |
|---|---|
| `off` | Default. No orphan-gate check runs. Existing contracts behave as before. |
| `warn` | Changed `builder/src` modules are checked and reported, but verify exits normally. |
| `enforce` | Changed `builder/src` modules that are not live-connected and not explicitly staged fail verify with exit code 1. |

## Scope

The gate evaluates only files in the current task changed set from `baseline_ref`.

Evaluated files must be:

- under `builder/src/`
- `.ts` files
- not `.d.ts`
- not `.test.ts` or `.spec.ts`
- present in the working tree

The legacy backlog is never evaluated by this gate. Legacy cleanup remains the job of the census
and follow-up slice contracts.

## Connectivity Rule

Connectivity comes from `tools/orphan-scan.cjs`.

A module passes the gate when it is `serverReachable` from the single explicit live root:

```text
builder/src/server.ts
```

Only used value imports create connectivity edges. These do not count as live wiring:

- type-only imports
- test-only imports
- unused value imports
- side-effect-only imports
- orchestrator-only reachability

`builder/src/opusTaskOrchestrator.ts` remains diagnostic only and is not a second live root.

## Explicit Exception

A changed module can pass without a live consumer only when it declares a top-of-file tag:

```ts
// @orphan-by-design: reason and planned consumer/follow-up
```

The reason must be non-empty. This tag is not a finish label; it is a visible staged exception
that needs a real follow-up plan.

## Residual Blind Spots

The usage detector is a deterministic heuristic, not a full TypeScript compiler graph. It may miss
dynamic dispatch, re-export chains or rare identifier false positives. The gate is intentionally
bounded: it prevents obvious new drift and makes exceptions visible, but it does not prove that a
feature is meaningfully executed by a user-facing path.
