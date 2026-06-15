import type {
  DispatchFrontendReadinessProjection,
  DispatchFrontendSectionStatus,
} from './dispatchFrontendReadiness.js';
import type { RuntimeDispatchIntegrationContract } from './runtimeDispatchIntegrationContract.js';

export type CockpitProjectionAudience = 'operator' | 'reviewer' | 'release_manager';
export type CockpitProjectionAdoptionStatus = 'ready' | 'review' | 'blocked' | 'invalid';

export interface CockpitProjectionAdoptionInput {
  readiness: DispatchFrontendReadinessProjection;
  runtime: RuntimeDispatchIntegrationContract;
  audience?: CockpitProjectionAudience;
}

export interface CockpitProjectionPanel {
  id: string;
  title: string;
  status: DispatchFrontendSectionStatus;
  lines: string[];
}

export interface CockpitProjectionAdoptionContract {
  status: CockpitProjectionAdoptionStatus;
  cockpitModelAllowed: boolean;
  executableActionAllowed: false;
  audience: CockpitProjectionAudience;
  contractTaskId: string;
  reasons: string[];
  headline: string;
  panels: CockpitProjectionPanel[];
  actions: Array<{
    id: string;
    enabled: false;
    reason: string;
  }>;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function statusFromReadiness(status: DispatchFrontendSectionStatus): CockpitProjectionAdoptionStatus {
  if (status === 'blocked') {
    return 'blocked';
  }
  if (status === 'review') {
    return 'review';
  }
  return 'ready';
}

function panelStatusFromRuntime(runtime: RuntimeDispatchIntegrationContract): DispatchFrontendSectionStatus {
  if (runtime.status === 'blocked') {
    return 'blocked';
  }
  if (runtime.status === 'operator_review') {
    return 'review';
  }
  return 'ready';
}

function headlineFor(status: CockpitProjectionAdoptionStatus): string {
  if (status === 'ready') {
    return 'Ready for operator inspection';
  }
  if (status === 'review') {
    return 'Operator review required';
  }
  if (status === 'blocked') {
    return 'Blocked before execution';
  }
  return 'Invalid cockpit projection';
}

export function adoptCockpitProjection(
  input: CockpitProjectionAdoptionInput,
): CockpitProjectionAdoptionContract {
  const audience = input.audience ?? 'operator';
  const reasons = unique([...input.readiness.reasons, ...input.runtime.reasons]);
  const taskMismatch = input.readiness.contractTaskId !== input.runtime.contractTaskId;
  if (taskMismatch) {
    reasons.push(`cockpit_projection.task_mismatch:${input.readiness.contractTaskId}->${input.runtime.contractTaskId}`);
  }

  const runtimeStatus = panelStatusFromRuntime(input.runtime);
  const readinessStatus = input.readiness.stage === 'dispatch_ready'
    ? 'ready'
    : input.readiness.stage === 'frontend_review'
      ? 'review'
      : 'blocked';
  const status: CockpitProjectionAdoptionStatus = taskMismatch
    ? 'invalid'
    : runtimeStatus === 'blocked' || readinessStatus === 'blocked'
      ? 'blocked'
      : runtimeStatus === 'review' || readinessStatus === 'review'
        ? 'review'
        : statusFromReadiness(readinessStatus);

  return {
    status,
    cockpitModelAllowed: !taskMismatch && input.readiness.frontendProjectionAllowed,
    executableActionAllowed: false,
    audience,
    contractTaskId: input.readiness.contractTaskId,
    reasons: unique(reasons),
    headline: headlineFor(status),
    panels: [
      ...input.readiness.frontendSections.map((section) => ({
        id: `readiness.${section.id}`,
        title: section.title,
        status: section.status,
        lines: [...section.items],
      })),
      {
        id: 'runtime.integration',
        title: 'Runtime integration',
        status: runtimeStatus,
        lines: [
          `status:${input.runtime.status}`,
          `dry_run_allowed:${input.runtime.dryRunAllowed}`,
          `runtime_dispatch_allowed:${input.runtime.runtimeDispatchAllowed}`,
          `write_permit_required:${input.runtime.writePermitRequired}`,
        ],
      },
    ],
    actions: [
      {
        id: 'open_runtime_dispatch',
        enabled: false,
        reason: 'cockpit_projection.contract_only_no_runtime_action',
      },
      {
        id: 'open_write',
        enabled: false,
        reason: 'cockpit_projection.write_actions_require_later_contract',
      },
    ],
  };
}
