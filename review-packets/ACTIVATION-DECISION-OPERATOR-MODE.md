# Activation Decision Operator Mode Review Packet

## Scope

This bundle adds the decision layer between review-ready evidence and later target-specific
execution activation. It defines autonomy modes, including full access, without performing any
execution itself.

## Built

- `GET /probe/activation-decision-operator-mode-contract`
- `POST /probe/activation-decision-operator-mode-preflight`
- Meta entries for both surfaces

## Autonomy Modes

- `read_only`: observe only; execution is never allowed.
- `review_only`: prepare decisions only; execution is never allowed.
- `supervised_execution`: execution can be allowed only with per-action approval.
- `full_access`: execution can be allowed without repeated prompts when operator grant, ethics
  charter, safety, executor, and receipt-store evidence are present.

## Hard Stops

Full access does not bypass hard stops. Banking, financial transactions, ethics-charter violations,
illegal actions, abuse, privacy invasion, deception, weapons, self-harm, and high-stakes legal or
medical submissions stay blocked.

## Safety Boundary

Even when `execute_allowed`, this surface only evaluates permission. It does not call providers,
execute runtime, write files/GitHub/database, persist receipts, issue permits, merge, or deploy.

## Evidence

| Check | Result |
| --- | --- |
| Focus tests | PASS - 27/27 |
| `npm run typecheck` | PASS |
| Full builder test | PASS - 382/382 |

## Reviewer Focus

Confirm that `full_access` means fewer repeated prompts inside the approved scope, not permission
to bypass the ethics charter or execute hard-stop actions.
