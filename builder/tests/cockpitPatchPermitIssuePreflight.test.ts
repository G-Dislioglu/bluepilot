import assert from 'node:assert/strict';

import { preflightCockpitPatchPermitIssue } from '../src/cockpitPatchPermitIssuePreflight.js';
import type { CockpitPatchAuthorityReviewDecisionGate } from '../src/cockpitPatchAuthorityReviewDecisionGate.js';

const decisionGate: CockpitPatchAuthorityReviewDecisionGate = {
  status: 'ready',
  authorityDecisionGateAllowed: true,
  decision: 'approve',
  permitIssued: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  decisionRef: 'decision:cockpit-authority',
  authorityRef: 'authority:operator',
  rationaleRef: 'rationale:cockpit',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-103.md'],
  authorityDecision: {
    kind: 'cockpit_patch_authority_review_decision',
    requestKind: 'cockpit_patch_permit_issuance_request',
    permitKind: 'cockpit_patch_application',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflight(): void {
  const preflight = preflightCockpitPatchPermitIssue({
    decisionGate,
    preflightRef: 'preflight:cockpit',
    issuerRef: 'issuer:authority',
    issuePolicyRef: 'policy:permit-issue',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.permitIssuePreflightAllowed, true);
  assert.equal(preflight.permitIssued, false);
  assert.equal(preflight.patchApplyAllowed, false);
  assert.equal(preflight.permitIssue.kind, 'cockpit_patch_permit_issue_preflight');
}

function testMissingPreflightRefRequiresReview(): void {
  const preflight = preflightCockpitPatchPermitIssue({
    decisionGate,
    issuerRef: 'issuer:authority',
    issuePolicyRef: 'policy:permit-issue',
  });

  assert.equal(preflight.status, 'review_required');
  assert.ok(preflight.reviewItems.includes('cockpit_patch_permit_issue_preflight.preflight_ref_required'));
}

function testRejectedDecisionBlocksPreflight(): void {
  const preflight = preflightCockpitPatchPermitIssue({
    decisionGate: { ...decisionGate, status: 'blocked', authorityDecisionGateAllowed: false, decision: 'reject', blockers: ['rejected'] },
    preflightRef: 'preflight:cockpit',
    issuerRef: 'issuer:authority',
    issuePolicyRef: 'policy:permit-issue',
  });

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('cockpit_patch_permit_issue_preflight.decision_gate_not_allowed'));
}

testReadyPreflight();
testMissingPreflightRefRequiresReview();
testRejectedDecisionBlocksPreflight();

console.log('cockpitPatchPermitIssuePreflight tests passed');
