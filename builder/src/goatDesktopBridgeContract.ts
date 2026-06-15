export type GoatBuilderCueSource = 'uia' | 'ocr' | 'active_window' | 'test_cue';

export interface GoatBuilderCuePreflightRequest {
  source?: unknown;
  action_type?: unknown;
  label?: unknown;
  bbox?: unknown;
  confidence?: unknown;
  text?: unknown;
  safe_text_context?: unknown;
  scroll_amount?: unknown;
  context?: unknown;
  vision_hint?: unknown;
}

export interface GoatDesktopBridgeContract {
  service: 'bluepilot-builder';
  version: 'bluepilot-goat-desktop-bridge-contract-v0.1';
  generatedAt: string;
  bridge: {
    localBaseUrl: 'http://127.0.0.1:8765';
    healthEndpoint: '/healthz';
    proposalEndpoint: '/builder-cue';
    method: 'POST';
    scope: 'local_builder_cue_proposal';
  };
  payloadContract: {
    requiredFields: ['source', 'action_type', 'label', 'bbox'];
    acceptedLocalGeometrySources: GoatBuilderCueSource[];
    rejectedSources: ['vision'];
    bboxFormat: '[left, top, right, bottom] finite numeric values with positive size';
  };
  activationBoundary: {
    callsGoatDesktop: false;
    emitsPopupProposal: false;
    requiresPopupApproval: true;
    mayExecute: false;
  };
  sideEffects: GoatDesktopBridgeSideEffects;
}

export interface GoatDesktopBridgeSideEffects {
  fileWrites: false;
  githubWrites: false;
  providerCalls: false;
  runtimeExecution: false;
  durablePersistence: false;
  desktopActions: false;
  mouseActions: false;
  keyboardActions: false;
  screenshotCapture: false;
}

export interface GoatBuilderCuePreflight {
  service: 'bluepilot-builder';
  version: 'bluepilot-goat-builder-cue-preflight-v0.1';
  generatedAt: string;
  status: 'ready_for_local_goat_review' | 'blocked';
  normalizedCue?: {
    source: GoatBuilderCueSource;
    action_type: string;
    label: string;
    bbox: [number, number, number, number];
    confidence?: number;
    text?: string;
    safe_text_context?: boolean;
    scroll_amount?: number;
    context?: Record<string, unknown>;
    vision_hint?: unknown;
  };
  blockers: string[];
  nextStep: string;
  contract: GoatDesktopBridgeContract;
  sideEffects: GoatDesktopBridgeSideEffects;
}

const ACCEPTED_LOCAL_GEOMETRY_SOURCES: GoatBuilderCueSource[] = ['uia', 'ocr', 'active_window', 'test_cue'];

function lockedSideEffects(): GoatDesktopBridgeSideEffects {
  return {
    fileWrites: false,
    githubWrites: false,
    providerCalls: false,
    runtimeExecution: false,
    durablePersistence: false,
    desktopActions: false,
    mouseActions: false,
    keyboardActions: false,
    screenshotCapture: false,
  };
}

export function buildGoatDesktopBridgeContract(now = new Date()): GoatDesktopBridgeContract {
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-goat-desktop-bridge-contract-v0.1',
    generatedAt: now.toISOString(),
    bridge: {
      localBaseUrl: 'http://127.0.0.1:8765',
      healthEndpoint: '/healthz',
      proposalEndpoint: '/builder-cue',
      method: 'POST',
      scope: 'local_builder_cue_proposal',
    },
    payloadContract: {
      requiredFields: ['source', 'action_type', 'label', 'bbox'],
      acceptedLocalGeometrySources: ACCEPTED_LOCAL_GEOMETRY_SOURCES,
      rejectedSources: ['vision'],
      bboxFormat: '[left, top, right, bottom] finite numeric values with positive size',
    },
    activationBoundary: {
      callsGoatDesktop: false,
      emitsPopupProposal: false,
      requiresPopupApproval: true,
      mayExecute: false,
    },
    sideEffects: lockedSideEffects(),
  };
}

