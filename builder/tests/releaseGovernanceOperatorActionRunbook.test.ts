import assert from 'node:assert/strict';

import { buildReleaseGovernanceOperatorActionRunbook } from '../src/releaseGovernanceOperatorActionRunbook.js';
import type { ReleaseGovernanceOperatorApprovalGate } from '../src/releaseGovernanceOperatorApprovalGate.js';

const approvalGate: ReleaseGovernanceOperatorApprovalGate = {
  status: 'ready',
  operatorApprovalGateAllowed: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  approvalRef: 'approval:release-operator',
  approverRef: 'approver:operator',
  approvalWindowRef: 'window:release-review',
  releaseLabel: 'bpk-070-fixture',
  evidenceRefs: ['review-packets/BPK-070.md'],
  packetSections: ['release_decision_summary', 'closed_action_gates'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyOperatorActionRunbook(): void {
  const runbook = buildReleaseGovernanceOperatorActionRunbook({
    approvalGate,
    runbookRef: 'runbook:release-operator-action',
    operatorRef: 'operator:release-manager',
  });

  assert.equal(runbook.status, 'ready');
  assert.equal(runbook.runbookAllowed, true);
  assert.equal(runbook.mergeAllowed, false);
  assert.equal(runbook.externalActionAllowed, false);
  assert.ok(runbook.runbookSteps.includes('record_manual_decision_without_executing_merge'));
}

function testMissingRunbookRefRequiresReview(): void {
  const runbook = buildReleaseGovernanceOperatorActionRunbook({
    approvalGate,
    operatorRef: 'operator:release-manager',
  });

  assert.equal(runbook.status, 'review_required');
  assert.ok(runbook.reviewItems.includes('release_operator_action_runbook.runbook_ref_required'));
}

function testBlockedApprovalGateBlocksRunbook(): void {
  const runbook = buildReleaseGovernanceOperatorActionRunbook({
    approvalGate: {
      ...approvalGate,
      status: 'blocked',
      operatorApprovalGateAllowed: false,
      blockers: ['release_operator_approval_gate.handoff_not_allowed'],
    },
    runbookRef: 'runbook:release-operator-action',
    operatorRef: 'operator:release-manager',
  });

  assert.equal(runbook.status, 'blocked');
  assert.ok(runbook.blockers.includes('release_operator_action_runbook.approval_gate_not_allowed'));
}

testReadyOperatorActionRunbook();
testMissingRunbookRefRequiresReview();
testBlockedApprovalGateBlocksRunbook();

console.log('releaseGovernanceOperatorActionRunbook tests passed');
