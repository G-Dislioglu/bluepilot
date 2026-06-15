import type { RuntimeServerPatchApplicationReadiness } from './runtimeServerPatchApplicationReadiness.js';

export type RuntimeServerPatchOperatorDryRunStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimeServerPatchOperatorDryRunInput {
  readiness: RuntimeServerPatchApplicationReadiness;
  dryRunRef?: string;
  operatorRef?: string;
  simulationRef?: string;
}

export interface RuntimeServerPatchOperatorDryRun {
  status: RuntimeServerPatchOperatorDryRunStatus;
  dryRunAllowed: boolean;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executionExecuted: false;
  executionAllowed: false;
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

export function planRuntimeServerPatchOperatorDryRun(
  input: RuntimeServerPatchOperatorDryRunInput,
): RuntimeServerPatchOperatorDryRun {
  const dryRunRef = normalize(input.dryRunRef);
  const operatorRef = normalize(input.operatorRef);
  const simulationRef = normalize(input.simulationRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.readiness.status === 'blocked') {
    blockers.push(...input.readiness.blockers.map((blocker) => `runtime_patch_operator_dry_run.readiness_blocked:${blocker}`));
  }
  if (input.readiness.status === 'review_required') {
    reviewItems.push(...input.readiness.reviewItems.map((item) => `runtime_patch_operator_dry_run.readiness_review_required:${item}`));
  }
  if (!input.readiness.applicationReadinessAllowed) {
    blockers.push('runtime_patch_operator_dry_run.readiness_not_allowed');
  }
  if (input.readiness.patchApplyAllowed !== false) {
    blockers.push('runtime_patch_operator_dry_run.patch_apply_must_stay_closed');
  }
  if (input.readiness.serverMutationExecuted !== false || input.readiness.routeMutationExecuted !== false) {
    blockers.push('runtime_patch_operator_dry_run.mutation_must_not_be_executed');
  }
  if (input.readiness.executionExecuted !== false || input.readiness.executionAllowed !== false) {
    blockers.push('runtime_patch_operator_dry_run.execution_must_stay_closed');
  }
  if (!dryRunRef) {
    reviewItems.push('runtime_patch_operator_dry_run.dry_run_ref_required');
  }
  if (!operatorRef) {
    reviewItems.push('runtime_patch_operator_dry_run.operator_ref_required');
  }
  if (!simulationRef) {
    reviewItems.push('runtime_patch_operator_dry_run.simulation_ref_required');
  }

  const status: RuntimeServerPatchOperatorDryRunStatus = blockers.length > 0
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
    executionExecuted: false,
    executionAllowed: false,
    ...(dryRunRef ? { dryRunRef } : {}),
    ...(operatorRef ? { operatorRef } : {}),
    ...(simulationRef ? { simulationRef } : {}),
    routePath: input.readiness.routePath,
    envGateName: input.readiness.envGateName,
    proposedFiles: [...input.readiness.proposedFiles],
    simulatedSteps: [
      'load_runtime_patch_candidate_metadata',
      'confirm_operator_approval_ref',
      'compare_diff_ref_against_proposed_files',
      'verify_execution_closed_ref',
      'stop_before_any_server_route_or_execution_mutation',
    ],
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['record_runtime_patch_operator_dry_run_evidence']
      : status === 'review_required'
        ? ['complete_runtime_patch_operator_dry_run_review']
        : ['resolve_runtime_patch_operator_dry_run_blockers'],
  };
}
