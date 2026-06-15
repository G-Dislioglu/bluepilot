import assert from 'node:assert/strict';

import { preflightRuntimePatchPermitConsumeExecution } from '../src/runtimePatchPermitConsumeExecutionPreflight.js';
import type { RuntimePatchPermitConsumeApplicationAuthority } from '../src/runtimePatchPermitConsumeApplicationAuthority.js';

const authority: RuntimePatchPermitConsumeApplicationAuthority = {
  status: 'ready',
  consumeApplicationAuthorityAllowed: true,
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
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-129.md'],
  authorizedApplication: {
    kind: 'runtime_patch_permit_consume_application_authority',
    permitKind: 'runtime_patch_application',
    permitRef: 'permit:runtime',
    applicationRef: 'application:runtime',
    policyRef: 'policy:application',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityPreflightsExecutionWithoutEffects(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecution({
    authority,
    executionPreflightRef: 'execution-preflight:runtime',
    executorRef: 'executor:operator',
    executionPolicyRef: 'policy:execution',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionPreflightAllowed, true);
  assert.equal(preflight.permitConsumed, false);
  assert.equal(preflight.patchApplyAllowed, false);
  assert.equal(preflight.executionExecuted, false);
  assert.equal(preflight.executionAllowed, false);
  assert.equal(preflight.consumeExecution.kind, 'runtime_patch_permit_consume_execution_preflight');
}

function testMissingExecutionRefRequiresReview(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecution({
    authority,
    executorRef: 'executor:operator',
    executionPolicyRef: 'policy:execution',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('runtime_patch_permit_consume_execution_preflight.execution_preflight_ref_required'));
}

function testBlockedAuthorityBlocksExecutionPreflight(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecution({
    authority: { ...authority, status: 'blocked', consumeApplicationAuthorityAllowed: false, consumeApplicationAuthorized: false, blockers: ['blocked'] },
    executionPreflightRef: 'execution-preflight:runtime',
    executorRef: 'executor:operator',
    executionPolicyRef: 'policy:execution',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('runtime_patch_permit_consume_execution_preflight.application_authority_not_allowed'));
}

testReadyAuthorityPreflightsExecutionWithoutEffects();
testMissingExecutionRefRequiresReview();
testBlockedAuthorityBlocksExecutionPreflight();

console.log('runtimePatchPermitConsumeExecutionPreflight tests passed');
