# Maya-Core Autonomy Live Verification Runner

## Summary

Bluepilot can now run a gated live verify call against Maya-core `/api/maya/autonomy/authority`.
The runner reuses the existing intake/preflight, requires `executeLiveVerification: true`, and
uses `MAYA_CORE_URL` plus `MAYA_CORE_GATE_TOKEN` or `MAYA_BUILDER_GATE_TOKEN`.

## Safety Boundary

- Calls Maya-core only in verify mode.
- Does not issue Maya/Kaya decisions.
- Does not execute runtime, provider calls, writes, GitHub actions, deploys, merges, permits, or durable persistence.
- Operator Dashboard includes a copy-only `Maya Live Verify` payload with `executeLiveVerification: false` by default.

## Checks

- PASS: focus tests `23/23`
- PASS: `npm run typecheck`
- PASS: `node scripts/generate-bpk-governance-manifest.mjs`
- PASS: `node tools/verify-task-lock.cjs MAYA-CORE-AUTONOMY-LIVE-VERIFICATION-RUNNER --verify --contract contracts/MAYA-CORE-AUTONOMY-LIVE-VERIFICATION-RUNNER.json`
- PASS: `git diff --check`
- PASS: full builder test `404/404`
