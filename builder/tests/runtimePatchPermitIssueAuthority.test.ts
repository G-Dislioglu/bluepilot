import assert from 'node:assert/strict';

import { issueRuntimePatchPermitAuthority } from '../src/runtimePatchPermitIssueAuthority.js';
import type { RuntimePatchPermitIssuePreflight } from '../src/runtimePatchPermitIssuePreflight.js';

const preflight: RuntimePatchPermitIssuePreflight = {
  status: 'ready',
  permitIssuePreflightAllowed: true,
  permitIssued: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  preflightRef: 'preflight:runtime',
  issuerRef: 'issuer:authority',
  issuePolicyRef: 'policy:runtime-permit-issue',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-109.md'],
  permitIssue: { kind: 'runtime_patch_permit_issue_preflight', permitKind: 'runtime_patch_application' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityIssuesSideEffectFreePermit(): void {
  const authority = issueRuntimePatchPermitAuthority({
    preflight,
    permitId: 'permit:runtime',
    issuedByRef: 'issuer:authority',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.permitIssued, true);
  assert.equal(authority.permitConsumed, false);
  assert.equal(authority.executionAllowed, false);
  assert.equal(authority.issuedPermit.kind, 'runtime_patch_application_permit');
}

function testMissingPermitIdRequiresReview(): void {
  const authority = issueRuntimePatchPermitAuthority({
    preflight,
    issuedByRef: 'issuer:authority',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.permitIssued, false);
  assert.ok(authority.reviewItems.includes('runtime_patch_permit_issue_authority.permit_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = issueRuntimePatchPermitAuthority({
    preflight: { ...preflight, status: 'blocked', permitIssuePreflightAllowed: false, blockers: ['blocked'] },
    permitId: 'permit:runtime',
    issuedByRef: 'issuer:authority',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.permitIssued, false);
  assert.ok(authority.blockers.includes('runtime_patch_permit_issue_authority.preflight_not_allowed'));
}

testReadyAuthorityIssuesSideEffectFreePermit();
testMissingPermitIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('runtimePatchPermitIssueAuthority tests passed');
