import assert from 'node:assert/strict';

import { buildCockpitPatchPermitIssuanceRequestPacket } from '../src/cockpitPatchPermitIssuanceRequestPacket.js';
import type { CockpitPatchPermitIssuanceReadiness } from '../src/cockpitPatchPermitIssuanceReadiness.js';

const readiness: CockpitPatchPermitIssuanceReadiness = {
  status: 'ready',
  permitIssuanceReadinessAllowed: true,
  permitIssued: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  issuanceReadinessRef: 'issuance-readiness:cockpit',
  issuerRef: 'issuer:operator',
  policyRef: 'policy:one-shot-permit',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-091.md'],
  permitRequest: { kind: 'cockpit_patch_application' },
  issuanceGate: { kind: 'cockpit_patch_permit_issuance' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyRequestPacket(): void {
  const packet = buildCockpitPatchPermitIssuanceRequestPacket({
    readiness,
    requestRef: 'request:cockpit',
    requesterRef: 'requester:operator',
  });

  assert.equal(packet.status, 'ready');
  assert.equal(packet.requestPacketAllowed, true);
  assert.equal(packet.permitIssued, false);
  assert.equal(packet.packet.kind, 'cockpit_patch_permit_issuance_request');
  assert.equal(packet.packet.permitKind, 'cockpit_patch_application');
}

function testMissingRequestRefRequiresReview(): void {
  const packet = buildCockpitPatchPermitIssuanceRequestPacket({ readiness, requesterRef: 'requester:operator' });

  assert.equal(packet.status, 'review_required');
  assert.ok(packet.reviewItems.includes('cockpit_patch_permit_issuance_request.request_ref_required'));
}

function testBlockedReadinessBlocksPacket(): void {
  const packet = buildCockpitPatchPermitIssuanceRequestPacket({
    readiness: { ...readiness, status: 'blocked', permitIssuanceReadinessAllowed: false, blockers: ['blocked'] },
    requestRef: 'request:cockpit',
    requesterRef: 'requester:operator',
  });

  assert.equal(packet.status, 'blocked');
  assert.ok(packet.blockers.includes('cockpit_patch_permit_issuance_request.readiness_not_allowed'));
}

testReadyRequestPacket();
testMissingRequestRefRequiresReview();
testBlockedReadinessBlocksPacket();

console.log('cockpitPatchPermitIssuanceRequestPacket tests passed');
