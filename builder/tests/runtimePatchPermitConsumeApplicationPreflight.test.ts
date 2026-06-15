import assert from 'node:assert/strict';

import { preflightRuntimePatchPermitConsumeApplication } from '../src/runtimePatchPermitConsumeApplicationPreflight.js';
import type { RuntimePatchPermitConsumeAuthority } from '../src/runtimePatchPermitConsumeAuthority.js';

const authority: RuntimePatchPermitConsumeAuthority = {
  status: 'ready',
  permitConsumeAuthorityAllowed: true,
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
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-121.md'],
  authorizedConsume: {
    kind: 'runtime_patch_permit_consume_authority',
    permitKind: 'runtime_patch_application',
    permitRef: 'permit:runtime',
    preflightRef: 'consume:runtime',
    policyRef: 'policy:consume',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyApplicationPreflightKeepsSideEffectsClosed(): void {
  const preflight = preflightRuntimePatchPermitConsumeApplication({
    authority,
    applicationRef: 'application:runtime',
    operatorRef: 'operator:human',
    applicationPolicyRef: 'policy:application',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeApplicationPreflightAllowed, true);
  assert.equal(preflight.permitConsumeAuthorized, true);
  assert.equal(preflight.permitConsumed, false);
  assert.equal(preflight.executionAllowed, false);
  assert.equal(preflight.consumeApplication.kind, 'runtime_patch_permit_consume_application_preflight');
}

function testMissingApplicationRefRequiresReview(): void {
  const preflight = preflightRuntimePatchPermitConsumeApplication({
    authority,
    operatorRef: 'operator:human',
    applicationPolicyRef: 'policy:application',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeApplicationPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('runtime_patch_permit_consume_application_preflight.application_ref_required'));
}

function testBlockedAuthorityBlocksPreflight(): void {
  const preflight = preflightRuntimePatchPermitConsumeApplication({
    authority: { ...authority, status: 'blocked', permitConsumeAuthorityAllowed: false, permitConsumeAuthorized: false, blockers: ['blocked'] },
    applicationRef: 'application:runtime',
    operatorRef: 'operator:human',
    applicationPolicyRef: 'policy:application',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeApplicationPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('runtime_patch_permit_consume_application_preflight.authority_not_allowed'));
}

testReadyApplicationPreflightKeepsSideEffectsClosed();
testMissingApplicationRefRequiresReview();
testBlockedAuthorityBlocksPreflight();

console.log('runtimePatchPermitConsumeApplicationPreflight tests passed');
