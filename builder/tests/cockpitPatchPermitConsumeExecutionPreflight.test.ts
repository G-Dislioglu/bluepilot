import assert from 'node:assert/strict';

import { preflightCockpitPatchPermitConsumeExecution } from '../src/cockpitPatchPermitConsumeExecutionPreflight.js';
import type { CockpitPatchPermitConsumeApplicationAuthority } from '../src/cockpitPatchPermitConsumeApplicationAuthority.js';

const authority: CockpitPatchPermitConsumeApplicationAuthority = {
  status: 'ready',
  consumeApplicationAuthorityAllowed: true,
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
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-127.md'],
  authorizedApplication: {
    kind: 'cockpit_patch_permit_consume_application_authority',
    permitKind: 'cockpit_patch_application',
    permitRef: 'permit:cockpit',
    applicationRef: 'application:cockpit',
    policyRef: 'policy:application',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityPreflightsExecutionWithoutEffects(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecution({
    authority,
    executionPreflightRef: 'execution-preflight:cockpit',
    executorRef: 'executor:operator',
    executionPolicyRef: 'policy:execution',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionPreflightAllowed, true);
  assert.equal(preflight.permitConsumed, false);
  assert.equal(preflight.patchApplyAllowed, false);
  assert.equal(preflight.serverMutationExecuted, false);
  assert.equal(preflight.routeMutationExecuted, false);
  assert.equal(preflight.consumeExecution.kind, 'cockpit_patch_permit_consume_execution_preflight');
}

function testMissingExecutionRefRequiresReview(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecution({
    authority,
    executorRef: 'executor:operator',
    executionPolicyRef: 'policy:execution',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('cockpit_patch_permit_consume_execution_preflight.execution_preflight_ref_required'));
}

function testBlockedAuthorityBlocksExecutionPreflight(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecution({
    authority: { ...authority, status: 'blocked', consumeApplicationAuthorityAllowed: false, consumeApplicationAuthorized: false, blockers: ['blocked'] },
    executionPreflightRef: 'execution-preflight:cockpit',
    executorRef: 'executor:operator',
    executionPolicyRef: 'policy:execution',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('cockpit_patch_permit_consume_execution_preflight.application_authority_not_allowed'));
}

testReadyAuthorityPreflightsExecutionWithoutEffects();
testMissingExecutionRefRequiresReview();
testBlockedAuthorityBlocksExecutionPreflight();

console.log('cockpitPatchPermitConsumeExecutionPreflight tests passed');
