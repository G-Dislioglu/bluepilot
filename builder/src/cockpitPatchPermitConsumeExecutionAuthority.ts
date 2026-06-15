import type { CockpitPatchPermitConsumeExecutionPreflight } from './cockpitPatchPermitConsumeExecutionPreflight.js';

export type CockpitPatchPermitConsumeExecutionAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitPatchPermitConsumeExecutionAuthorityInput {
  preflight: CockpitPatchPermitConsumeExecutionPreflight;
  executionAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface CockpitPatchPermitConsumeExecutionAuthority {
  status: CockpitPatchPermitConsumeExecutionAuthorityStatus;
  consumeExecutionAuthorityAllowed: boolean;
  consumeExecutionAuthorized: boolean;
  consumeApplicationAuthorized: boolean;
  permitConsumeAuthorized: boolean;
  permitIssued: boolean;
  permitConsumed: false;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
  permitId?: string;
  consumeAuthorityId?: string;
  applicationAuthorityId?: string;
  executionAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  authorizedExecution: {
    kind: 'cockpit_patch_permit_consume_execution_authority';
    permitKind: 'cockpit_patch_application';
    permitRef?: string;
    applicationAuthorityRef?: string;
    executionPreflightRef?: string;
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

export function authorizeCockpitPatchPermitConsumeExecution(
  input: CockpitPatchPermitConsumeExecutionAuthorityInput,
): CockpitPatchPermitConsumeExecutionAuthority {
  const executionAuthorityId = normalize(input.executionAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `cockpit_patch_permit_consume_execution_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `cockpit_patch_permit_consume_execution_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeExecutionPreflightAllowed) {
    blockers.push('cockpit_patch_permit_consume_execution_authority.preflight_not_allowed');
  }
  if (!input.preflight.consumeApplicationAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_authority.application_must_be_authorized');
  }
  if (!input.preflight.permitConsumeAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_authority.consume_must_be_authorized');
  }
  if (
    input.preflight.permitConsumed !== false
    || input.preflight.patchApplyAllowed !== false
    || input.preflight.serverMutationExecuted !== false
    || input.preflight.routeMutationExecuted !== false
    || input.preflight.executableActionAllowed !== false
  ) {
    blockers.push('cockpit_patch_permit_consume_execution_authority.action_gates_must_stay_closed');
  }
  if (!executionAuthorityId) {
    reviewItems.push('cockpit_patch_permit_consume_execution_authority.execution_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_authority.expires_at_ref_required');
  }

  const status: CockpitPatchPermitConsumeExecutionAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionAuthorityAllowed: status === 'ready',
    consumeExecutionAuthorized: status === 'ready',
    consumeApplicationAuthorized: input.preflight.consumeApplicationAuthorized,
    permitConsumeAuthorized: input.preflight.permitConsumeAuthorized,
    permitIssued: input.preflight.permitIssued,
    permitConsumed: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    ...(input.preflight.permitId ? { permitId: input.preflight.permitId } : {}),
    ...(input.preflight.consumeAuthorityId ? { consumeAuthorityId: input.preflight.consumeAuthorityId } : {}),
    ...(input.preflight.applicationAuthorityId ? { applicationAuthorityId: input.preflight.applicationAuthorityId } : {}),
    ...(executionAuthorityId ? { executionAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    routePath: input.preflight.routePath,
    envGateName: input.preflight.envGateName,
    proposedFiles: [...input.preflight.proposedFiles],
    evidenceRefs: unique([...input.preflight.evidenceRefs, executionAuthorityId, expiresAtRef]),
    authorizedExecution: {
      kind: 'cockpit_patch_permit_consume_execution_authority',
      permitKind: 'cockpit_patch_application',
      ...(input.preflight.permitId ? { permitRef: input.preflight.permitId } : {}),
      ...(input.preflight.applicationAuthorityId ? { applicationAuthorityRef: input.preflight.applicationAuthorityId } : {}),
      ...(input.preflight.executionPreflightRef ? { executionPreflightRef: input.preflight.executionPreflightRef } : {}),
      ...(input.preflight.executionPolicyRef ? { policyRef: input.preflight.executionPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_cockpit_patch_permit_consume_execution_receipt_preflight']
      : status === 'review_required'
        ? ['complete_cockpit_patch_permit_consume_execution_authority_review']
        : ['resolve_cockpit_patch_permit_consume_execution_authority_blockers'],
  };
}
