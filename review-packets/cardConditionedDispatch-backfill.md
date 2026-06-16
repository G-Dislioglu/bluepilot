# cardConditionedDispatch Backfill

Task: WIRE-SLICE-001
Module: `builder/src/cardConditionedDispatch.ts`

## Purpose

`cardConditionedDispatch` turns a WLP contract draft plus explicit AICOS-style condition cards
into a dispatch decision. It keeps dispatch policy separate from worker output: cards can allow,
require review or block a dispatch based on status, policy and path applicability.

## Prior Build Task

Originally introduced in the BPK governance chain as a side-effect-free planner with tests, but
without a runtime or dry-run value consumer.

## Input Types

- `WlpContractDraft` from `workerPacketWlpAdapter`
- `requestedCardIds: string[]`
- `DispatchConditionCard[]`

## Output Type

- `CardConditionedDispatchPlan`

The plan exposes `decision`, `dispatchAllowed`, `reviewRequired`, reasons, card evidence and the
contract task id.

## New Used Value Importer

`builder/src/dispatchDryRunSlice.ts` now value-imports and executes `planCardConditionedDispatch`.
This moves `cardConditionedDispatch.ts` from type-only staging to a non-live dry-run composition
consumer. It remains not server-reachable until WIRE-SLICE-002 exposes a live route or orchestrator
consumer.

## Evidence

- `builder/tests/wireSlice001DispatchDryRun.test.ts`
- `node tools/orphan-scan.cjs` measured `dispatchDryRunSlice.ts` as a used value importer while
  `serverReachable` stayed false.
