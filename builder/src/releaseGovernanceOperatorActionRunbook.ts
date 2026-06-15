import type { ReleaseGovernanceOperatorApprovalGate } from './releaseGovernanceOperatorApprovalGate.js';

export type ReleaseGovernanceOperatorActionRunbookStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceOperatorActionRunbookInput {
  approvalGate: ReleaseGovernanceOperatorApprovalGate;
  runbookRef?: string;
  operatorRef?: string;
}

export interface ReleaseGovernanceOperatorActionRunbook {
  status: ReleaseGovernanceOperatorActionRunbookStatus;
  runbookAllowed: boolean;
  mergeAllowed: false;
  externalActionAllowed: false;
  runbookRef?: string;
  operatorRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function buildReleaseGovernanceOperatorActionRunbook(
  input: ReleaseGovernanceOperatorActionRunbookInput,
): ReleaseGovernanceOperatorActionRunbook {
  const runbookRef = normalize(input.runbookRef);
  const operatorRef = normalize(input.operatorRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.approvalGate.status === 'blocked') {
    blockers.push(...input.approvalGate.blockers.map((blocker) => `release_operator_action_runbook.approval_blocked:${blocker}`));
  }
  if (input.approvalGate.status === 'review_required') {
    reviewItems.push(...input.approvalGate.reviewItems.map((item) => `release_operator_action_runbook.approval_review_required:${item}`));
  }
  if (!input.approvalGate.operatorApprovalGateAllowed) {
    blockers.push('release_operator_action_runbook.approval_gate_not_allowed');
  }
  if (input.approvalGate.mergeAllowed !== false || input.approvalGate.externalActionAllowed !== false) {
    blockers.push('release_operator_action_runbook.merge_and_external_actions_must_stay_closed');
  }
  if (!runbookRef) {
    reviewItems.push('release_operator_action_runbook.runbook_ref_required');
  }
  if (!operatorRef) {
    reviewItems.push('release_operator_action_runbook.operator_ref_required');
  }

  const status: ReleaseGovernanceOperatorActionRunbookStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    runbookAllowed: status === 'ready',
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(runbookRef ? { runbookRef } : {}),
    ...(operatorRef ? { operatorRef } : {}),
    ...(input.approvalGate.releaseLabel ? { releaseLabel: input.approvalGate.releaseLabel } : {}),
    evidenceRefs: [...input.approvalGate.evidenceRefs],
    runbookSteps: [
      'read_release_governance_evidence',
      'confirm_operator_approval_window',
      'verify_merge_and_external_actions_remain_closed',
      'record_manual_decision_without_executing_merge',
    ],
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['hand_off_release_governance_runbook_to_operator']
      : status === 'review_required'
        ? ['complete_release_operator_action_runbook_review']
        : ['resolve_release_operator_action_runbook_blockers'],
  };
}
