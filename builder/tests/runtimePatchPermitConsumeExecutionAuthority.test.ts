import assert from 'node:assert/strict';

import { authorizeRuntimePatchPermitConsumeExecution } from '../src/runtimePatchPermitConsumeExecutionAuthority.js';
import type { RuntimePatchPermitConsumeExecutionPreflight } from '../src/runtimePatchPermitConsumeExecutionPreflight.js';

const preflight: RuntimePatchPermitConsumeExecutionPreflight = {
  status: 'ready',
  consumeExecutionPreflightAllowed: true,
  consumeApplicationAuthorized: true,
  permitConsumeAuthorized: true,
  permitIssued: true,
  permitConsumed: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  permitId: 'permit:runtime',
  consumeAuthorityId: 'consume-authority:runtime',
  applicationAuthorityId: 'application-authority:runtime',
  executionPreflightRef: 'execution-preflight:runtime',
  executorRef: 'executor:operator',
  executionPolicyRef: 'policy:execution',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-133.md'],
  consumeExecution: {
    kind: 'runtime_patch_permit_consume_execution_preflight',
    permitKind: 'runtime_patch_application',
    permitRef: 'permit:runtime',
    applicationAuthorityRef: 'application-authority:runtime',
    policyRef: 'policy:execution',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflightAuthorizesExecutionWithoutEffects(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecution({
    preflight,
    executionAuthorityId: 'execution-authority:runtime',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionAuthorityAllowed, true);
  assert.equal(authority.consumeExecutionAuthorized, true);
  assert.equal(authority.permitConsumed, false);
  assert.equal(authority.executionAllowed, false);
  assert.equal(authority.authorizedExecution.kind, 'runtime_patch_permit_consume_execution_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecution({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionAuthorized, false);
  assert.ok(authority.reviewItems.includes('runtime_patch_permit_consume_execution_authority.execution_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecution({
    preflight: { ...preflight, status: 'blocked', consumeExecutionPreflightAllowed: false, permitConsumeAuthorized: false, blockers: ['blocked'] },
    executionAuthorityId: 'execution-authority:runtime',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionAuthorized, false);
  assert.ok(authority.blockers.includes('runtime_patch_permit_consume_execution_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesExecutionWithoutEffects();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('runtimePatchPermitConsumeExecutionAuthority tests passed');
