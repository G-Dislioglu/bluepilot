import type { CockpitPatchPermitIssuanceReadiness } from './cockpitPatchPermitIssuanceReadiness.js';

export type CockpitPatchPermitIssuanceRequestPacketStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitPatchPermitIssuanceRequestPacketInput {
  readiness: CockpitPatchPermitIssuanceReadiness;
  requestRef?: string;
  requesterRef?: string;
}

export interface CockpitPatchPermitIssuanceRequestPacket {
  status: CockpitPatchPermitIssuanceRequestPacketStatus;
  requestPacketAllowed: boolean;
  permitIssued: false;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
  requestRef?: string;
  requesterRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  packet: {
    kind: 'cockpit_patch_permit_issuance_request';
    permitKind: 'cockpit_patch_application';
    issuerRef?: string;
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

export function buildCockpitPatchPermitIssuanceRequestPacket(
  input: CockpitPatchPermitIssuanceRequestPacketInput,
): CockpitPatchPermitIssuanceRequestPacket {
  const requestRef = normalize(input.requestRef);
  const requesterRef = normalize(input.requesterRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.readiness.status === 'blocked') {
    blockers.push(...input.readiness.blockers.map((blocker) => `cockpit_patch_permit_issuance_request.evidence_blocked:${blocker}`));
  }
  if (input.readiness.status === 'review_required') {
    reviewItems.push(...input.readiness.reviewItems.map((item) => `cockpit_patch_permit_issuance_request.readiness_review_required:${item}`));
  }
  if (!input.readiness.permitIssuanceReadinessAllowed) {
    blockers.push('cockpit_patch_permit_issuance_request.readiness_not_allowed');
  }
  if (
    input.readiness.permitIssued !== false
    || input.readiness.patchApplyAllowed !== false
    || input.readiness.serverMutationExecuted !== false
    || input.readiness.routeMutationExecuted !== false
    || input.readiness.executableActionAllowed !== false
  ) {
    blockers.push('cockpit_patch_permit_issuance_request.action_gates_must_stay_closed');
  }
  if (!requestRef) {
    reviewItems.push('cockpit_patch_permit_issuance_request.request_ref_required');
  }
  if (!requesterRef) {
    reviewItems.push('cockpit_patch_permit_issuance_request.requester_ref_required');
  }

  const status: CockpitPatchPermitIssuanceRequestPacketStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    requestPacketAllowed: status === 'ready',
    permitIssued: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    ...(requestRef ? { requestRef } : {}),
    ...(requesterRef ? { requesterRef } : {}),
    routePath: input.readiness.routePath,
    envGateName: input.readiness.envGateName,
    proposedFiles: [...input.readiness.proposedFiles],
    evidenceRefs: unique([...input.readiness.evidenceRefs, requestRef]),
    packet: {
      kind: 'cockpit_patch_permit_issuance_request',
      permitKind: 'cockpit_patch_application',
      ...(input.readiness.issuerRef ? { issuerRef: input.readiness.issuerRef } : {}),
      ...(input.readiness.policyRef ? { policyRef: input.readiness.policyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['submit_cockpit_patch_permit_issuance_request_to_authority_review']
      : status === 'review_required'
        ? ['complete_cockpit_patch_permit_issuance_request_review']
        : ['resolve_cockpit_patch_permit_issuance_request_blockers'],
  };
}
