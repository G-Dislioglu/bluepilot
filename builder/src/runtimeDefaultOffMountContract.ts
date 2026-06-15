import type { RuntimeHandlerMountReadiness } from './runtimeHandlerMountReadiness.js';

export type RuntimeDefaultOffMountContractStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimeDefaultOffMountContractInput {
  readiness: RuntimeHandlerMountReadiness;
  envCurrentlyEnabled?: boolean;
  mountContractRef?: string;
}

export interface RuntimeDefaultOffMountContract {
  status: RuntimeDefaultOffMountContractStatus;
  mountContractAllowed: boolean;
  executionAllowed: false;
  serverMutationAllowed: false;
  routeMutationAllowed: false;
  defaultOff: true;
  routePath: string;
  envGateName: string;
  handlerRef?: string;
  routeModuleRef?: string;
  mountContractRef?: string;
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

export function contractRuntimeDefaultOffMount(
  input: RuntimeDefaultOffMountContractInput,
): RuntimeDefaultOffMountContract {
  const mountContractRef = normalize(input.mountContractRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.readiness.status === 'blocked') {
    blockers.push(...input.readiness.blockers.map((blocker) => `runtime_default_off_mount.readiness_blocked:${blocker}`));
  }
  if (input.readiness.status === 'review_required') {
    reviewItems.push(...input.readiness.reviewItems.map((item) => `runtime_default_off_mount.readiness_review_required:${item}`));
  }
  if (!input.readiness.mountReadinessAllowed) {
    blockers.push('runtime_default_off_mount.readiness_not_allowed');
  }
  if (input.readiness.executionAllowed !== false) {
    blockers.push('runtime_default_off_mount.execution_must_stay_disabled');
  }
  if (input.readiness.serverMutationAllowed !== false || input.readiness.routeMutationAllowed !== false) {
    blockers.push('runtime_default_off_mount.mutation_must_stay_closed');
  }
  if (input.envCurrentlyEnabled) {
    blockers.push(`runtime_default_off_mount.env_gate_must_be_default_off:${input.readiness.envGateName}`);
  }
  if (!input.readiness.routeModuleRef) {
    reviewItems.push('runtime_default_off_mount.route_module_ref_required');
  }
  if (!mountContractRef) {
    reviewItems.push('runtime_default_off_mount.mount_contract_ref_required');
  }

  const status: RuntimeDefaultOffMountContractStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    mountContractAllowed: status === 'ready',
    executionAllowed: false,
    serverMutationAllowed: false,
    routeMutationAllowed: false,
    defaultOff: true,
    routePath: input.readiness.routePath,
    envGateName: input.readiness.envGateName,
    ...(input.readiness.handlerRef ? { handlerRef: input.readiness.handlerRef } : {}),
    ...(input.readiness.routeModuleRef ? { routeModuleRef: input.readiness.routeModuleRef } : {}),
    ...(mountContractRef ? { mountContractRef } : {}),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_separate_server_mount_implementation_task_with_default_off_gate']
      : status === 'review_required'
        ? ['complete_runtime_default_off_mount_contract_review']
        : ['resolve_runtime_default_off_mount_blockers'],
  };
}
