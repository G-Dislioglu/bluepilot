import type { CockpitRouteSourceHandlerResult } from './cockpitRouteSourceHandlerSkeleton.js';

export type CockpitHandlerMountReadinessStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitHandlerMountReadinessInput {
  handlerResult: CockpitRouteSourceHandlerResult;
  envGateName: string;
  routeModuleRef?: string;
}

export interface CockpitHandlerMountReadiness {
  status: CockpitHandlerMountReadinessStatus;
  mountReadinessAllowed: boolean;
  serverMutationAllowed: false;
  routeMutationAllowed: false;
  executableActionAllowed: false;
  routePath: string;
  envGateName: string;
  routeModuleRef?: string;
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

const ENV_RE = /^BLUEPILOT_[A-Z0-9_]+$/;
const COCKPIT_ROUTE_PATH = '/cockpit/read-only';

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function assessCockpitHandlerMountReadiness(
  input: CockpitHandlerMountReadinessInput,
): CockpitHandlerMountReadiness {
  const envGateName = normalize(input.envGateName);
  const routeModuleRef = normalize(input.routeModuleRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.handlerResult.statusCode !== 200 || !input.handlerResult.body.ok) {
    blockers.push(...input.handlerResult.body.reasons.map((reason) => `cockpit_handler_mount.handler_not_ready:${reason}`));
  }
  if (input.handlerResult.body.routePath !== COCKPIT_ROUTE_PATH) {
    blockers.push(`cockpit_handler_mount.unsupported_route:${input.handlerResult.body.routePath || '(missing)'}`);
  }
  if (input.handlerResult.body.routeMutationAllowed !== false) {
    blockers.push('cockpit_handler_mount.route_mutation_must_stay_closed');
  }
  if (input.handlerResult.body.executableActionAllowed !== false || input.handlerResult.body.model?.executableActionAllowed !== false) {
    blockers.push('cockpit_handler_mount.executable_actions_must_stay_disabled');
  }
  if (input.handlerResult.body.model?.actions.some((action) => action.enabled !== false)) {
    blockers.push('cockpit_handler_mount.model_actions_must_stay_disabled');
  }
  if (!ENV_RE.test(envGateName)) {
    blockers.push(`cockpit_handler_mount.invalid_env_gate:${envGateName || '(missing)'}`);
  }
  if (!routeModuleRef) {
    reviewItems.push('cockpit_handler_mount.route_module_ref_required');
  }

  const status: CockpitHandlerMountReadinessStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    mountReadinessAllowed: status === 'ready',
    serverMutationAllowed: false,
    routeMutationAllowed: false,
    executableActionAllowed: false,
    routePath: input.handlerResult.body.routePath,
    envGateName,
    ...(routeModuleRef ? { routeModuleRef } : {}),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_separate_default_off_cockpit_handler_mount_task']
      : status === 'review_required'
        ? ['complete_cockpit_handler_mount_review']
        : ['resolve_cockpit_handler_mount_blockers'],
  };
}
