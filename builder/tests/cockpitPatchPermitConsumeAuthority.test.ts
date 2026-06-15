import assert from 'node:assert/strict';

import { authorizeCockpitPatchPermitConsume } from '../src/cockpitPatchPermitConsumeAuthority.js';
import type { CockpitPatchPermitConsumePreflight } from '../src/cockpitPatchPermitConsumePreflight.js';

const preflight: CockpitPatchPermitConsumePreflight = {
  status: 'ready',
  permitConsumePreflightAllowed: true,
  permitIssued: true,
  permitConsumed: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  permitId: 'permit:cockpit',
  consumeRef: 'consume:cockpit',
  consumerRef: 'consumer:operator',
  consumePolicyRef: 'policy:consume',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-115.md'],
  permitConsume: {
    kind: 'cockpit_patch_permit_consume_preflight',
    permitKind: 'cockpit_patch_application',
    permitRef: 'permit:cockpit',
    authorityRef: 'issuer:authority',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityAuthorizesConsumeWithoutConsuming(): void {
  const authority = authorizeCockpitPatchPermitConsume({
    preflight,
    consumeAuthorityId: 'consume-authority:cockpit',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.permitConsumeAuthorityAllowed, true);
  assert.equal(authority.permitConsumeAuthorized, true);
  assert.equal(authority.permitConsumed, false);
  assert.equal(authority.patchApplyAllowed, false);
  assert.equal(authority.authorizedConsume.kind, 'cockpit_patch_permit_consume_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeCockpitPatchPermitConsume({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.permitConsumeAuthorized, false);
  assert.ok(authority.reviewItems.includes('cockpit_patch_permit_consume_authority.consume_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeCockpitPatchPermitConsume({
    preflight: { ...preflight, status: 'blocked', permitConsumePreflightAllowed: false, permitIssued: false, blockers: ['blocked'] },
    consumeAuthorityId: 'consume-authority:cockpit',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.permitConsumeAuthorized, false);
  assert.ok(authority.blockers.includes('cockpit_patch_permit_consume_authority.preflight_not_allowed'));
}

testReadyAuthorityAuthorizesConsumeWithoutConsuming();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('cockpitPatchPermitConsumeAuthority tests passed');
