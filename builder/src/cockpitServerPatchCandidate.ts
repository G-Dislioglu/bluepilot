import type { CockpitMountPatchPreflight } from './cockpitMountPatchPreflight.js';

export type CockpitServerPatchCandidateStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitServerPatchCandidateInput {
  preflight: CockpitMountPatchPreflight;
  candidateRef?: string;
  authorRef?: string;
  candidateSummary?: string;
}

export interface CockpitServerPatchCandidate {
  status: CockpitServerPatchCandidateStatus;
  patchCandidateAllowed: boolean;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
  candidateRef?: string;
  authorRef?: string;
  candidateSummary?: string;
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

export function buildCockpitServerPatchCandidate(
  input: CockpitServerPatchCandidateInput,
): CockpitServerPatchCandidate {
  const candidateRef = normalize(input.candidateRef);
  const authorRef = normalize(input.authorRef);
  const candidateSummary = normalize(input.candidateSummary);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `cockpit_server_patch_candidate.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `cockpit_server_patch_candidate.preflight_review_required:${item}`));
  }
  if (!input.preflight.patchPreflightAllowed) {
    blockers.push('cockpit_server_patch_candidate.preflight_not_allowed');
  }
  if (input.preflight.serverMutationExecuted !== false || input.preflight.routeMutationExecuted !== false) {
    blockers.push('cockpit_server_patch_candidate.preflight_mutation_must_not_be_executed');
  }
  if (input.preflight.executableActionAllowed !== false) {
    blockers.push('cockpit_server_patch_candidate.executable_actions_must_stay_disabled');
  }
  if (!candidateRef) {
    reviewItems.push('cockpit_server_patch_candidate.candidate_ref_required');
  }
  if (!authorRef) {
    reviewItems.push('cockpit_server_patch_candidate.author_ref_required');
  }

  const status: CockpitServerPatchCandidateStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    patchCandidateAllowed: status === 'ready',
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    ...(candidateRef ? { candidateRef } : {}),
    ...(authorRef ? { authorRef } : {}),
    ...(candidateSummary ? { candidateSummary } : {}),
    routePath: input.preflight.routePath,
    envGateName: input.preflight.envGateName,
    proposedFiles: [...input.preflight.proposedFiles],
    guardChecks: [
      'patch_apply_allowed_false',
      'server_mutation_executed_false',
      'route_mutation_executed_false',
      'executable_action_allowed_false',
      `env_gate:${input.preflight.envGateName}`,
    ],
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_cockpit_server_patch_application_readiness']
      : status === 'review_required'
        ? ['complete_cockpit_server_patch_candidate_review']
        : ['resolve_cockpit_server_patch_candidate_blockers'],
  };
}
