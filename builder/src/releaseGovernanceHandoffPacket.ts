import type { PrReceiptGovernanceReleaseDecision } from './prReceiptGovernanceReleaseDecision.js';

export type ReleaseGovernanceHandoffPacketStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceHandoffPacketInput {
  decision: PrReceiptGovernanceReleaseDecision;
  handoffRef?: string;
  operatorRef?: string;
  recipientRef?: string;
}

export interface ReleaseGovernanceHandoffPacket {
  status: ReleaseGovernanceHandoffPacketStatus;
  handoffAllowed: boolean;
  mergeAllowed: false;
  externalActionAllowed: false;
  handoffRef?: string;
  operatorRef?: string;
  recipientRef?: string;
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

export function buildReleaseGovernanceHandoffPacket(
  input: ReleaseGovernanceHandoffPacketInput,
): ReleaseGovernanceHandoffPacket {
  const handoffRef = normalize(input.handoffRef);
  const operatorRef = normalize(input.operatorRef);
  const recipientRef = normalize(input.recipientRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.decision.status === 'blocked') {
    blockers.push(...input.decision.blockers.map((blocker) => `release_governance_handoff.decision_blocked:${blocker}`));
  }
  if (input.decision.status === 'review_required') {
    reviewItems.push(...input.decision.reviewItems.map((item) => `release_governance_handoff.decision_review_required:${item}`));
  }
  if (!input.decision.releaseGovernanceAllowed) {
    blockers.push('release_governance_handoff.release_governance_not_allowed');
  }
  if (input.decision.mergeAllowed !== false || input.decision.externalActionAllowed !== false) {
    blockers.push('release_governance_handoff.merge_and_external_actions_must_stay_closed');
  }
  if (!handoffRef) {
    reviewItems.push('release_governance_handoff.handoff_ref_required');
  }
  if (!operatorRef) {
    reviewItems.push('release_governance_handoff.operator_ref_required');
  }
  if (!recipientRef) {
    reviewItems.push('release_governance_handoff.recipient_ref_required');
  }

  const status: ReleaseGovernanceHandoffPacketStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    handoffAllowed: status === 'ready',
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(handoffRef ? { handoffRef } : {}),
    ...(operatorRef ? { operatorRef } : {}),
    ...(recipientRef ? { recipientRef } : {}),
    ...(input.decision.releaseLabel ? { releaseLabel: input.decision.releaseLabel } : {}),
    evidenceRefs: [...input.decision.evidenceRefs],
    packetSections: [
      'release_decision_summary',
      'evidence_refs',
      'closed_action_gates',
      'operator_handoff_next_actions',
    ],
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['request_release_governance_operator_approval_gate']
      : status === 'review_required'
        ? ['complete_release_governance_handoff_review']
        : ['resolve_release_governance_handoff_blockers'],
  };
}
