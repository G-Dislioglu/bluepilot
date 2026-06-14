import type { ReleaseGovernanceApprovedActionReadiness } from './releaseGovernanceApprovedActionReadiness.js';

export type ReleaseGovernanceApprovedActionRequestPacketStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionRequestPacketInput {
  readiness: ReleaseGovernanceApprovedActionReadiness;
  requestRef?: string;
  requesterRef?: string;
}

export interface ReleaseGovernanceApprovedActionRequestPacket {
  status: ReleaseGovernanceApprovedActionRequestPacketStatus;
  requestPacketAllowed: boolean;
  mergeAllowed: false;
  externalActionAllowed: false;
  requestRef?: string;
  requesterRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  packet: {
    kind: 'release_governance_approved_action_request';
    approverRef?: string;
    policyRef?: string;
  };
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

export function buildReleaseGovernanceApprovedActionRequestPacket(
  input: ReleaseGovernanceApprovedActionRequestPacketInput,
): ReleaseGovernanceApprovedActionRequestPacket {
  const requestRef = normalize(input.requestRef);
  const requesterRef = normalize(input.requesterRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.readiness.status === 'blocked') {
    blockers.push(...input.readiness.blockers.map((blocker) => `release_governance_approved_action_request.evidence_blocked:${blocker}`));
  }
  if (input.readiness.status === 'review_required') {
    reviewItems.push(...input.readiness.reviewItems.map((item) => `release_governance_approved_action_request.readiness_review_required:${item}`));
  }
  if (!input.readiness.approvedActionReadinessAllowed) {
    blockers.push('release_governance_approved_action_request.readiness_not_allowed');
  }
  if (input.readiness.mergeAllowed !== false || input.readiness.externalActionAllowed !== false) {
    blockers.push('release_governance_approved_action_request.merge_and_external_actions_must_stay_closed');
  }
  if (!requestRef) {
    reviewItems.push('release_governance_approved_action_request.request_ref_required');
  }
  if (!requesterRef) {
    reviewItems.push('release_governance_approved_action_request.requester_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionRequestPacketStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    requestPacketAllowed: status === 'ready',
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(requestRef ? { requestRef } : {}),
    ...(requesterRef ? { requesterRef } : {}),
    ...(input.readiness.releaseLabel ? { releaseLabel: input.readiness.releaseLabel } : {}),
    evidenceRefs: unique([...input.readiness.evidenceRefs, requestRef]),
    runbookSteps: [...input.readiness.runbookSteps],
    packet: {
      kind: 'release_governance_approved_action_request',
      ...(input.readiness.approverRef ? { approverRef: input.readiness.approverRef } : {}),
      ...(input.readiness.policyRef ? { policyRef: input.readiness.policyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['submit_release_governance_approved_action_request_to_authority_review']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_request_review']
        : ['resolve_release_governance_approved_action_request_blockers'],
  };
}
