import assert from 'node:assert/strict';

import { preflightCockpitPatchPermitConsume } from '../src/cockpitPatchPermitConsumePreflight.js';
import type { CockpitPatchPermitIssueAuthority } from '../src/cockpitPatchPermitIssueAuthority.js';

const authority: CockpitPatchPermitIssueAuthority = {
  status: 'ready',
  permitIssueAuthorityAllowed: true,
  permitIssued: true,
  permitConsumed: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  permitId: 'permit:cockpit',
  issuedByRef: 'issuer:authority',
  expiresAtRef: 'expiry:bounded-window',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-111.md'],
  issuedPermit: {
    kind: 'cockpit_patch_application_permit',
    permitKind: 'cockpit_patch_application',
    preflightRef: 'preflight:cockpit',
    policyRef: 'policy:permit-issue',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyConsumePreflightKeepsSideEffectsClosed(): void {
  const preflight = preflightCockpitPatchPermitConsume({
    authority,
    consumeRef: 'consume:cockpit',
    consumerRef: 'consumer:operator',
    consumePolicyRef: 'policy:consume',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.permitConsumePreflightAllowed, true);
  assert.equal(preflight.permitIssued, true);
  assert.equal(preflight.permitConsumed, false);
  assert.equal(preflight.patchApplyAllowed, false);
  assert.equal(preflight.permitConsume.kind, 'cockpit_patch_permit_consume_preflight');
}

function testMissingConsumeRefRequiresReview(): void {
  const preflight = preflightCockpitPatchPermitConsume({
    authority,
    consumerRef: 'consumer:operator',
    consumePolicyRef: 'policy:consume',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.permitConsumePreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('cockpit_patch_permit_consume_preflight.consume_ref_required'));
}

function testBlockedAuthorityBlocksPreflight(): void {
  const preflight = preflightCockpitPatchPermitConsume({
    authority: { ...authority, status: 'blocked', permitIssueAuthorityAllowed: false, permitIssued: false, blockers: ['blocked'] },
    consumeRef: 'consume:cockpit',
    consumerRef: 'consumer:operator',
    consumePolicyRef: 'policy:consume',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.permitConsumePreflightAllowed, false);
  assert.ok(preflight.blockers.includes('cockpit_patch_permit_consume_preflight.authority_not_allowed'));
}

testReadyConsumePreflightKeepsSideEffectsClosed();
testMissingConsumeRefRequiresReview();
testBlockedAuthorityBlocksPreflight();

console.log('cockpitPatchPermitConsumePreflight tests passed');
