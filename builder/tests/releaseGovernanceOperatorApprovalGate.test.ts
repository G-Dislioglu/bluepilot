import assert from 'node:assert/strict';

import { evaluateReleaseGovernanceOperatorApprovalGate } from '../src/releaseGovernanceOperatorApprovalGate.js';
import type { ReleaseGovernanceHandoffPacket } from '../src/releaseGovernanceHandoffPacket.js';

const handoffPacket: ReleaseGovernanceHandoffPacket = {
  status: 'ready',
  handoffAllowed: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  handoffRef: 'handoff:release-governance',
  operatorRef: 'operator:release-manager',
  recipientRef: 'recipient:next-bundle',
  releaseLabel: 'bpk-066-fixture',
  evidenceRefs: ['review-packets/BPK-066.md'],
  packetSections: ['release_decision_summary', 'closed_action_gates'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyReleaseOperatorApprovalGate(): void {
  const gate = evaluateReleaseGovernanceOperatorApprovalGate({
    handoffPacket,
    approvalRef: 'approval:release-operator',
    approverRef: 'approver:operator',
    approvalWindowRef: 'window:release-review',
  });

  assert.equal(gate.status, 'ready');
  assert.equal(gate.operatorApprovalGateAllowed, true);
  assert.equal(gate.mergeAllowed, false);
  assert.equal(gate.externalActionAllowed, false);
  assert.deepEqual(gate.evidenceRefs, ['review-packets/BPK-066.md']);
}

function testMissingApprovalRefRequiresReview(): void {
  const gate = evaluateReleaseGovernanceOperatorApprovalGate({
    handoffPacket,
    approverRef: 'approver:operator',
    approvalWindowRef: 'window:release-review',
  });

  assert.equal(gate.status, 'review_required');
  assert.ok(gate.reviewItems.includes('release_operator_approval_gate.approval_ref_required'));
}

function testBlockedHandoffBlocksApprovalGate(): void {
  const gate = evaluateReleaseGovernanceOperatorApprovalGate({
    handoffPacket: {
      ...handoffPacket,
      status: 'blocked',
      handoffAllowed: false,
      blockers: ['release_governance_handoff.release_governance_not_allowed'],
    },
    approvalRef: 'approval:release-operator',
    approverRef: 'approver:operator',
    approvalWindowRef: 'window:release-review',
  });

  assert.equal(gate.status, 'blocked');
  assert.ok(gate.blockers.includes('release_operator_approval_gate.handoff_not_allowed'));
}

testReadyReleaseOperatorApprovalGate();
testMissingApprovalRefRequiresReview();
testBlockedHandoffBlocksApprovalGate();

console.log('releaseGovernanceOperatorApprovalGate tests passed');
