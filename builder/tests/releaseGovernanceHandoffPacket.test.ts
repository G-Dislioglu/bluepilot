import assert from 'node:assert/strict';

import { buildReleaseGovernanceHandoffPacket } from '../src/releaseGovernanceHandoffPacket.js';
import type { PrReceiptGovernanceReleaseDecision } from '../src/prReceiptGovernanceReleaseDecision.js';

const decision: PrReceiptGovernanceReleaseDecision = {
  status: 'ready',
  releaseGovernanceAllowed: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  decisionRef: 'release-decision:bpk-062',
  governanceReviewerRef: 'reviewer:release-governance',
  releaseWindowRef: 'window:bpk-release-review',
  releaseLabel: 'bpk-062-fixture',
  evidenceRefs: ['review-packets/BPK-054.md', 'review-packets/BPK-058.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyHandoffPacket(): void {
  const packet = buildReleaseGovernanceHandoffPacket({
    decision,
    handoffRef: 'handoff:release-governance',
    operatorRef: 'operator:release-manager',
    recipientRef: 'recipient:next-bundle',
  });

  assert.equal(packet.status, 'ready');
  assert.equal(packet.handoffAllowed, true);
  assert.equal(packet.mergeAllowed, false);
  assert.equal(packet.externalActionAllowed, false);
  assert.ok(packet.packetSections.includes('closed_action_gates'));
}

function testMissingHandoffRefRequiresReview(): void {
  const packet = buildReleaseGovernanceHandoffPacket({
    decision,
    operatorRef: 'operator:release-manager',
    recipientRef: 'recipient:next-bundle',
  });

  assert.equal(packet.status, 'review_required');
  assert.ok(packet.reviewItems.includes('release_governance_handoff.handoff_ref_required'));
}

function testBlockedDecisionBlocksHandoff(): void {
  const packet = buildReleaseGovernanceHandoffPacket({
    decision: {
      ...decision,
      status: 'blocked',
      releaseGovernanceAllowed: false,
      blockers: ['pr_receipt_governance_release.promotion_not_allowed'],
    },
    handoffRef: 'handoff:release-governance',
    operatorRef: 'operator:release-manager',
    recipientRef: 'recipient:next-bundle',
  });

  assert.equal(packet.status, 'blocked');
  assert.ok(packet.blockers.includes('release_governance_handoff.release_governance_not_allowed'));
}

testReadyHandoffPacket();
testMissingHandoffRefRequiresReview();
testBlockedDecisionBlocksHandoff();

console.log('releaseGovernanceHandoffPacket tests passed');
