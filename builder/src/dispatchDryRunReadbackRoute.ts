import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  runDispatchDryRunSlice,
  type DispatchDryRunSliceInput,
  type DispatchDryRunSliceResult,
} from './dispatchDryRunSlice.js';
import type { DispatchFrontendSurface } from './dispatchFrontendReadiness.js';
import type { RuntimeDispatchAdoptionMode } from './runtimeDispatchIntegrationContract.js';

interface DispatchDryRunReadbackRouteOptions {
  enabled?: boolean;
}

const ROUTE_PATH = '/probe/dispatch-dry-run-readback';
const MAX_BODY_BYTES = 128 * 1024;
const FRONTEND_SURFACES = new Set<DispatchFrontendSurface>([
  'operator_cockpit',
  'review_packet',
  'dispatch_preflight',
]);
const RUNTIME_MODES = new Set<RuntimeDispatchAdoptionMode>([
  'disabled',
  'dry_run_only',
  'operator_approved_write',
]);

export async function handleDispatchDryRunReadbackRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: DispatchDryRunReadbackRouteOptions = {},
): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://bluepilot-builder.local');
  if (url.pathname !== ROUTE_PATH) {
    return false;
  }

  const enabled = options.enabled ?? process.env.BLUEPILOT_DISPATCH_DRY_RUN_READBACK_ROUTE_ENABLED === 'true';
  if (!enabled) {
    return false;
  }

  if (request.method !== 'POST') {
    writeJson(response, 405, { error: 'method_not_allowed' });
    return true;
  }

  let input: DispatchDryRunSliceInput;
  try {
    input = normalizeInput(await readJsonBody(request));
  } catch (error) {
    writeJson(response, 400, { error: error instanceof Error ? error.message : 'invalid_dispatch_dry_run_request' });
    return true;
  }

  const result = runDispatchDryRunSlice(input);
  writeJson(response, 200, buildReadbackResponse(result));
  return true;
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;
    if (totalBytes > MAX_BODY_BYTES) {
      throw new Error('request_body_too_large');
    }
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    throw new Error('json_body_required');
  }

  return JSON.parse(raw) as unknown;
}

function normalizeInput(value: unknown): DispatchDryRunSliceInput {
  if (!isRecord(value)) {
    throw new Error('json_object_required');
  }

  const requestedCardIds = stringArray(value.requestedCardIds, 'requestedCardIds');
  const cards = objectArray(value.cards, 'cards');
  const claimRegistrations = objectArray(value.claimRegistrations, 'claimRegistrations');
  const now = normalizeOptionalDate(value.now);
  const frontendSurface = normalizeFrontendSurface(value.frontendSurface);
  const runtimeMode = normalizeRuntimeMode(value.runtimeMode);
  const requiredRuntimeEvidence = value.requiredRuntimeEvidence === undefined
    ? undefined
    : stringArray(value.requiredRuntimeEvidence, 'requiredRuntimeEvidence');

  if (!isRecord(value.workerPacket)) {
    throw new Error('workerPacket_object_required');
  }

  return {
    workerPacket: value.workerPacket as unknown as DispatchDryRunSliceInput['workerPacket'],
    requestedCardIds,
    cards: cards as DispatchDryRunSliceInput['cards'],
    claimRegistrations: claimRegistrations as DispatchDryRunSliceInput['claimRegistrations'],
    ...(now ? { now } : {}),
    ...(frontendSurface ? { frontendSurface } : {}),
    ...(runtimeMode ? { runtimeMode } : {}),
    ...(requiredRuntimeEvidence ? { requiredRuntimeEvidence } : {}),
  };
}

function buildReadbackResponse(result: DispatchDryRunSliceResult): unknown {
  return {
    ok: result.adapterErrors.length === 0,
    code: result.status === 'blocked' ? 'dispatch_dry_run_readback_blocked' : 'dispatch_dry_run_readback_ready',
    result: {
      status: result.status,
      readiness: result.readiness ? {
        stage: result.readiness.stage,
        dispatchAllowed: result.readiness.dispatchAllowed,
        frontendProjectionAllowed: result.readiness.frontendProjectionAllowed,
      } : null,
      dispatchPlan: result.dispatchPlan ? {
        decision: result.dispatchPlan.decision,
        dispatchAllowed: result.dispatchPlan.dispatchAllowed,
      } : null,
      claimGate: result.claimGate ? {
        decision: result.claimGate.decision,
        dispatchAllowed: result.claimGate.dispatchAllowed,
      } : null,
      invokedSteps: result.invokedSteps,
      sideEffects: result.sideEffects,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${label}_string_array_required`);
  }
  return value;
}

function objectArray(value: unknown, label: string): object[] {
  if (!Array.isArray(value) || value.some((item) => !isRecord(item))) {
    throw new Error(`${label}_object_array_required`);
  }
  return value;
}

function normalizeOptionalDate(value: unknown): Date | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error('now_iso_string_required');
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('now_iso_string_required');
  }
  return date;
}

function normalizeFrontendSurface(value: unknown): DispatchFrontendSurface | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string' || !FRONTEND_SURFACES.has(value as DispatchFrontendSurface)) {
    throw new Error('frontendSurface_invalid');
  }
  return value as DispatchFrontendSurface;
}

function normalizeRuntimeMode(value: unknown): RuntimeDispatchAdoptionMode | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string' || !RUNTIME_MODES.has(value as RuntimeDispatchAdoptionMode)) {
    throw new Error('runtimeMode_invalid');
  }
  return value as RuntimeDispatchAdoptionMode;
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(payload)}\n`);
}
