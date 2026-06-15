# Merge/Release Readiness Preflight Review Packet

## Scope

This bundle adds a contract-only preflight for PR sequence and merge/release receipt readiness before real merges or deploys.

## Built

- `GET /probe/merge-release-readiness-contract` describes the closed PR/merge/deploy boundary.
- `POST /probe/merge-release-readiness-preflight` validates branch candidate order and optional PR review receipts.
- The preflight wraps the existing BPK branch/PR consolidation logic.
- The eight-point readiness model now marks `merge_release_readiness` as `wired_contract_only`.
- The operator dashboard shows Merge and Release Readiness as a contract-only panel.

## Safety Notes

- No pull request is created.
- No GitHub API call is made.
- No branch is merged.
- No deploy or release action is performed.
- App-level `pullRequestCreationAllowed`, `mergeExecutionAllowed`, and `deployExecutionAllowed` are always false.

## Evidence

| Command | Result |
| --- | --- |
| `npx tsx --test tests/mergeReleaseReadinessPreflight.test.ts tests/mergeReleaseReadinessRoute.test.ts tests/eightPointIntegrationReadiness.test.ts tests/meta.test.ts` | PASS - 13/13 |
| `npm run typecheck` | PASS |
| `git diff --check` | PASS |
| `npm test` | PASS - 337/337 |

## Reviewer Focus

Confirm that this is only a review/readiness surface: operator hints may say an order is ready, but Bluepilot still cannot create PRs, merge, deploy, or call GitHub from this route.
