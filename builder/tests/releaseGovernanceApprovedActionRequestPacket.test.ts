import assert from 'node:assert/strict';

import { buildReleaseGovernanceApprovedActionRequestPacket } from '../src/releaseGovernanceApprovedActionRequestPacket.js';
import type { ReleaseGovernanceApprovedActionReadiness } from '../src/releaseGovernanceApprovedActionReadiness.js';

const readiness: ReleaseGovernanceApprovedActionReadiness = {
  status: 'ready',
  approvedActionReadinessAllowed: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  actionReadinessRef: 'action-readiness:release',
  approverRef: 'approver:operator',
  policyRef: 'policy:release-handoff',
  releaseLabel: 'bpk-091-094-issuance-readiness',
  evidenceRefs: ['review-packets/BPK-094.md'],
  runbookSteps: ['verify_checks'],
  handoffPacket: { kind: 'release_governance_approved_action' },
  actionGate: { kind: 'release_governance_approved_action_readiness' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyRequestPacket(): void {
  const packet = buildReleaseGovernanceApprovedActionRequestPacket({
    readiness,
    requestRef: 'request:release',
    requesterRef: 'requester:operator',
  });

  assert.equal(packet.status, 'ready');
  assert.equal(packet.requestPacketAllowed, true);
  assert.equal(packet.mergeAllowed, false);
  assert.equal(packet.externalActionAllowed, false);
  assert.equal(packet.packet.kind, 'release_governance_approved_action_request');
}

function testMissingRequestRefRequiresReview(): void {
  const packet = buildReleaseGovernanceApprovedActionRequestPacket({ readiness, requesterRef: 'requester:operator' });

  assert.equal(packet.status, 'review_required');
  assert.ok(packet.reviewItems.includes('release_governance_approved_action_request.request_ref_required'));
}

function testBlockedReadinessBlocksPacket(): void {
  const packet = buildReleaseGovernanceApprovedActionRequestPacket({
    readiness: { ...readiness, status: 'blocked', approvedActionReadinessAllowed: false, blockers: ['blocked'] },
    requestRef: 'request:release',
    requesterRef: 'requester:operator',
  });

  assert.equal(packet.status, 'blocked');
  assert.ok(packet.blockers.includes('release_governance_approved_action_request.readiness_not_allowed'));
}

testReadyRequestPacket();
testMissingRequestRefRequiresReview();
testBlockedReadinessBlocksPacket();

console.log('releaseGovernanceApprovedActionRequestPacket tests passed');
