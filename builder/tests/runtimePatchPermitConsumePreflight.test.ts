import assert from 'node:assert/strict';

import { preflightRuntimePatchPermitConsume } from '../src/runtimePatchPermitConsumePreflight.js';
import type { RuntimePatchPermitIssueAuthority } from '../src/runtimePatchPermitIssueAuthority.js';

const authority: RuntimePatchPermitIssueAuthority = {
  status: 'ready',
  permitIssueAuthorityAllowed: true,
  permitIssued: true,
  permitConsumed: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  permitId: 'permit:runtime',
  issuedByRef: 'issuer:authority',
  expiresAtRef: 'expiry:bounded-window',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-113.md'],
  issuedPermit: {
    kind: 'runtime_patch_application_permit',
    permitKind: 'runtime_patch_application',
    preflightRef: 'preflight:runtime',
    policyRef: 'policy:runtime-permit-issue',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyConsumePreflightKeepsSideEffectsClosed(): void {
  const preflight = preflightRuntimePatchPermitConsume({
    authority,
    consumeRef: 'consume:runtime',
    consumerRef: 'consumer:operator',
    consumePolicyRef: 'policy:consume',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.permitConsumePreflightAllowed, true);
  assert.equal(preflight.permitIssued, true);
  assert.equal(preflight.permitConsumed, false);
  assert.equal(preflight.executionAllowed, false);
  assert.equal(preflight.permitConsume.kind, 'runtime_patch_permit_consume_preflight');
}

function testMissingConsumeRefRequiresReview(): void {
  const preflight = preflightRuntimePatchPermitConsume({
    authority,
    consumerRef: 'consumer:operator',
    consumePolicyRef: 'policy:consume',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.permitConsumePreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('runtime_patch_permit_consume_preflight.consume_ref_required'));
}

function testBlockedAuthorityBlocksPreflight(): void {
  const preflight = preflightRuntimePatchPermitConsume({
    authority: { ...authority, status: 'blocked', permitIssueAuthorityAllowed: false, permitIssued: false, blockers: ['blocked'] },
    consumeRef: 'consume:runtime',
    consumerRef: 'consumer:operator',
    consumePolicyRef: 'policy:consume',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.permitConsumePreflightAllowed, false);
  assert.ok(preflight.blockers.includes('runtime_patch_permit_consume_preflight.authority_not_allowed'));
}

testReadyConsumePreflightKeepsSideEffectsClosed();
testMissingConsumeRefRequiresReview();
testBlockedAuthorityBlocksPreflight();

console.log('runtimePatchPermitConsumePreflight tests passed');
