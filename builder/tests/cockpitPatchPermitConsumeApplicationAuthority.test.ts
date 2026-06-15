import assert from 'node:assert/strict';

import { authorizeCockpitPatchPermitConsumeApplication } from '../src/cockpitPatchPermitConsumeApplicationAuthority.js';
import type { CockpitPatchPermitConsumeApplicationPreflight } from '../src/cockpitPatchPermitConsumeApplicationPreflight.js';

const preflight: CockpitPatchPermitConsumeApplicationPreflight = {
  status: 'ready',
  consumeApplicationPreflightAllowed: true,
  permitConsumeAuthorized: true,
  permitIssued: true,
  permitConsumed: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  permitId: 'permit:cockpit',
  consumeAuthorityId: 'consume-authority:cockpit',
  applicationRef: 'application:cockpit',
  operatorRef: 'operator:human',
  applicationPolicyRef: 'policy:application',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-123.md'],
  consumeApplication: {
    kind: 'cockpit_patch_permit_consume_application_preflight',
    permitKind: 'cockpit_patch_application',
    permitRef: 'permit:cockpit',
    authorityRef: 'consume-authority:cockpit',
    policyRef: 'policy:application',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityAuthorizesApplicationWithoutEffects(): void {
  const authority = authorizeCockpitPatchPermitConsumeApplication({
    preflight,
    applicationAuthorityId: 'application-authority:cockpit',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeApplicationAuthorityAllowed, true);
  assert.equal(authority.consumeApplicationAuthorized, true);
  assert.equal(authority.permitConsumed, false);
  assert.equal(authority.patchApplyAllowed, false);
  assert.equal(authority.authorizedApplication.kind, 'cockpit_patch_permit_consume_application_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeCockpitPatchPermitConsumeApplication({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeApplicationAuthorized, false);
  assert.ok(authority.reviewItems.includes('cockpit_patch_permit_consume_application_authority.application_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeCockpitPatchPermitConsumeApplication({
    preflight: { ...preflight, status: 'blocked', consumeApplicationPreflightAllowed: false, permitConsumeAuthorized: false, blockers: ['blocked'] },
    applicationAuthorityId: 'application-authority:cockpit',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeApplicationAuthorized, false);
  assert.ok(authority.blockers.includes('cockpit_patch_permit_consume_application_authority.preflight_not_allowed'));
}

testReadyAuthorityAuthorizesApplicationWithoutEffects();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('cockpitPatchPermitConsumeApplicationAuthority tests passed');
