import type { CockpitProjectionAdoptionContract } from './cockpitProjectionAdoptionContract.js';
import type { CockpitRouteSourceMountPrep } from './cockpitRouteSourceMountPrep.js';

export type CockpitRouteSourceSelection = 'sample' | 'live';

export interface CockpitRouteSourceHandlerRequest {
  source: CockpitRouteSourceSelection;
  sampleModel: CockpitProjectionAdoptionContract;
  liveModel?: CockpitProjectionAdoptionContract;
}

export interface CockpitRouteSourceHandlerResult {
  statusCode: 200 | 400 | 409;
  body: {
    ok: boolean;
    code: string;
    selectedSource?: CockpitRouteSourceSelection;
    routePath: string;
    routeMutationAllowed: false;
    executableActionAllowed: false;
    sourceSelectorRef?: string;
    model?: CockpitProjectionAdoptionContract;
    reasons: string[];
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function forceReadOnlyModel(model: CockpitProjectionAdoptionContract): CockpitProjectionAdoptionContract {
  return {
    ...model,
    executableActionAllowed: false,
    actions: model.actions.map((action) => ({
      ...action,
      enabled: false,
      reason: action.reason || 'cockpit_route_source_handler.read_only_action',
    })),
  };
}

export function handleCockpitRouteSourceSelection(
  prep: CockpitRouteSourceMountPrep,
  request: CockpitRouteSourceHandlerRequest,
): CockpitRouteSourceHandlerResult {
  const reasons: string[] = [];

  if (prep.status === 'blocked') {
    reasons.push(...prep.blockers.map((blocker) => `cockpit_route_source_handler.prep_blocked:${blocker}`));
  }
  if (prep.status === 'review_required') {
    reasons.push(...prep.reviewItems.map((item) => `cockpit_route_source_handler.prep_review_required:${item}`));
  }
  if (!prep.mountPrepAllowed) {
    reasons.push('cockpit_route_source_handler.mount_prep_not_allowed');
  }
  if (prep.routeMutationAllowed !== false) {
    reasons.push('cockpit_route_source_handler.route_mutation_must_stay_closed');
  }
  if (!prep.sourceSelectorRef) {
    reasons.push('cockpit_route_source_handler.source_selector_ref_required');
  }
  if (request.source !== 'sample' && request.source !== 'live') {
    reasons.push(`cockpit_route_source_handler.unsupported_source:${String(request.source)}`);
  }
  if (request.source === 'live' && !request.liveModel) {
    reasons.push('cockpit_route_source_handler.live_model_required');
  }

  if (reasons.length > 0) {
    return {
      statusCode: prep.status === 'review_required' ? 409 : 400,
      body: {
        ok: false,
        code: 'cockpit_route_source_handler_not_ready',
        routePath: prep.routePath,
        routeMutationAllowed: false,
        executableActionAllowed: false,
        ...(prep.sourceSelectorRef ? { sourceSelectorRef: prep.sourceSelectorRef } : {}),
        reasons: unique(reasons),
      },
    };
  }

  const selectedModel = request.source === 'live' && request.liveModel
    ? request.liveModel
    : request.sampleModel;

  return {
    statusCode: 200,
    body: {
      ok: true,
      code: 'cockpit_route_source_handler_ready',
      selectedSource: request.source,
      routePath: prep.routePath,
      routeMutationAllowed: false,
      executableActionAllowed: false,
      ...(prep.sourceSelectorRef ? { sourceSelectorRef: prep.sourceSelectorRef } : {}),
      model: forceReadOnlyModel(selectedModel),
      reasons: ['cockpit_route_source_handler.skeleton_only_no_route_mount'],
    },
  };
}
