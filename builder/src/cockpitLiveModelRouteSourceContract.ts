import type { CockpitLiveModelAdapterResult } from './cockpitLiveModelAdapter.js';

export type CockpitLiveModelRouteSourceStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitLiveModelRouteSourceInput {
  adapter: CockpitLiveModelAdapterResult;
  routePath: string;
  sourceMode: 'sample_only' | 'posted_model' | 'materialized_live_model';
  operatorReviewRef?: string;
}

export interface CockpitLiveModelRouteSourceContract {
  status: CockpitLiveModelRouteSourceStatus;
  routeSourceAllowed: boolean;
  routeMutationAllowed: false;
  executableActionAllowed: false;
  routePath: string;
  sourceMode: CockpitLiveModelRouteSourceInput['sourceMode'];
  modelTaskId?: string;
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

export function contractCockpitLiveModelRouteSource(
  input: CockpitLiveModelRouteSourceInput,
): CockpitLiveModelRouteSourceContract {
  const routePath = normalize(input.routePath);
  const operatorReviewRef = normalize(input.operatorReviewRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (routePath !== '/cockpit/read-only') {
    blockers.push(`cockpit_route_source.unsupported_route:${routePath || '(missing)'}`);
  }
  if (input.adapter.status === 'blocked') {
    blockers.push(...input.adapter.blockers.map((blocker) => `cockpit_route_source.adapter_blocked:${blocker}`));
  }
  if (input.adapter.status === 'review_required') {
    reviewItems.push(...input.adapter.reviewItems.map((item) => `cockpit_route_source.adapter_review_required:${item}`));
  }
  if (input.sourceMode === 'materialized_live_model') {
    if (!input.adapter.model) {
      blockers.push('cockpit_route_source.materialized_model_required');
    }
    if (!operatorReviewRef) {
      reviewItems.push('cockpit_route_source.operator_review_ref_required');
    }
  }
  if (input.adapter.routeWiringAllowed !== false) {
    blockers.push('cockpit_route_source.route_wiring_must_be_separate_contract');
  }
  if (input.adapter.executableActionAllowed !== false) {
    blockers.push('cockpit_route_source.executable_actions_must_stay_disabled');
  }

  const status: CockpitLiveModelRouteSourceStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    routeSourceAllowed: status === 'ready' && input.sourceMode === 'materialized_live_model',
    routeMutationAllowed: false,
    executableActionAllowed: false,
    routePath,
    sourceMode: input.sourceMode,
    ...(input.adapter.model?.contractTaskId ? { modelTaskId: input.adapter.model.contractTaskId } : {}),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['prepare_read_only_route_source_wiring_contract', 'keep_cockpit_route_actions_disabled']
      : status === 'review_required'
        ? ['complete_cockpit_route_source_review']
        : ['resolve_cockpit_route_source_blockers'],
  };
}
