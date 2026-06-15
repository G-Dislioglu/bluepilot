import type { RuntimeExecutionRouteMountReadiness } from './runtimeExecutionRouteMountReadiness.js';

export type RuntimeExecutionRouteMountContractStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimeExecutionRouteMountContractInput {
  readiness: RuntimeExecutionRouteMountReadiness;
  handlerRef?: string;
  envGateName: string;
}

export interface RuntimeExecutionRouteMountContract {
  status: RuntimeExecutionRouteMountContractStatus;
  mountContractAllowed: boolean;
  executionAllowed: false;
  serverMutationAllowed: false;
  routePath: string;
  envGateName: string;
  handlerRef?: string;
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

const ENV_RE = /^BLUEPILOT_[A-Z0-9_]+$/;

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function contractRuntimeExecutionRouteMount(
  input: RuntimeExecutionRouteMountContractInput,
): RuntimeExecutionRouteMountContract {
  const handlerRef = normalize(input.handlerRef);
  const envGateName = normalize(input.envGateName);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.readiness.status === 'blocked') {
    blockers.push(...input.readiness.blockers.map((blocker) => `runtime_mount_contract.readiness_blocked:${blocker}`));
  }
  if (input.readiness.status === 'review_required') {
    reviewItems.push(...input.readiness.reviewItems.map((item) => `runtime_mount_contract.readiness_review_required:${item}`));
  }
  if (!input.readiness.mountAllowed) {
    blockers.push('runtime_mount_contract.mount_not_allowed');
  }
  if (input.readiness.executionAllowed !== false) {
    blockers.push('runtime_mount_contract.execution_must_stay_disabled');
  }
  if (input.readiness.serverMutationAllowed !== false) {
    blockers.push('runtime_mount_contract.server_mutation_must_be_separate');
  }
  if (!ENV_RE.test(envGateName) || envGateName !== input.readiness.envGateName) {
    blockers.push(`runtime_mount_contract.env_gate_mismatch:${envGateName || '(missing)'}->${input.readiness.envGateName}`);
  }
  if (!handlerRef) {
    reviewItems.push('runtime_mount_contract.handler_ref_required');
  }

  const status: RuntimeExecutionRouteMountContractStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    mountContractAllowed: status === 'ready',
    executionAllowed: false,
    serverMutationAllowed: false,
    routePath: input.readiness.routePath,
    envGateName,
    ...(handlerRef ? { handlerRef } : {}),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_server_mount_task_with_default_off_gate']
      : status === 'review_required'
        ? ['complete_runtime_mount_contract_review']
        : ['resolve_runtime_mount_contract_blockers'],
  };
}
