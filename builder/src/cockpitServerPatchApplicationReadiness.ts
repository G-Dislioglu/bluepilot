import type { CockpitServerPatchCandidate } from './cockpitServerPatchCandidate.js';

export type CockpitServerPatchApplicationReadinessStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitServerPatchApplicationReadinessInput {
  candidate: CockpitServerPatchCandidate;
  readinessRef?: string;
  operatorApprovalRef?: string;
  diffRef?: string;
  patchWindowRef?: string;
}

export interface CockpitServerPatchApplicationReadiness {
  status: CockpitServerPatchApplicationReadinessStatus;
  applicationReadinessAllowed: boolean;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
  readinessRef?: string;
  operatorApprovalRef?: string;
  diffRef?: string;
  patchWindowRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  guardChecks: string[];
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

export function assessCockpitServerPatchApplicationReadiness(
  input: CockpitServerPatchApplicationReadinessInput,
): CockpitServerPatchApplicationReadiness {
  const readinessRef = normalize(input.readinessRef);
  const operatorApprovalRef = normalize(input.operatorApprovalRef);
  const diffRef = normalize(input.diffRef);
  const patchWindowRef = normalize(input.patchWindowRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.candidate.status === 'blocked') {
    blockers.push(...input.candidate.blockers.map((blocker) => `cockpit_patch_application_readiness.candidate_blocked:${blocker}`));
  }
  if (input.candidate.status === 'review_required') {
    reviewItems.push(...input.candidate.reviewItems.map((item) => `cockpit_patch_application_readiness.candidate_review_required:${item}`));
  }
  if (!input.candidate.patchCandidateAllowed) {
    blockers.push('cockpit_patch_application_readiness.candidate_not_allowed');
  }
  if (input.candidate.patchApplyAllowed !== false) {
    blockers.push('cockpit_patch_application_readiness.patch_apply_must_stay_closed');
  }
  if (input.candidate.serverMutationExecuted !== false || input.candidate.routeMutationExecuted !== false) {
    blockers.push('cockpit_patch_application_readiness.mutation_must_not_be_executed');
  }
  if (input.candidate.executableActionAllowed !== false) {
    blockers.push('cockpit_patch_application_readiness.executable_actions_must_stay_disabled');
  }
  if (!readinessRef) {
    reviewItems.push('cockpit_patch_application_readiness.readiness_ref_required');
  }
  if (!operatorApprovalRef) {
    reviewItems.push('cockpit_patch_application_readiness.operator_approval_ref_required');
  }
  if (!diffRef) {
    reviewItems.push('cockpit_patch_application_readiness.diff_ref_required');
  }

  const status: CockpitServerPatchApplicationReadinessStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    applicationReadinessAllowed: status === 'ready',
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    ...(readinessRef ? { readinessRef } : {}),
    ...(operatorApprovalRef ? { operatorApprovalRef } : {}),
    ...(diffRef ? { diffRef } : {}),
    ...(patchWindowRef ? { patchWindowRef } : {}),
    routePath: input.candidate.routePath,
    envGateName: input.candidate.envGateName,
    proposedFiles: [...input.candidate.proposedFiles],
    guardChecks: unique([
      ...input.candidate.guardChecks,
      'application_readiness_only',
      'patch_apply_allowed_false',
      'operator_approval_ref_required',
      'diff_ref_required',
    ]),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_cockpit_server_patch_application']
      : status === 'review_required'
        ? ['complete_cockpit_patch_application_readiness_review']
        : ['resolve_cockpit_patch_application_readiness_blockers'],
  };
}
