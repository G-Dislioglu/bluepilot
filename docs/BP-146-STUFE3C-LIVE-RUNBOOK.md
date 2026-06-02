# BP-146 - Stufe 3C Live-Runbook: permit-gated Sandbox Write

Status: prepared, no live write performed by this document.

## Purpose

BP-146 is the first live-operation runbook for the one-shot write-permit path.
It connects two pieces:

- maya-core issues exactly one permit with the real `issueWritePermit` store logic.
- bluepilot-builder writes exactly one fixed file to `G-Dislioglu/bluepilot-sandbox`
  through `smartPush` with that permit.

This runbook does not replace the kill switch. The kill switch remains the top-level
emergency stop.

## Fixed Write Coordinates

- Repo: `G-Dislioglu/bluepilot-sandbox`
- Branch: `main`
- Path: `.bluepilot/phase-3c-permit-write.md`
- Operation: `create`
- Base SHA: empty string

The Bluepilot endpoint does not accept repo, branch, path, op, or baseSha from the caller.

## Phase 0 - Preflight

Keep all live-write flags off until the exact phase that needs them.

Verify Bluepilot still answers:

```bash
curl -sS https://bluepilot-builder.onrender.com/health
curl -sS https://bluepilot-builder.onrender.com/health/maya-gate
```

The Maya gate probe should show the corridor reachable before any write attempt.

## Phase 1 - Prepare One Content File

Create one local UTF-8 content file. Do not type the content separately in multiple places.
The permit and the Bluepilot request must use the same bytes.

Example:

```powershell
$contentPath = "$env:TEMP\bp-146-phase-3c-permit-write.md"
@"
# BP-146 Permit Write Probe

This file was created by the one-shot write-permit path.
"@ | Set-Content -LiteralPath $contentPath -Encoding utf8NoBOM
```

Base64 for the Bluepilot request:

```powershell
$contentBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($contentPath))
```

## Phase 2 - Issue Permit In maya-core

Run the maya-core script against the real maya-core Postgres database, not a test DB.

Example from `maya-core/`:

```bash
npx tsx scripts/issue-write-permit.ts \
  --issuer human:guercan \
  --repo G-Dislioglu/bluepilot-sandbox \
  --branch main \
  --path .bluepilot/phase-3c-permit-write.md \
  --op create \
  --base-sha "" \
  --content-file /path/to/bp-146-phase-3c-permit-write.md \
  --ttl-seconds 600
```

Record the returned `permitId`, `contentHash`, and `contentLen`.

Abort if:

- the output repo/path/op differs from the fixed coordinates above
- `contentLen` differs from the byte length of the content file
- the script reports a DB configuration error

## Phase 3 - Open The Short Write Window

For the live write window only:

- `bluepilot-builder`: set `BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED=true`
- `maya-core`: keep `MAYA_BUILDER_REPO_WRITE_ENABLED=true`
- `maya-core`: keep permit enforcement enabled for the corridor

Redeploy whichever service had env changes.

## Phase 4 - Execute Exactly One Write

PowerShell example:

```powershell
$body = @{
  confirm = "permit-write-to-bluepilot-sandbox"
  permitId = "<permit-id-from-maya-core>"
  contentBase64 = $contentBase64
} | ConvertTo-Json -Compress

Invoke-WebRequest `
  -Method POST `
  -Uri "https://bluepilot-builder.onrender.com/probe/sandbox-permit-write" `
  -ContentType "application/json" `
  -Body $body
```

Expected successful shape:

```json
{
  "status": "write_succeeded",
  "repository": "G-Dislioglu/bluepilot-sandbox",
  "branch": "main",
  "targetFile": ".bluepilot/phase-3c-permit-write.md",
  "pushed": true
}
```

If the response is blocked, do not retry blindly. The permit may already be consumed or
the content bytes may not match.

## Phase 5 - Reuse Test

Repeat the same request with the same `permitId`.

Expected result: blocked by the Maya corridor as already consumed. This proves the one-shot
property live.

## Phase 6 - Close Everything

Immediately turn the short-window env flags off again and redeploy:

- `BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED=false`
- close the maya-core repo-write window again

Then verify that another request returns 403 or corridor-blocked.

## Abort Rules

- If repo/path/op do not match the fixed coordinates: stop.
- If content bytes drift between permit issue and request: stop and issue a fresh permit.
- If the first write fails for `hash_mismatch`: stop and compare the content file bytes.
- If the first write succeeds: never reuse the same permit except for the explicit reuse test.
- If anything writes outside `G-Dislioglu/bluepilot-sandbox`: stop all flags immediately.
