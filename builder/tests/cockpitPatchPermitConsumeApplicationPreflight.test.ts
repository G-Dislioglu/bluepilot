import assert from 'node:assert/strict';

import { preflightCockpitPatchPermitConsumeApplication } from '../src/cockpitPatchPermitConsumeApplicationPreflight.js';
import type { CockpitPatchPermitConsumeAuthority } from '../src/cockpitPatchPermitConsumeAuthority.js';

const authority: CockpitPatchPermitConsumeAuthority = {
  status: 'ready',
  permitConsumeAuthorityAllowed: true,
  permitConsumeAuthorized: true,
  permitIssued: true,
  permitConsumed: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  permitId: 'permit:cockpit',
  consumeAuthorityId: 'consume-authority:cockpit',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-119.md'],
  authorizedConsume: {
    kind: 'cockpit_patch_permit_consume_authority',
    permitKind: 'cockpit_patch_application',
    permitRef: 'permit:cockpit',
    preflightRef: 'consume:cockpit',
    policyRef: 'policy:consume',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyApplicationPreflightKeepsSideEffectsClosed(): void {
  const preflight = preflightCockpitPatchPermitConsumeApplication({
    authority,
    applicationRef: 'application:cockpit',
    operatorRef: 'operator:human',
    applicationPolicyRef: 'policy:application',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeApplicationPreflightAllowed, true);
  assert.equal(preflight.permitConsumeAuthorized, true);
  assert.equal(preflight.permitConsumed, false);
  assert.equal(preflight.patchApplyAllowed, false);
  assert.equal(preflight.consumeApplication.kind, 'cockpit_patch_permit_consume_application_preflight');
}

function testMissingApplicationRefRequiresReview(): void {
  const preflight = preflightCockpitPatchPermitConsumeApplication({
    authority,
    operatorRef: 'operator:human',
    applicationPolicyRef: 'policy:application',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeApplicationPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('cockpit_patch_permit_consume_application_preflight.application_ref_required'));
}

function testBlockedAuthorityBlocksPreflight(): void {
  const preflight = preflightCockpitPatchPermitConsumeApplication({
    authority: { ...authority, status: 'blocked', permitConsumeAuthorityAllowed: false, permitConsumeAuthorized: false, blockers: ['blocked'] },
    applicationRef: 'application:cockpit',
    operatorRef: 'operator:human',
    applicationPolicyRef: 'policy:application',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeApplicationPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('cockpit_patch_permit_consume_application_preflight.authority_not_allowed'));
}

testReadyApplicationPreflightKeepsSideEffectsClosed();
testMissingApplicationRefRequiresReview();
testBlockedAuthorityBlocksPreflight();

console.log('cockpitPatchPermitConsumeApplicationPreflight tests passed');
