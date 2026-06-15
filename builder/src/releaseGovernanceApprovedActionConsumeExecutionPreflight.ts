import type { ReleaseGovernanceApprovedActionConsumeApplicationAuthority } from './releaseGovernanceApprovedActionConsumeApplicationAuthority.js';

export type ReleaseGovernanceApprovedActionConsumeExecutionPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeExecutionPreflightInput {
  authority: ReleaseGovernanceApprovedActionConsumeApplicationAuthority;
  executionPreflightRef?: string;
  executorRef?: string;
  executionPolicyRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeExecutionPreflight {
  status: ReleaseGovernanceApprovedActionConsumeExecutionPreflightStatus;
  consumeExecutionPreflightAllowed: boolean;
  consumeApplicationAuthorized: boolean;
  approvedActionConsumeAuthorized: boolean;
  approvedActionAuthorized: boolean;
  actionConsumed: false;
  mergeAllowed: false;
  externalActionAllowed: false;
  actionId?: string;
  consumeAuthorityId?: string;
  applicationAuthorityId?: string;
  executionPreflightRef?: string;
  executorRef?: string;
  executionPolicyRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  consumeExecution: {
    kind: 'release_governance_approved_action_consume_execution_preflight';
    actionRef?: string;
    applicationAuthorityRef?: string;
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

export function preflightReleaseGovernanceApprovedActionConsumeExecution(
  input: ReleaseGovernanceApprovedActionConsumeExecutionPreflightInput,
): ReleaseGovernanceApprovedActionConsumeExecutionPreflight {
  const executionPreflightRef = normalize(input.executionPreflightRef);
  const executorRef = normalize(input.executorRef);
  const executionPolicyRef = normalize(input.executionPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `release_governance_approved_action_consume_execution_preflight.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `release_governance_approved_action_consume_execution_preflight.authority_review_required:${item}`));
  }
  if (!input.authority.consumeApplicationAuthorityAllowed || !input.authority.consumeApplicationAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_preflight.application_authority_not_allowed');
  }
  if (!input.authority.approvedActionConsumeAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_preflight.consume_must_be_authorized');
  }
  if (!input.authority.approvedActionAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_preflight.action_must_be_authorized');
  }
  if (
    input.authority.actionConsumed !== false
    || input.authority.mergeAllowed !== false
    || input.authority.externalActionAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_execution_preflight.merge_and_external_actions_must_stay_closed');
  }
  if (!executionPreflightRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_preflight.execution_preflight_ref_required');
  }
  if (!executorRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_preflight.executor_ref_required');
  }
  if (!executionPolicyRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_preflight.execution_policy_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeExecutionPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionPreflightAllowed: status === 'ready',
    consumeApplicationAuthorized: input.authority.consumeApplicationAuthorized,
    approvedActionConsumeAuthorized: input.authority.approvedActionConsumeAuthorized,
    approvedActionAuthorized: input.authority.approvedActionAuthorized,
    actionConsumed: false,
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(input.authority.actionId ? { actionId: input.authority.actionId } : {}),
    ...(input.authority.consumeAuthorityId ? { consumeAuthorityId: input.authority.consumeAuthorityId } : {}),
    ...(input.authority.applicationAuthorityId ? { applicationAuthorityId: input.authority.applicationAuthorityId } : {}),
    ...(executionPreflightRef ? { executionPreflightRef } : {}),
    ...(executorRef ? { executorRef } : {}),
    ...(executionPolicyRef ? { executionPolicyRef } : {}),
    ...(input.authority.releaseLabel ? { releaseLabel: input.authority.releaseLabel } : {}),
    evidenceRefs: unique([...input.authority.evidenceRefs, executionPreflightRef, executionPolicyRef]),
    runbookSteps: [...input.authority.runbookSteps],
    consumeExecution: {
      kind: 'release_governance_approved_action_consume_execution_preflight',
      ...(input.authority.actionId ? { actionRef: input.authority.actionId } : {}),
      ...(input.authority.applicationAuthorityId ? { applicationAuthorityRef: input.authority.applicationAuthorityId } : {}),
      ...(executionPolicyRef ? { policyRef: executionPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_authority']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_execution_preflight_review']
        : ['resolve_release_governance_approved_action_consume_execution_preflight_blockers'],
  };
}
