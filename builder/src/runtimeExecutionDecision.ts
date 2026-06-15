import type { RuntimeDryRunAdapterPlan } from './runtimeDryRunAdapterContract.js';

export type RuntimeExecutionDecisionMode = 'contract_only' | 'dry_run_execution' | 'write_execution';
export type RuntimeExecutionDecisionStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimeExecutionDecisionInput {
  mode: RuntimeExecutionDecisionMode;
  plan: RuntimeDryRunAdapterPlan;
  operatorApprovalRef?: string;
  mayaGateEvidenceRef?: string;
  providerIsolationRef?: string;
  maxRuntimeSeconds?: number;
}

export interface RuntimeExecutionDecision {
  status: RuntimeExecutionDecisionStatus;
  mode: RuntimeExecutionDecisionMode;
  runtimeExecutionAllowed: boolean;
  writeExecutionAllowed: false;
  routeMutationAllowed: false;
  contractTaskId: string;
  blockers: string[];
  reviewItems: string[];
  checklist: Array<{
    id: string;
    passed: boolean;
    detail: string;
  }>;
  nextActions: string[];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalize(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function decideRuntimeExecution(
  input: RuntimeExecutionDecisionInput,
): RuntimeExecutionDecision {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const operatorApprovalRef = normalize(input.operatorApprovalRef);
  const mayaGateEvidenceRef = normalize(input.mayaGateEvidenceRef);
  const providerIsolationRef = normalize(input.providerIsolationRef);
  const maxRuntimeSeconds = input.maxRuntimeSeconds ?? 0;

  if (input.mode === 'contract_only') {
    reviewItems.push('runtime_execution.contract_only_mode');
  }
  if (input.mode === 'write_execution') {
    blockers.push('runtime_execution.write_execution_requires_separate_permit_authority_contract');
  }
  if (input.plan.status === 'blocked') {
    blockers.push(...input.plan.blockers.map((blocker) => `runtime_execution.plan_blocked:${blocker}`));
  }
  if (input.plan.status === 'review_required') {
    reviewItems.push(...input.plan.reviewItems.map((item) => `runtime_execution.plan_review_required:${item}`));
  }
  if (!input.plan.dryRunInvocationAllowed) {
    blockers.push('runtime_execution.dry_run_plan_not_allowed');
  }

  if (input.mode === 'dry_run_execution') {
    if (!operatorApprovalRef) {
      reviewItems.push('runtime_execution.operator_approval_ref_required');
    }
    if (!mayaGateEvidenceRef) {
      blockers.push('runtime_execution.maya_gate_evidence_required');
    }
    if (!providerIsolationRef) {
      blockers.push('runtime_execution.provider_isolation_ref_required');
    }
    if (maxRuntimeSeconds < 1 || maxRuntimeSeconds > 600) {
      blockers.push(`runtime_execution.max_runtime_seconds_out_of_bounds:${maxRuntimeSeconds}`);
    }
  }

  const status: RuntimeExecutionDecisionStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    mode: input.mode,
    runtimeExecutionAllowed: status === 'ready' && input.mode === 'dry_run_execution',
    writeExecutionAllowed: false,
    routeMutationAllowed: false,
    contractTaskId: input.plan.contractTaskId,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    checklist: [
      {
        id: 'dry_run_plan_ready',
        passed: input.plan.status === 'ready' && input.plan.dryRunInvocationAllowed,
        detail: input.plan.status,
      },
      {
        id: 'operator_approval_present',
        passed: input.mode !== 'dry_run_execution' || Boolean(operatorApprovalRef),
        detail: operatorApprovalRef ?? 'missing',
      },
      {
        id: 'maya_gate_evidence_present',
        passed: input.mode !== 'dry_run_execution' || Boolean(mayaGateEvidenceRef),
        detail: mayaGateEvidenceRef ?? 'missing',
      },
      {
        id: 'provider_isolation_present',
        passed: input.mode !== 'dry_run_execution' || Boolean(providerIsolationRef),
        detail: providerIsolationRef ?? 'missing',
      },
      {
        id: 'write_execution_closed',
        passed: true,
        detail: 'write_execution_forbidden_in_this_decision',
      },
    ],
    nextActions: status === 'ready'
      ? ['prepare_separate_runtime_execution_mount_contract', 'keep_write_execution_closed']
      : status === 'review_required'
        ? ['collect_runtime_execution_review_evidence']
        : ['resolve_runtime_execution_blockers'],
  };
}
