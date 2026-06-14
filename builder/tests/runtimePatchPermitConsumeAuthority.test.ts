import assert from 'node:assert/strict';

import { authorizeRuntimePatchPermitConsume } from '../src/runtimePatchPermitConsumeAuthority.js';
import type { RuntimePatchPermitConsumePreflight } from '../src/runtimePatchPermitConsumePreflight.js';

const preflight: RuntimePatchPermitConsumePreflight = {
  status: 'ready',
  permitConsumePreflightAllowed: true,
  permitIssued: true,
  permitConsumed: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  permitId: 'permit:runtime',
  consumeRef: 'consume:runtime',
  consumerRef: 'consumer:operator',
  consumePolicyRef: 'policy:consume',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-117.md'],
  permitConsume: {
    kind: 'runtime_patch_permit_consume_preflight',
    permitKind: 'runtime_patch_application',
    permitRef: 'permit:runtime',
    authorityRef: 'issuer:authority',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityAuthorizesConsumeWithoutConsuming(): void {
  const authority = authorizeRuntimePatchPermitConsume({
    preflight,
    consumeAuthorityId: 'consume-authority:runtime',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.permitConsumeAuthorityAllowed, true);
  assert.equal(authority.permitConsumeAuthorized, true);
  assert.equal(authority.permitConsumed, false);
  assert.equal(authority.executionAllowed, false);
  assert.equal(authority.authorizedConsume.kind, 'runtime_patch_permit_consume_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeRuntimePatchPermitConsume({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.permitConsumeAuthorized, false);
  assert.ok(authority.reviewItems.includes('runtime_patch_permit_consume_authority.consume_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeRuntimePatchPermitConsume({
    preflight: { ...preflight, status: 'blocked', permitConsumePreflightAllowed: false, permitIssued: false, blockers: ['blocked'] },
    consumeAuthorityId: 'consume-authority:runtime',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.permitConsumeAuthorized, false);
  assert.ok(authority.blockers.includes('runtime_patch_permit_consume_authority.preflight_not_allowed'));
}

testReadyAuthorityAuthorizesConsumeWithoutConsuming();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('runtimePatchPermitConsumeAuthority tests passed');
