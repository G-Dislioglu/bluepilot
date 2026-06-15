import {
  intakeAicosCardSnapshots,
  type AicosCardBindingIntakeResult,
  type AicosCardSnapshot,
} from './aicosCardBindingIntake.js';
import type { LiveAicosFetchCacheContract } from './liveAicosFetchCacheContract.js';

export interface LiveAicosConnectorPayload {
  sourceRef: string;
  capturedAt: string;
  cards: Array<Partial<AicosCardSnapshot>>;
}

export interface LiveAicosConnectorThroughIntakeResult {
  status: 'accepted' | 'blocked' | 'review_required';
  sourceRef?: string;
  capturedAt?: string;
  reasons: string[];
  intake?: AicosCardBindingIntakeResult;
  summary: {
    acceptedCards: number;
    quarantinedCards: number;
  };
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function validatePayload(payload: Partial<LiveAicosConnectorPayload>): string[] {
  const reasons: string[] = [];
  if (!normalize(payload.sourceRef)) {
    reasons.push('aicos_connector.source_ref_required');
  }
  if (!normalize(payload.capturedAt)) {
    reasons.push('aicos_connector.captured_at_required');
  }
  if (!Array.isArray(payload.cards)) {
    reasons.push('aicos_connector.cards_array_required');
  }
  return reasons;
}

export function routeLiveAicosPayloadThroughIntake(
  contract: LiveAicosFetchCacheContract,
  payload: Partial<LiveAicosConnectorPayload>,
): LiveAicosConnectorThroughIntakeResult {
  const reasons: string[] = [];
  if (contract.status === 'blocked') {
    reasons.push(...contract.blockers.map((blocker) => `aicos_connector.contract_blocked:${blocker}`));
  }
  if (contract.status === 'review_required') {
    reasons.push(...contract.reviewItems.map((item) => `aicos_connector.contract_review_required:${item}`));
  }
  if (!contract.liveFetchAllowed) {
    reasons.push('aicos_connector.live_fetch_not_allowed');
  }
  reasons.push(...validatePayload(payload));

  if (reasons.length > 0) {
    return {
      status: contract.status === 'review_required' && reasons.every((reason) => reason.includes('contract_review_required'))
        ? 'review_required'
        : 'blocked',
      sourceRef: normalize(payload.sourceRef),
      capturedAt: normalize(payload.capturedAt),
      reasons: unique(reasons),
      summary: { acceptedCards: 0, quarantinedCards: 0 },
    };
  }

  const intake = intakeAicosCardSnapshots(payload.cards ?? []);
  return {
    status: intake.quarantined.length > 0 ? 'review_required' : 'accepted',
    sourceRef: normalize(payload.sourceRef),
    capturedAt: normalize(payload.capturedAt),
    reasons: intake.quarantined.length > 0 ? ['aicos_connector.intake_quarantine_present'] : [],
    intake,
    summary: {
      acceptedCards: intake.acceptedCards.length,
      quarantinedCards: intake.quarantined.length,
    },
  };
}
