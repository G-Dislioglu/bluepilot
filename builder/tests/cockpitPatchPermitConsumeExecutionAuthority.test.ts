import assert from 'node:assert/strict';

import { authorizeCockpitPatchPermitConsumeExecution } from '../src/cockpitPatchPermitConsumeExecutionAuthority.js';
import type { CockpitPatchPermitConsumeExecutionPreflight } from '../src/cockpitPatchPermitConsumeExecutionPreflight.js';

const preflight: CockpitPatchPermitConsumeExecutionPreflight = {
  status: 'ready',
  consumeExecutionPreflightAllowed: true,
  consumeApplicationAuthorized: true,
  permitConsumeAuthorized: true,
  permitIssued: true,
  permitConsumed: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  permitId: 'permit:cockpit',
  consumeAuthorityId: 'consume-authority:cockpit',
  applicationAuthorityId: 'application-authority:cockpit',
  executionPreflightRef: 'execution-preflight:cockpit',
  executorRef: 'executor:operator',
  executionPolicyRef: 'policy:execution',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-131.md'],
  consumeExecution: {
    kind: 'cockpit_patch_permit_consume_execution_preflight',
    permitKind: 'cockpit_patch_application',
    permitRef: 'permit:cockpit',
    applicationAuthorityRef: 'application-authority:cockpit',
    policyRef: 'policy:execution',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflightAuthorizesExecutionWithoutEffects(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecution({
    preflight,
    executionAuthorityId: 'execution-authority:cockpit',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionAuthorityAllowed, true);
  assert.equal(authority.consumeExecutionAuthorized, true);
  assert.equal(authority.permitConsumed, false);
  assert.equal(authority.patchApplyAllowed, false);
  assert.equal(authority.authorizedExecution.kind, 'cockpit_patch_permit_consume_execution_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecution({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionAuthorized, false);
  assert.ok(authority.reviewItems.includes('cockpit_patch_permit_consume_execution_authority.execution_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecution({
    preflight: { ...preflight, status: 'blocked', consumeExecutionPreflightAllowed: false, permitConsumeAuthorized: false, blockers: ['blocked'] },
    executionAuthorityId: 'execution-authority:cockpit',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionAuthorized, false);
  assert.ok(authority.blockers.includes('cockpit_patch_permit_consume_execution_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesExecutionWithoutEffects();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('cockpitPatchPermitConsumeExecutionAuthority tests passed');
