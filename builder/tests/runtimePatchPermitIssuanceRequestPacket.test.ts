import assert from 'node:assert/strict';

import { buildRuntimePatchPermitIssuanceRequestPacket } from '../src/runtimePatchPermitIssuanceRequestPacket.js';
import type { RuntimePatchPermitIssuanceReadiness } from '../src/runtimePatchPermitIssuanceReadiness.js';

const readiness: RuntimePatchPermitIssuanceReadiness = {
  status: 'ready',
  permitIssuanceReadinessAllowed: true,
  permitIssued: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  issuanceReadinessRef: 'issuance-readiness:runtime',
  issuerRef: 'issuer:operator',
  policyRef: 'policy:runtime-permit',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-093.md'],
  permitRequest: { kind: 'runtime_patch_application' },
  issuanceGate: { kind: 'runtime_patch_permit_issuance' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyRequestPacket(): void {
  const packet = buildRuntimePatchPermitIssuanceRequestPacket({
    readiness,
    requestRef: 'request:runtime',
    requesterRef: 'requester:operator',
  });

  assert.equal(packet.status, 'ready');
  assert.equal(packet.requestPacketAllowed, true);
  assert.equal(packet.permitIssued, false);
  assert.equal(packet.executionAllowed, false);
  assert.equal(packet.packet.kind, 'runtime_patch_permit_issuance_request');
}

function testMissingRequestRefRequiresReview(): void {
  const packet = buildRuntimePatchPermitIssuanceRequestPacket({ readiness, requesterRef: 'requester:operator' });

  assert.equal(packet.status, 'review_required');
  assert.ok(packet.reviewItems.includes('runtime_patch_permit_issuance_request.request_ref_required'));
}

function testBlockedReadinessBlocksPacket(): void {
  const packet = buildRuntimePatchPermitIssuanceRequestPacket({
    readiness: { ...readiness, status: 'blocked', permitIssuanceReadinessAllowed: false, blockers: ['blocked'] },
    requestRef: 'request:runtime',
    requesterRef: 'requester:operator',
  });

  assert.equal(packet.status, 'blocked');
  assert.ok(packet.blockers.includes('runtime_patch_permit_issuance_request.readiness_not_allowed'));
}

testReadyRequestPacket();
testMissingRequestRefRequiresReview();
testBlockedReadinessBlocksPacket();

console.log('runtimePatchPermitIssuanceRequestPacket tests passed');
