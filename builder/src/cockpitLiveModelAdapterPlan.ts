import type { CockpitProjectionAdoptionContract, CockpitProjectionPanel } from './cockpitProjectionAdoptionContract.js';
import type { CockpitLiveModelSourceDecision } from './cockpitLiveModelSourceDecision.js';
import type { LiveAicosNetworkConnectorResult } from './liveAicosNetworkConnector.js';

export type CockpitLiveModelAdapterPlanStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitLiveModelAdapterPlanInput {
  decision: CockpitLiveModelSourceDecision;
  baseModel: CockpitProjectionAdoptionContract;
  network?: LiveAicosNetworkConnectorResult;
  adapterRef?: string;
}

export interface CockpitLiveModelAdapterPlan {
  status: CockpitLiveModelAdapterPlanStatus;
  adapterAllowed: boolean;
  routeWiringAllowed: false;
  executableActionAllowed: false;
  adapterRef?: string;
  contractTaskId: string;
  plannedModel?: CockpitProjectionAdoptionContract;
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalize(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function liveCardsPanel(network: LiveAicosNetworkConnectorResult): CockpitProjectionPanel {
  const accepted = network.intake?.acceptedCards ?? [];
  return {
    id: 'live_aicos.cards',
    title: 'Live AICOS cards',
    status: network.summary.quarantinedCards > 0 ? 'review' : 'ready',
    lines: [
      `source:${network.sourceRef ?? network.network.endpointRef ?? 'unknown'}`,
      `accepted_cards:${network.summary.acceptedCards}`,
      `quarantined_cards:${network.summary.quarantinedCards}`,
      ...accepted.slice(0, 8).map((card) => `card:${card.cardId}:${card.policy}`),
    ],
  };
}

export function planCockpitLiveModelAdapter(
  input: CockpitLiveModelAdapterPlanInput,
): CockpitLiveModelAdapterPlan {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const adapterRef = normalize(input.adapterRef);

  if (input.decision.status === 'blocked') {
    blockers.push(...input.decision.blockers.map((blocker) => `cockpit_live_adapter.decision_blocked:${blocker}`));
  }
  if (input.decision.status === 'review_required') {
    reviewItems.push(...input.decision.reviewItems.map((item) => `cockpit_live_adapter.decision_review_required:${item}`));
  }
  if (!input.decision.liveModelSourceAllowed) {
    blockers.push('cockpit_live_adapter.live_model_source_not_allowed');
  }
  if (!input.baseModel.cockpitModelAllowed) {
    blockers.push('cockpit_live_adapter.base_model_not_allowed');
  }
  if (input.baseModel.executableActionAllowed !== false) {
    blockers.push('cockpit_live_adapter.executable_actions_must_stay_disabled');
  }
  if (!input.network) {
    blockers.push('cockpit_live_adapter.network_result_required');
  } else if (input.network.status !== 'accepted') {
    blockers.push(`cockpit_live_adapter.network_not_accepted:${input.network.status}`);
  }
  if (!adapterRef) {
    reviewItems.push('cockpit_live_adapter.adapter_ref_required');
  }

  const status: CockpitLiveModelAdapterPlanStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  const plannedModel = status === 'ready' && input.network
    ? {
        ...input.baseModel,
        headline: 'Ready for live AICOS inspection',
        reasons: unique([...input.baseModel.reasons, ...input.decision.reviewItems]),
        panels: [...input.baseModel.panels, liveCardsPanel(input.network)],
        actions: input.baseModel.actions.map((action) => ({ ...action, enabled: false as const })),
      }
    : undefined;

  return {
    status,
    adapterAllowed: status === 'ready',
    routeWiringAllowed: false,
    executableActionAllowed: false,
    ...(adapterRef ? { adapterRef } : {}),
    contractTaskId: input.baseModel.contractTaskId,
    ...(plannedModel ? { plannedModel } : {}),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['build_cockpit_live_model_adapter_in_later_contract', 'keep_route_wiring_separate']
      : status === 'review_required'
        ? ['complete_live_adapter_review_items']
        : ['resolve_live_adapter_blockers'],
  };
}
