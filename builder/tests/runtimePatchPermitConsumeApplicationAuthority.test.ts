import assert from 'node:assert/strict';

import { authorizeRuntimePatchPermitConsumeApplication } from '../src/runtimePatchPermitConsumeApplicationAuthority.js';
import type { RuntimePatchPermitConsumeApplicationPreflight } from '../src/runtimePatchPermitConsumeApplicationPreflight.js';

const preflight: RuntimePatchPermitConsumeApplicationPreflight = {
  status: 'ready',
  consumeApplicationPreflightAllowed: true,
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
  applicationRef: 'application:runtime',
  operatorRef: 'operator:human',
  applicationPolicyRef: 'policy:application',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-125.md'],
  consumeApplication: {
    kind: 'runtime_patch_permit_consume_application_preflight',
    permitKind: 'runtime_patch_application',
    permitRef: 'permit:runtime',
    authorityRef: 'consume-authority:runtime',
    policyRef: 'policy:application',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityAuthorizesApplicationWithoutEffects(): void {
  const authority = authorizeRuntimePatchPermitConsumeApplication({
    preflight,
    applicationAuthorityId: 'application-authority:runtime',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeApplicationAuthorityAllowed, true);
  assert.equal(authority.consumeApplicationAuthorized, true);
  assert.equal(authority.permitConsumed, false);
  assert.equal(authority.executionAllowed, false);
  assert.equal(authority.authorizedApplication.kind, 'runtime_patch_permit_consume_application_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeRuntimePatchPermitConsumeApplication({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeApplicationAuthorized, false);
  assert.ok(authority.reviewItems.includes('runtime_patch_permit_consume_application_authority.application_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeRuntimePatchPermitConsumeApplication({
    preflight: { ...preflight, status: 'blocked', consumeApplicationPreflightAllowed: false, permitConsumeAuthorized: false, blockers: ['blocked'] },
    applicationAuthorityId: 'application-authority:runtime',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeApplicationAuthorized, false);
  assert.ok(authority.blockers.includes('runtime_patch_permit_consume_application_authority.preflight_not_allowed'));
}

testReadyAuthorityAuthorizesApplicationWithoutEffects();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('runtimePatchPermitConsumeApplicationAuthority tests passed');
