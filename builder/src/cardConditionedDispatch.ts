import type { WlpContractDraft } from './workerPacketWlpAdapter.js';

export type DispatchCardStatus = 'active' | 'deprecated' | 'blocked';
export type DispatchCardPolicy = 'allow' | 'review_required' | 'block';
export type CardConditionedDispatchDecision = 'allow' | 'review_required' | 'blocked';

export interface DispatchConditionCard {
  cardId: string;
  title: string;
  status: DispatchCardStatus;
  policy: DispatchCardPolicy;
  appliesToPaths?: string[];
  evidenceRef?: string;
  reason?: string;
}

export interface CardConditionedDispatchInput {
  contract: WlpContractDraft;
  requestedCardIds: string[];
  cards: DispatchConditionCard[];
}

export interface CardConditionedDispatchPlan {
  decision: CardConditionedDispatchDecision;
  dispatchAllowed: boolean;
  reviewRequired: boolean;
  reasons: string[];
  contractTaskId: string;
  allowedFiles: string[];
  cards: Array<{
    cardId: string;
    title: string;
    status: DispatchCardStatus;
    policy: DispatchCardPolicy;
    evidenceRef?: string;
  }>;
}

const CARD_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,120}$/;

function normalizeCardId(value: string): string {
  return value.trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalizePath(value: string): string {
  return value.trim().replace(/\\/g, '/').replace(/^\.\//, '');
}

function collectRequestedCards(input: CardConditionedDispatchInput): {
  requestedCardIds: string[];
  errors: string[];
} {
  const requestedCardIds = unique(input.requestedCardIds.map(normalizeCardId).filter(Boolean));
  const errors: string[] = [];

  if (requestedCardIds.length === 0) {
    errors.push('card_condition.requested_cards_required');
  }

  for (const cardId of requestedCardIds) {
    if (!CARD_ID_RE.test(cardId)) {
      errors.push(`card_condition.invalid_card_id:${cardId}`);
    }
  }

  return { requestedCardIds, errors };
}

function cardAppliesToAllowedFiles(card: DispatchConditionCard, allowedFiles: string[]): boolean {
  if (!card.appliesToPaths || card.appliesToPaths.length === 0) {
    return true;
  }

  const allowed = new Set(allowedFiles.map(normalizePath));
  return card.appliesToPaths.map(normalizePath).some((path) => allowed.has(path));
}

export function planCardConditionedDispatch(input: CardConditionedDispatchInput): CardConditionedDispatchPlan {
  const allowedFiles = input.contract.allowed_files.map(normalizePath);
  const { requestedCardIds, errors } = collectRequestedCards(input);
  const cardsById = new Map(input.cards.map((card) => [normalizeCardId(card.cardId), card]));
  const reasons: string[] = [...errors];
  const evidenceCards: CardConditionedDispatchPlan['cards'] = [];

  for (const cardId of requestedCardIds) {
    const card = cardsById.get(cardId);
    if (!card) {
      reasons.push(`card_condition.missing_card:${cardId}`);
      continue;
    }

    evidenceCards.push({
      cardId: normalizeCardId(card.cardId),
      title: card.title,
      status: card.status,
      policy: card.policy,
      ...(card.evidenceRef ? { evidenceRef: card.evidenceRef } : {}),
    });

    if (card.status === 'blocked') {
      reasons.push(`card_condition.blocked_card:${cardId}`);
    }
    if (card.status === 'deprecated') {
      reasons.push(`card_condition.deprecated_card:${cardId}`);
    }
    if (card.policy === 'block') {
      reasons.push(`card_condition.policy_block:${cardId}`);
    }
    if (!cardAppliesToAllowedFiles(card, allowedFiles)) {
      reasons.push(`card_condition.path_mismatch:${cardId}`);
    }
    if (card.policy === 'review_required') {
      reasons.push(`card_condition.review_required:${cardId}`);
    }
  }

  const blockingReasons = reasons.filter((reason) =>
    reason.includes('.requested_cards_required')
    || reason.includes('.invalid_card_id')
    || reason.includes('.missing_card')
    || reason.includes('.blocked_card')
    || reason.includes('.deprecated_card')
    || reason.includes('.policy_block')
    || reason.includes('.path_mismatch'),
  );
  const reviewReasons = reasons.filter((reason) => reason.includes('.review_required'));
  const decision: CardConditionedDispatchDecision = blockingReasons.length > 0
    ? 'blocked'
    : reviewReasons.length > 0
      ? 'review_required'
      : 'allow';

  return {
    decision,
    dispatchAllowed: decision === 'allow',
    reviewRequired: decision === 'review_required',
    reasons: unique(reasons),
    contractTaskId: input.contract.task_id,
    allowedFiles,
    cards: evidenceCards,
  };
}
