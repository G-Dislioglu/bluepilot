import type { RuntimeDispatchIntegrationContract } from './runtimeDispatchIntegrationContract.js';

export type RuntimeDryRunAdapterStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimeDryRunAdapterInput {
  integration: RuntimeDispatchIntegrationContract;
  instruction: string;
  requestedBy?: string;
}

export interface RuntimeDryRunAdapterPlan {
  status: RuntimeDryRunAdapterStatus;
  dryRunInvocationAllowed: boolean;
  runtimeDispatchAllowed: false;
  contractTaskId: string;
  instruction: string;
  requestedBy?: string;
  blockers: string[];
  reviewItems: string[];
  invocation: {
    dryRun: true;
    skipDeploy: true;
    allowProviderCalls: false;
    allowDatabaseWrites: false;
    allowGitHubWrites: false;
    allowRuntimeRoute: false;
  };
  nextActions: string[];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function planRuntimeDryRunAdapter(
  input: RuntimeDryRunAdapterInput,
): RuntimeDryRunAdapterPlan {
  const instruction = input.instruction.trim();
  const requestedBy = input.requestedBy?.trim();
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (!instruction) {
    blockers.push('runtime_dry_run.instruction_required');
  }
  if (input.integration.status === 'blocked') {
    blockers.push('runtime_dry_run.integration_blocked');
  }
  if (input.integration.status === 'operator_review') {
    reviewItems.push('runtime_dry_run.integration_review_required');
  }
  if (!input.integration.dryRunAllowed) {
    blockers.push('runtime_dry_run.integration_dry_run_not_allowed');
  }
  if (input.integration.runtimeDispatchAllowed) {
    blockers.push('runtime_dry_run.write_capable_integration_requires_separate_runtime_contract');
  }

  const status: RuntimeDryRunAdapterStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    dryRunInvocationAllowed: status === 'ready',
    runtimeDispatchAllowed: false,
    contractTaskId: input.integration.contractTaskId,
    instruction,
    ...(requestedBy ? { requestedBy } : {}),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    invocation: {
      dryRun: true,
      skipDeploy: true,
      allowProviderCalls: false,
      allowDatabaseWrites: false,
      allowGitHubWrites: false,
      allowRuntimeRoute: false,
    },
    nextActions: status === 'ready'
      ? ['operator_may_wire_to_dry_run_route_in_later_contract', 'keep_provider_db_github_writes_disabled']
      : status === 'review_required'
        ? ['resolve_operator_review_before_dry_run_adapter']
        : ['resolve_dry_run_blockers_before_runtime_wiring'],
  };
}
