import type { CockpitPatchPermitConsumePreflight } from './cockpitPatchPermitConsumePreflight.js';

export type CockpitPatchPermitConsumeAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitPatchPermitConsumeAuthorityInput {
  preflight: CockpitPatchPermitConsumePreflight;
  consumeAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface CockpitPatchPermitConsumeAuthority {
  status: CockpitPatchPermitConsumeAuthorityStatus;
  permitConsumeAuthorityAllowed: boolean;
  permitConsumeAuthorized: boolean;
  permitIssued: boolean;
  permitConsumed: false;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
  permitId?: string;
  consumeAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  authorizedConsume: {
    kind: 'cockpit_patch_permit_consume_authority';
    permitKind: 'cockpit_patch_application';
    permitRef?: string;
    preflightRef?: string;
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

export function authorizeCockpitPatchPermitConsume(
  input: CockpitPatchPermitConsumeAuthorityInput,
): CockpitPatchPermitConsumeAuthority {
  const consumeAuthorityId = normalize(input.consumeAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `cockpit_patch_permit_consume_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `cockpit_patch_permit_consume_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.permitConsumePreflightAllowed) {
    blockers.push('cockpit_patch_permit_consume_authority.preflight_not_allowed');
  }
  if (!input.preflight.permitIssued) {
    blockers.push('cockpit_patch_permit_consume_authority.permit_must_be_issued');
  }
  if (
    input.preflight.permitConsumed !== false
    || input.preflight.patchApplyAllowed !== false
    || input.preflight.serverMutationExecuted !== false
    || input.preflight.routeMutationExecuted !== false
    || input.preflight.executableActionAllowed !== false
  ) {
    blockers.push('cockpit_patch_permit_consume_authority.action_gates_must_stay_closed');
  }
  if (!consumeAuthorityId) {
    reviewItems.push('cockpit_patch_permit_consume_authority.consume_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('cockpit_patch_permit_consume_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('cockpit_patch_permit_consume_authority.expires_at_ref_required');
  }

  const status: CockpitPatchPermitConsumeAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    permitConsumeAuthorityAllowed: status === 'ready',
    permitConsumeAuthorized: status === 'ready',
    permitIssued: input.preflight.permitIssued,
    permitConsumed: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    ...(input.preflight.permitId ? { permitId: input.preflight.permitId } : {}),
    ...(consumeAuthorityId ? { consumeAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    routePath: input.preflight.routePath,
    envGateName: input.preflight.envGateName,
    proposedFiles: [...input.preflight.proposedFiles],
    evidenceRefs: unique([...input.preflight.evidenceRefs, consumeAuthorityId, expiresAtRef]),
    authorizedConsume: {
      kind: 'cockpit_patch_permit_consume_authority',
      permitKind: 'cockpit_patch_application',
      ...(input.preflight.permitId ? { permitRef: input.preflight.permitId } : {}),
      ...(input.preflight.consumeRef ? { preflightRef: input.preflight.consumeRef } : {}),
      ...(input.preflight.consumePolicyRef ? { policyRef: input.preflight.consumePolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_cockpit_patch_permit_consume_application_preflight']
      : status === 'review_required'
        ? ['complete_cockpit_patch_permit_consume_authority_review']
        : ['resolve_cockpit_patch_permit_consume_authority_blockers'],
  };
}
