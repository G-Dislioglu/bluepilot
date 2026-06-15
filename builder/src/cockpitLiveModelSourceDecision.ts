import type { CockpitProjectionAdoptionContract } from './cockpitProjectionAdoptionContract.js';
import type { LiveAicosNetworkConnectorResult } from './liveAicosNetworkConnector.js';

export type CockpitLiveModelSourceMode = 'sample_only' | 'manual_post_only' | 'live_aicos_read_only';
export type CockpitLiveModelSourceStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitLiveModelSourceDecisionInput {
  mode: CockpitLiveModelSourceMode;
  cockpit: CockpitProjectionAdoptionContract;
  network?: LiveAicosNetworkConnectorResult;
  operatorReviewRef?: string;
}

export interface CockpitLiveModelSourceDecision {
  status: CockpitLiveModelSourceStatus;
  mode: CockpitLiveModelSourceMode;
  liveModelSourceAllowed: boolean;
  readOnlyRouteRequired: true;
  executableActionAllowed: false;
  contractTaskId: string;
  sourceRef?: string;
  acceptedCards: number;
  quarantinedCards: number;
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

export function decideCockpitLiveModelSource(
  input: CockpitLiveModelSourceDecisionInput,
): CockpitLiveModelSourceDecision {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const operatorReviewRef = normalize(input.operatorReviewRef);

  if (!input.cockpit.cockpitModelAllowed) {
    blockers.push('cockpit_live_source.cockpit_model_not_allowed');
  }
  if (input.cockpit.executableActionAllowed !== false) {
    blockers.push('cockpit_live_source.executable_actions_must_remain_disabled');
  }
  if (input.cockpit.status === 'blocked' || input.cockpit.status === 'invalid') {
    blockers.push(`cockpit_live_source.cockpit_status_not_usable:${input.cockpit.status}`);
  }
  if (input.cockpit.status === 'review') {
    reviewItems.push('cockpit_live_source.cockpit_review_required');
  }

  if (input.mode === 'live_aicos_read_only') {
    if (!input.network) {
      blockers.push('cockpit_live_source.network_result_required');
    } else {
      if (input.network.status === 'blocked') {
        blockers.push(...input.network.reasons.map((reason) => `cockpit_live_source.network_blocked:${reason}`));
      }
      if (input.network.status === 'review_required') {
        reviewItems.push(...input.network.reasons.map((reason) => `cockpit_live_source.network_review_required:${reason}`));
      }
      if (input.network.status === 'accepted' && input.network.summary.acceptedCards === 0) {
        blockers.push('cockpit_live_source.accepted_cards_required');
      }
    }
    if (!operatorReviewRef) {
      reviewItems.push('cockpit_live_source.operator_review_ref_required');
    }
  }

  const status: CockpitLiveModelSourceStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  const acceptedCards = input.network?.summary.acceptedCards ?? 0;
  const quarantinedCards = input.network?.summary.quarantinedCards ?? 0;

  return {
    status,
    mode: input.mode,
    liveModelSourceAllowed: status === 'ready' && input.mode === 'live_aicos_read_only',
    readOnlyRouteRequired: true,
    executableActionAllowed: false,
    contractTaskId: input.cockpit.contractTaskId,
    ...(input.network?.sourceRef ? { sourceRef: input.network.sourceRef } : {}),
    acceptedCards,
    quarantinedCards,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? input.mode === 'live_aicos_read_only'
        ? ['build_read_only_live_model_adapter_in_later_contract', 'keep_cockpit_actions_disabled']
        : ['keep_existing_read_only_cockpit_source']
      : status === 'review_required'
        ? ['complete_operator_review_before_live_model_source']
        : ['resolve_live_model_source_blockers'],
  };
}
