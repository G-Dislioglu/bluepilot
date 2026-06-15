import type { CockpitProjectionAdoptionContract } from './cockpitProjectionAdoptionContract.js';
import type { CockpitLiveModelAdapterPlan } from './cockpitLiveModelAdapterPlan.js';

export type CockpitLiveModelAdapterStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitLiveModelAdapterResult {
  status: CockpitLiveModelAdapterStatus;
  model?: CockpitProjectionAdoptionContract;
  routeWiringAllowed: false;
  executableActionAllowed: false;
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function forceActionsDisabled(model: CockpitProjectionAdoptionContract): CockpitProjectionAdoptionContract {
  return {
    ...model,
    executableActionAllowed: false,
    actions: model.actions.map((action) => ({
      ...action,
      enabled: false,
      reason: action.reason || 'cockpit_live_model_adapter.read_only_action',
    })),
  };
}

export function materializeCockpitLiveModel(
  plan: CockpitLiveModelAdapterPlan,
): CockpitLiveModelAdapterResult {
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (plan.status === 'blocked') {
    blockers.push(...plan.blockers.map((blocker) => `cockpit_live_model_adapter.plan_blocked:${blocker}`));
  }
  if (plan.status === 'review_required') {
    reviewItems.push(...plan.reviewItems.map((item) => `cockpit_live_model_adapter.plan_review_required:${item}`));
  }
  if (!plan.adapterAllowed) {
    blockers.push('cockpit_live_model_adapter.adapter_not_allowed');
  }
  if (plan.routeWiringAllowed !== false) {
    blockers.push('cockpit_live_model_adapter.route_wiring_must_be_separate');
  }
  if (plan.executableActionAllowed !== false) {
    blockers.push('cockpit_live_model_adapter.executable_actions_must_stay_disabled');
  }
  if (!plan.plannedModel) {
    blockers.push('cockpit_live_model_adapter.planned_model_required');
  }

  const status: CockpitLiveModelAdapterStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  const model = status === 'ready' && plan.plannedModel
    ? forceActionsDisabled(plan.plannedModel)
    : undefined;

  return {
    status,
    ...(model ? { model } : {}),
    routeWiringAllowed: false,
    executableActionAllowed: false,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['hand_model_to_read_only_cockpit_route_in_later_contract']
      : status === 'review_required'
        ? ['complete_live_model_adapter_review']
        : ['resolve_live_model_adapter_blockers'],
  };
}
