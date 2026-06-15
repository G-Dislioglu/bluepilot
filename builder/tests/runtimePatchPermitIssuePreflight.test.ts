import assert from 'node:assert/strict';

import { preflightRuntimePatchPermitIssue } from '../src/runtimePatchPermitIssuePreflight.js';
import type { RuntimePatchAuthorityReviewDecisionGate } from '../src/runtimePatchAuthorityReviewDecisionGate.js';

const decisionGate: RuntimePatchAuthorityReviewDecisionGate = {
  status: 'ready',
  authorityDecisionGateAllowed: true,
  decision: 'approve',
  permitIssued: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  decisionRef: 'decision:runtime-authority',
  authorityRef: 'authority:operator',
  rationaleRef: 'rationale:runtime',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-105.md'],
  authorityDecision: {
    kind: 'runtime_patch_authority_review_decision',
    requestKind: 'runtime_patch_permit_issuance_request',
    permitKind: 'runtime_patch_application',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflight(): void {
  const preflight = preflightRuntimePatchPermitIssue({
    decisionGate,
    preflightRef: 'preflight:runtime',
    issuerRef: 'issuer:authority',
    issuePolicyRef: 'policy:runtime-permit-issue',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.permitIssuePreflightAllowed, true);
  assert.equal(preflight.permitIssued, false);
  assert.equal(preflight.executionAllowed, false);
  assert.equal(preflight.permitIssue.kind, 'runtime_patch_permit_issue_preflight');
}

function testMissingPreflightRefRequiresReview(): void {
  const preflight = preflightRuntimePatchPermitIssue({
    decisionGate,
    issuerRef: 'issuer:authority',
    issuePolicyRef: 'policy:runtime-permit-issue',
  });

  assert.equal(preflight.status, 'review_required');
  assert.ok(preflight.reviewItems.includes('runtime_patch_permit_issue_preflight.preflight_ref_required'));
}

function testRejectedDecisionBlocksPreflight(): void {
  const preflight = preflightRuntimePatchPermitIssue({
    decisionGate: { ...decisionGate, status: 'blocked', authorityDecisionGateAllowed: false, decision: 'reject', blockers: ['rejected'] },
    preflightRef: 'preflight:runtime',
    issuerRef: 'issuer:authority',
    issuePolicyRef: 'policy:runtime-permit-issue',
  });

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('runtime_patch_permit_issue_preflight.decision_gate_not_allowed'));
}

testReadyPreflight();
testMissingPreflightRefRequiresReview();
testRejectedDecisionBlocksPreflight();

console.log('runtimePatchPermitIssuePreflight tests passed');
