import assert from 'node:assert/strict';

import { buildReleaseGovernanceRunbookEvidence } from '../src/releaseGovernanceRunbookEvidence.js';
import type { ReleaseGovernanceOperatorActionRunbook } from '../src/releaseGovernanceOperatorActionRunbook.js';

const runbook: ReleaseGovernanceOperatorActionRunbook = {
  status: 'ready',
  runbookAllowed: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  runbookRef: 'runbook:release-operator-action',
  operatorRef: 'operator:release-manager',
  releaseLabel: 'bpk-074-fixture',
  evidenceRefs: ['review-packets/BPK-074.md'],
  runbookSteps: ['verify_merge_and_external_actions_remain_closed', 'record_manual_decision_without_executing_merge'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyRunbookEvidence(): void {
  const evidence = buildReleaseGovernanceRunbookEvidence({
    runbook,
    evidenceRef: 'evidence:release-runbook',
    reviewerRef: 'reviewer:release-governance',
    handoffRef: 'handoff:operator',
  });

  assert.equal(evidence.status, 'ready');
  assert.equal(evidence.evidencePackAllowed, true);
  assert.equal(evidence.mergeAllowed, false);
  assert.equal(evidence.externalActionAllowed, false);
  assert.ok(evidence.runbookSteps.includes('record_manual_decision_without_executing_merge'));
}

function testMissingEvidenceRefRequiresReview(): void {
  const evidence = buildReleaseGovernanceRunbookEvidence({
    runbook,
    reviewerRef: 'reviewer:release-governance',
    handoffRef: 'handoff:operator',
  });

  assert.equal(evidence.status, 'review_required');
  assert.ok(evidence.reviewItems.includes('release_runbook_evidence.evidence_ref_required'));
}

function testBlockedRunbookBlocksEvidence(): void {
  const evidence = buildReleaseGovernanceRunbookEvidence({
    runbook: {
      ...runbook,
      status: 'blocked',
      runbookAllowed: false,
      blockers: ['release_operator_action_runbook.approval_gate_not_allowed'],
    },
    evidenceRef: 'evidence:release-runbook',
    reviewerRef: 'reviewer:release-governance',
    handoffRef: 'handoff:operator',
  });

  assert.equal(evidence.status, 'blocked');
  assert.ok(evidence.blockers.includes('release_runbook_evidence.runbook_not_allowed'));
}

testReadyRunbookEvidence();
testMissingEvidenceRefRequiresReview();
testBlockedRunbookBlocksEvidence();

console.log('releaseGovernanceRunbookEvidence tests passed');
