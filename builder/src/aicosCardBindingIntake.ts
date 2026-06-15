import type {
  DispatchCardPolicy,
  DispatchCardStatus,
  DispatchConditionCard,
} from './cardConditionedDispatch.js';

export interface AicosCardSnapshot {
  cardId: string;
  title: string;
  status: DispatchCardStatus;
  policy: DispatchCardPolicy;
  appliesToPaths?: string[];
  evidenceRef?: string;
  reason?: string;
  source?: string;
  capturedAt?: string;
}

export interface AicosCardQuarantineEntry {
  index: number;
  cardId?: string;
  reasons: string[];
  snapshot: Partial<AicosCardSnapshot>;
}

export interface AicosCardBindingIntakeResult {
  acceptedCards: DispatchConditionCard[];
  quarantined: AicosCardQuarantineEntry[];
  summary: {
    acceptedCount: number;
    quarantinedCount: number;
    duplicateCount: number;
  };
}

const CARD_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,120}$/;
const SAFE_REPO_PATH_RE = /^[A-Za-z0-9._/@-]+(?:\/[A-Za-z0-9._/@-]+)*$/;
const VALID_STATUSES = new Set<DispatchCardStatus>(['active', 'deprecated', 'blocked']);
const VALID_POLICIES = new Set<DispatchCardPolicy>(['allow', 'review_required', 'block']);

function normalizeText(value: string | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}

function normalizePath(value: string): string {
  return value.trim().replace(/\\/g, '/').replace(/^\.\//, '');
}

function validatePath(rawPath: string): string | { error: string } {
  const path = normalizePath(rawPath);
  if (
    !path
    || path.startsWith('/')
    || /^[A-Za-z]:\//.test(path)
    || path.includes('//')
    || path.split('/').some((segment) => !segment || segment === '.' || segment === '..')
    || !SAFE_REPO_PATH_RE.test(path)
  ) {
    return { error: `aicos_card_intake.invalid_path:${rawPath}` };
  }
  return path;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalizePaths(paths: string[] | undefined): { paths: string[]; reasons: string[] } {
  const normalized: string[] = [];
  const reasons: string[] = [];
  for (const path of paths ?? []) {
    const result = validatePath(path);
    if (typeof result === 'string') {
      normalized.push(result);
    } else {
      reasons.push(result.error);
    }
  }
  return { paths: unique(normalized), reasons };
}

function validateSnapshot(snapshot: Partial<AicosCardSnapshot>): {
  card?: DispatchConditionCard;
  reasons: string[];
} {
  const reasons: string[] = [];
  const cardId = normalizeText(snapshot.cardId);
  const title = normalizeText(snapshot.title);
  const evidenceRef = normalizeText(snapshot.evidenceRef);
  const paths = normalizePaths(snapshot.appliesToPaths);

  if (!CARD_ID_RE.test(cardId)) {
    reasons.push(`aicos_card_intake.invalid_card_id:${snapshot.cardId ?? '(missing)'}`);
  }
  if (!title) {
    reasons.push(`aicos_card_intake.title_required:${cardId || '(missing)'}`);
  }
  if (!VALID_STATUSES.has(snapshot.status as DispatchCardStatus)) {
    reasons.push(`aicos_card_intake.invalid_status:${String(snapshot.status)}`);
  }
  if (!VALID_POLICIES.has(snapshot.policy as DispatchCardPolicy)) {
    reasons.push(`aicos_card_intake.invalid_policy:${String(snapshot.policy)}`);
  }
  if (!evidenceRef) {
    reasons.push(`aicos_card_intake.evidence_ref_required:${cardId || '(missing)'}`);
  }
  reasons.push(...paths.reasons);

  if (reasons.length > 0) {
    return { reasons: unique(reasons) };
  }

  return {
    reasons: [],
    card: {
      cardId,
      title,
      status: snapshot.status as DispatchCardStatus,
      policy: snapshot.policy as DispatchCardPolicy,
      ...(paths.paths.length > 0 ? { appliesToPaths: paths.paths } : {}),
      evidenceRef,
      ...(snapshot.reason ? { reason: normalizeText(snapshot.reason) } : {}),
    },
  };
}

export function intakeAicosCardSnapshots(
  snapshots: Array<Partial<AicosCardSnapshot>>,
): AicosCardBindingIntakeResult {
  const acceptedCards: DispatchConditionCard[] = [];
  const quarantined: AicosCardQuarantineEntry[] = [];
  const seenCardIds = new Set<string>();
  let duplicateCount = 0;

  snapshots.forEach((snapshot, index) => {
    const result = validateSnapshot(snapshot);
    const cardId = normalizeText(snapshot.cardId);

    if (result.card && seenCardIds.has(result.card.cardId)) {
      duplicateCount += 1;
      quarantined.push({
        index,
        cardId: result.card.cardId,
        reasons: [`aicos_card_intake.duplicate_card:${result.card.cardId}`],
        snapshot: { ...snapshot },
      });
      return;
    }

    if (!result.card) {
      quarantined.push({
        index,
        ...(cardId ? { cardId } : {}),
        reasons: result.reasons,
        snapshot: { ...snapshot },
      });
      return;
    }

    seenCardIds.add(result.card.cardId);
    acceptedCards.push(result.card);
  });

  return {
    acceptedCards,
    quarantined,
    summary: {
      acceptedCount: acceptedCards.length,
      quarantinedCount: quarantined.length,
      duplicateCount,
    },
  };
}
