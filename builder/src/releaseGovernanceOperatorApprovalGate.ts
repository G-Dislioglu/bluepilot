import type { ReleaseGovernanceHandoffPacket } from './releaseGovernanceHandoffPacket.js';

export type ReleaseGovernanceOperatorApprovalGateStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceOperatorApprovalGateInput {
  handoffPacket: ReleaseGovernanceHandoffPacket;
  approvalRef?: string;
  approverRef?: string;
  approvalWindowRef?: string;
}

export interface ReleaseGovernanceOperatorApprovalGate {
  status: ReleaseGovernanceOperatorApprovalGateStatus;
  operatorApprovalGateAllowed: boolean;
  mergeAllowed: false;
  externalActionAllowed: false;
  approvalRef?: string;
  approverRef?: string;
  approvalWindowRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  packetSections: string[];
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

export function evaluateReleaseGovernanceOperatorApprovalGate(
  input: ReleaseGovernanceOperatorApprovalGateInput,
): ReleaseGovernanceOperatorApprovalGate {
  const approvalRef = normalize(input.approvalRef);
  const approverRef = normalize(input.approverRef);
  const approvalWindowRef = normalize(input.approvalWindowRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.handoffPacket.status === 'blocked') {
    blockers.push(...input.handoffPacket.blockers.map((blocker) => `release_operator_approval_gate.handoff_blocked:${blocker}`));
  }
  if (input.handoffPacket.status === 'review_required') {
    reviewItems.push(...input.handoffPacket.reviewItems.map((item) => `release_operator_approval_gate.handoff_review_required:${item}`));
  }
  if (!input.handoffPacket.handoffAllowed) {
    blockers.push('release_operator_approval_gate.handoff_not_allowed');
  }
  if (input.handoffPacket.mergeAllowed !== false || input.handoffPacket.externalActionAllowed !== false) {
    blockers.push('release_operator_approval_gate.merge_and_external_actions_must_stay_closed');
  }
  if (!approvalRef) {
    reviewItems.push('release_operator_approval_gate.approval_ref_required');
  }
  if (!approverRef) {
    reviewItems.push('release_operator_approval_gate.approver_ref_required');
  }
  if (!approvalWindowRef) {
    reviewItems.push('release_operator_approval_gate.approval_window_ref_required');
  }

  const status: ReleaseGovernanceOperatorApprovalGateStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    operatorApprovalGateAllowed: status === 'ready',
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(approvalRef ? { approvalRef } : {}),
    ...(approverRef ? { approverRef } : {}),
    ...(approvalWindowRef ? { approvalWindowRef } : {}),
    ...(input.handoffPacket.releaseLabel ? { releaseLabel: input.handoffPacket.releaseLabel } : {}),
    evidenceRefs: [...input.handoffPacket.evidenceRefs],
    packetSections: [...input.handoffPacket.packetSections],
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_operator_action']
      : status === 'review_required'
        ? ['complete_release_operator_approval_gate_review']
        : ['resolve_release_operator_approval_gate_blockers'],
  };
}
