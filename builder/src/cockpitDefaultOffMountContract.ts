import type { CockpitHandlerMountReadiness } from './cockpitHandlerMountReadiness.js';

export type CockpitDefaultOffMountContractStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitDefaultOffMountContractInput {
  readiness: CockpitHandlerMountReadiness;
  envCurrentlyEnabled?: boolean;
  mountContractRef?: string;
}

export interface CockpitDefaultOffMountContract {
  status: CockpitDefaultOffMountContractStatus;
  mountContractAllowed: boolean;
  serverMutationAllowed: false;
  routeMutationAllowed: false;
  executableActionAllowed: false;
  defaultOff: true;
  routePath: string;
  envGateName: string;
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

export function contractCockpitDefaultOffMount(
  input: CockpitDefaultOffMountContractInput,
): CockpitDefaultOffMountContract {
  const mountContractRef = normalize(input.mountContractRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.readiness.status === 'blocked') {
    blockers.push(...input.readiness.blockers.map((blocker) => `cockpit_default_off_mount.readiness_blocked:${blocker}`));
  }
  if (input.readiness.status === 'review_required') {
    reviewItems.push(...input.readiness.reviewItems.map((item) => `cockpit_default_off_mount.readiness_review_required:${item}`));
  }
  if (!input.readiness.mountReadinessAllowed) {
    blockers.push('cockpit_default_off_mount.readiness_not_allowed');
  }
  if (input.readiness.serverMutationAllowed !== false || input.readiness.routeMutationAllowed !== false) {
    blockers.push('cockpit_default_off_mount.mutation_must_stay_closed');
  }
  if (input.readiness.executableActionAllowed !== false) {
    blockers.push('cockpit_default_off_mount.executable_actions_must_stay_disabled');
  }
  if (input.envCurrentlyEnabled) {
    blockers.push(`cockpit_default_off_mount.env_gate_must_be_default_off:${input.readiness.envGateName}`);
  }
  if (!input.readiness.routeModuleRef) {
    reviewItems.push('cockpit_default_off_mount.route_module_ref_required');
  }
  if (!mountContractRef) {
    reviewItems.push('cockpit_default_off_mount.mount_contract_ref_required');
  }

  const status: CockpitDefaultOffMountContractStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    mountContractAllowed: status === 'ready',
    serverMutationAllowed: false,
    routeMutationAllowed: false,
    executableActionAllowed: false,
    defaultOff: true,
    routePath: input.readiness.routePath,
    envGateName: input.readiness.envGateName,
    ...(input.readiness.routeModuleRef ? { routeModuleRef: input.readiness.routeModuleRef } : {}),
    ...(mountContractRef ? { mountContractRef } : {}),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_separate_server_mount_implementation_task_with_default_off_gate']
      : status === 'review_required'
        ? ['complete_cockpit_default_off_mount_contract_review']
        : ['resolve_cockpit_default_off_mount_blockers'],
  };
}
