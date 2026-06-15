import type { CockpitPatchPermitConsumeAuthority } from './cockpitPatchPermitConsumeAuthority.js';

export type CockpitPatchPermitConsumeApplicationPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitPatchPermitConsumeApplicationPreflightInput {
  authority: CockpitPatchPermitConsumeAuthority;
  applicationRef?: string;
  operatorRef?: string;
  applicationPolicyRef?: string;
}

export interface CockpitPatchPermitConsumeApplicationPreflight {
  status: CockpitPatchPermitConsumeApplicationPreflightStatus;
  consumeApplicationPreflightAllowed: boolean;
  permitConsumeAuthorized: boolean;
  permitIssued: boolean;
  permitConsumed: false;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
  permitId?: string;
  consumeAuthorityId?: string;
  applicationRef?: string;
  operatorRef?: string;
  applicationPolicyRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  consumeApplication: {
    kind: 'cockpit_patch_permit_consume_application_preflight';
    permitKind: 'cockpit_patch_application';
    permitRef?: string;
    authorityRef?: string;
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

export function preflightCockpitPatchPermitConsumeApplication(
  input: CockpitPatchPermitConsumeApplicationPreflightInput,
): CockpitPatchPermitConsumeApplicationPreflight {
  const applicationRef = normalize(input.applicationRef);
  const operatorRef = normalize(input.operatorRef);
  const applicationPolicyRef = normalize(input.applicationPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `cockpit_patch_permit_consume_application_preflight.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `cockpit_patch_permit_consume_application_preflight.authority_review_required:${item}`));
  }
  if (!input.authority.permitConsumeAuthorityAllowed) {
    blockers.push('cockpit_patch_permit_consume_application_preflight.authority_not_allowed');
  }
  if (!input.authority.permitConsumeAuthorized) {
    blockers.push('cockpit_patch_permit_consume_application_preflight.consume_must_be_authorized');
  }
  if (
    input.authority.permitConsumed !== false
    || input.authority.patchApplyAllowed !== false
    || input.authority.serverMutationExecuted !== false
    || input.authority.routeMutationExecuted !== false
    || input.authority.executableActionAllowed !== false
  ) {
    blockers.push('cockpit_patch_permit_consume_application_preflight.action_gates_must_stay_closed');
  }
  if (!applicationRef) {
    reviewItems.push('cockpit_patch_permit_consume_application_preflight.application_ref_required');
  }
  if (!operatorRef) {
    reviewItems.push('cockpit_patch_permit_consume_application_preflight.operator_ref_required');
  }
  if (!applicationPolicyRef) {
    reviewItems.push('cockpit_patch_permit_consume_application_preflight.application_policy_ref_required');
  }

  const status: CockpitPatchPermitConsumeApplicationPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeApplicationPreflightAllowed: status === 'ready',
    permitConsumeAuthorized: input.authority.permitConsumeAuthorized,
    permitIssued: input.authority.permitIssued,
    permitConsumed: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    ...(input.authority.permitId ? { permitId: input.authority.permitId } : {}),
    ...(input.authority.consumeAuthorityId ? { consumeAuthorityId: input.authority.consumeAuthorityId } : {}),
    ...(applicationRef ? { applicationRef } : {}),
    ...(operatorRef ? { operatorRef } : {}),
    ...(applicationPolicyRef ? { applicationPolicyRef } : {}),
    routePath: input.authority.routePath,
    envGateName: input.authority.envGateName,
    proposedFiles: [...input.authority.proposedFiles],
    evidenceRefs: unique([...input.authority.evidenceRefs, applicationRef, applicationPolicyRef]),
    consumeApplication: {
      kind: 'cockpit_patch_permit_consume_application_preflight',
      permitKind: 'cockpit_patch_application',
      ...(input.authority.permitId ? { permitRef: input.authority.permitId } : {}),
      ...(input.authority.consumeAuthorityId ? { authorityRef: input.authority.consumeAuthorityId } : {}),
      ...(applicationPolicyRef ? { policyRef: applicationPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_cockpit_patch_permit_consume_application_authority']
      : status === 'review_required'
        ? ['complete_cockpit_patch_permit_consume_application_preflight_review']
        : ['resolve_cockpit_patch_permit_consume_application_preflight_blockers'],
  };
}