export function buildGoatBuilderCuePreflight(
  request: GoatBuilderCuePreflightRequest,
  now = new Date(),
): GoatBuilderCuePreflight {
  const blockers: string[] = [];
  const source = normalizeSource(request.source, blockers);
  const actionType = normalizeRequiredString(request.action_type, 'action_type', blockers);
  const label = normalizeRequiredString(request.label, 'label', blockers);
  const bbox = normalizeBbox(request.bbox, blockers);
  const confidence = normalizeOptionalFiniteNumber(request.confidence, 'confidence', blockers);
  const scrollAmount = normalizeScrollAmount(request.scroll_amount, actionType, blockers);
  const context = normalizeOptionalRecord(request.context, 'context', blockers);
  const safeTextContext = typeof request.safe_text_context === 'boolean'
    ? request.safe_text_context
    : undefined;
  const text = typeof request.text === 'string' ? request.text : undefined;

  const status = blockers.length === 0 ? 'ready_for_local_goat_review' : 'blocked';

  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-goat-builder-cue-preflight-v0.1',
    generatedAt: now.toISOString(),
    status,
    ...(status === 'ready_for_local_goat_review' && source && actionType && label && bbox
      ? {
          normalizedCue: {
            source,
            action_type: actionType,
            label,
            bbox,
            ...(confidence !== undefined ? { confidence } : {}),
            ...(text !== undefined ? { text } : {}),
            ...(safeTextContext !== undefined ? { safe_text_context: safeTextContext } : {}),
            ...(scrollAmount !== undefined ? { scroll_amount: scrollAmount } : {}),
            ...(context !== undefined ? { context } : {}),
            ...(request.vision_hint !== undefined ? { vision_hint: request.vision_hint } : {}),
          },
        }
      : {}),
    blockers,
    nextStep: status === 'ready_for_local_goat_review'
      ? 'Operator may review this cue for a future local-only GOAT /builder-cue call; Bluepilot does not call it here.'
      : 'Fix contract blockers before any GOAT bridge review.',
    contract: buildGoatDesktopBridgeContract(now),
    sideEffects: lockedSideEffects(),
  };
}

function normalizeSource(value: unknown, blockers: string[]): GoatBuilderCueSource | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    blockers.push('goat_builder_cue.source_required');
    return undefined;
  }

  const source = value.trim();
  if (source === 'vision') {
    blockers.push('goat_builder_cue.vision_source_rejected');
    return undefined;
  }

  if (!ACCEPTED_LOCAL_GEOMETRY_SOURCES.includes(source as GoatBuilderCueSource)) {
    blockers.push(`goat_builder_cue.source_not_local_geometry:${source}`);
    return undefined;
  }

  return source as GoatBuilderCueSource;
}

function normalizeRequiredString(value: unknown, field: string, blockers: string[]): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    blockers.push(`goat_builder_cue.${field}_required`);
    return undefined;
  }

  return value.trim();
}

function normalizeBbox(value: unknown, blockers: string[]): [number, number, number, number] | undefined {
  if (!Array.isArray(value) || value.length !== 4) {
    blockers.push('goat_builder_cue.bbox_required');
    return undefined;
  }

  const numbers = value.map((item) => Number(item));
  if (numbers.some((item) => !Number.isFinite(item))) {
    blockers.push('goat_builder_cue.bbox_values_must_be_finite');
    return undefined;
  }

  const [left, top, right, bottom] = numbers;
  if (right <= left || bottom <= top) {
    blockers.push('goat_builder_cue.bbox_must_have_positive_size');
    return undefined;
  }

  return [left, top, right, bottom];
}

function normalizeOptionalFiniteNumber(value: unknown, field: string, blockers: string[]): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    blockers.push(`goat_builder_cue.${field}_must_be_finite`);
    return undefined;
  }

  return numberValue;
}

function normalizeScrollAmount(
  value: unknown,
  actionType: string | undefined,
  blockers: string[],
): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const amount = normalizeOptionalFiniteNumber(value, 'scroll_amount', blockers);
  if (amount === undefined) {
    return undefined;
  }

  if (actionType?.toLowerCase().includes('scroll') && Math.trunc(amount) === 0) {
    blockers.push('goat_builder_cue.scroll_amount_must_not_be_zero');
    return undefined;
  }

  return Math.trunc(amount);
}

function normalizeOptionalRecord(
  value: unknown,
  field: string,
  blockers: string[],
): Record<string, unknown> | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    blockers.push(`goat_builder_cue.${field}_must_be_object`);
    return undefined;
  }

  return value as Record<string, unknown>;
}
