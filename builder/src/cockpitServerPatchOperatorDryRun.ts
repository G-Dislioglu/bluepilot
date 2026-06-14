import type { CockpitServerPatchApplicationReadiness } from './cockpitServerPatchApplicationReadiness.js';

export type CockpitServerPatchOperatorDryRunStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitServerPatchOperatorDryRunInput {
  readiness: CockpitServerPatchApplicationReadiness;
  dryRunRef?: string;
  operatorRef?: string;
  simulationRef?: string;
}

export interface CockpitServerPatchOperatorDryRun {
  status: CockpitServerPatchOperatorDryRunStatus;
  dryRunAllowed: boolean;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
  dryRunRef?: string;
  operatorRef?: string;
  simulationRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  simulatedSteps: string[];
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

export function planCockpitServerPatchOperatorDryRun(
  input: CockpitServerPatchOperatorDryRunInput,
): CockpitServerPatchOperatorDryRun {
  const dryRunRef = normalize(input.dryRunRef);
  const operatorRef = normalize(input.operatorRef);
  const simulationRef = normalize(input.simulationRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.readiness.status === 'blocked') {
    blockers.push(...input.readiness.blockers.map((blocker) => `cockpit_patch_operator_dry_run.readiness_blocked:${blocker}`));
  }
  if (input.readiness.status === 'review_required') {
    reviewItems.push(...input.readiness.reviewItems.map((item) => `cockpit_patch_operator_dry_run.readiness_review_required:${item}`));
  }
  if (!input.readiness.applicationReadinessAllowed) {
    blockers.push('cockpit_patch_operator_dry_run.readiness_not_allowed');
  }
  if (input.readiness.patchApplyAllowed !== false) {
    blockers.push('cockpit_patch_operator_dry_run.patch_apply_must_stay_closed');
  }
  if (input.readiness.serverMutationExecuted !== false || input.readiness.routeMutationExecuted !== false) {
    blockers.push('cockpit_patch_operator_dry_run.mutation_must_not_be_executed');
  }
  if (input.readiness.executableActionAllowed !== false) {
    blockers.push('cockpit_patch_operator_dry_run.executable_actions_must_stay_disabled');
  }
  if (!dryRunRef) {
    reviewItems.push('cockpit_patch_operator_dry_run.dry_run_ref_required');
  }
  if (!operatorRef) {
    reviewItems.push('cockpit_patch_operator_dry_run.operator_ref_required');
  }
  if (!simulationRef) {
    reviewItems.push('cockpit_patch_operator_dry_run.simulation_ref_required');
  }

  const status: CockpitServerPatchOperatorDryRunStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    dryRunAllowed: status === 'ready',
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    ...(dryRunRef ? { dryRunRef } : {}),
    ...(operatorRef ? { operatorRef } : {}),
    ...(simulationRef ? { simulationRef } : {}),
    routePath: input.readiness.routePath,
    envGateName: input.readiness.envGateName,
    proposedFiles: [...input.readiness.proposedFiles],
    simulatedSteps: [
      'load_patch_candidate_metadata',
      'confirm_operator_approval_ref',
      'compare_diff_ref_against_proposed_files',
      'verify_env_gate_remains_default_off',
      'stop_before_any_server_or_route_mutation',
    ],
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['record_cockpit_patch_operator_dry_run_evidence']
      : status === 'review_required'
        ? ['complete_cockpit_patch_operator_dry_run_review']
        : ['resolve_cockpit_patch_operator_dry_run_blockers'],
  };
}
