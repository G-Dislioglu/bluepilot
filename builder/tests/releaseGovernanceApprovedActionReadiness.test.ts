import assert from 'node:assert/strict';

import { buildReleaseGovernanceApprovedActionReadiness } from '../src/releaseGovernanceApprovedActionReadiness.js';
import type { ReleaseGovernanceHandoffPrepEvidence } from '../src/releaseGovernanceHandoffPrepEvidence.js';

const evidence: ReleaseGovernanceHandoffPrepEvidence = {
  status: 'ready',
  evidencePackAllowed: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  evidenceRef: 'review-packets/BPK-090.md',
  reviewerRef: 'reviewer:operator',
  releaseLabel: 'bpk-087-090-prep-evidence-bundle',
  evidenceRefs: ['review-packets/BPK-090.md'],
  runbookSteps: ['verify_checks', 'prepare_handoff'],
  handoffPacket: { kind: 'release_governance_approved_action', decisionRef: 'decision:release', approvalRef: 'approval:release' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyApprovedActionReadiness(): void {
  const readiness = buildReleaseGovernanceApprovedActionReadiness({
    evidence,
    actionReadinessRef: 'action-readiness:release',
    approverRef: 'approver:operator',
    policyRef: 'policy:release-handoff',
  });

  assert.equal(readiness.status, 'ready');
  assert.equal(readiness.approvedActionReadinessAllowed, true);
  assert.equal(readiness.mergeAllowed, false);
  assert.equal(readiness.externalActionAllowed, false);
  assert.equal(readiness.actionGate.kind, 'release_governance_approved_action_readiness');
}

function testMissingPolicyRequiresReview(): void {
  const readiness = buildReleaseGovernanceApprovedActionReadiness({
    evidence,
    actionReadinessRef: 'action-readiness:release',
    approverRef: 'approver:operator',
  });

  assert.equal(readiness.status, 'review_required');
  assert.ok(readiness.reviewItems.includes('release_governance_approved_action_readiness.policy_ref_required'));
}

function testBlockedEvidenceBlocksReadiness(): void {
  const readiness = buildReleaseGovernanceApprovedActionReadiness({
    evidence: { ...evidence, status: 'blocked', evidencePackAllowed: false, blockers: ['blocked'] },
    actionReadinessRef: 'action-readiness:release',
    approverRef: 'approver:operator',
    policyRef: 'policy:release-handoff',
  });

  assert.equal(readiness.status, 'blocked');
  assert.ok(readiness.blockers.includes('release_governance_approved_action_readiness.evidence_pack_not_allowed'));
}

testReadyApprovedActionReadiness();
testMissingPolicyRequiresReview();
testBlockedEvidenceBlocksReadiness();

console.log('releaseGovernanceApprovedActionReadiness tests passed');
