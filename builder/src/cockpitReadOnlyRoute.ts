import type { IncomingMessage, ServerResponse } from 'node:http';

import type { CockpitProjectionAdoptionContract } from './cockpitProjectionAdoptionContract.js';
import { renderCockpitReadOnlyHtml } from './cockpitReadOnlyHtml.js';

interface CockpitReadOnlyRouteOptions {
  enabled?: boolean;
}

const ROUTE_PATH = '/cockpit/read-only';
const MAX_BODY_BYTES = 128 * 1024;

export async function handleCockpitReadOnlyRouteRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: CockpitReadOnlyRouteOptions = {},
): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://bluepilot-builder.local');
  if (url.pathname !== ROUTE_PATH) {
    return false;
  }

  const enabled = options.enabled ?? process.env.BLUEPILOT_COCKPIT_READ_ONLY_ROUTE_ENABLED === 'true';
  if (!enabled) {
    writeJson(response, 403, { error: 'cockpit_read_only_route_disabled' });
    return true;
  }

  if (request.method === 'GET') {
    writeHtml(response, 200, renderCockpitReadOnlyHtml(sampleCockpitModel()));
    return true;
  }

  if (request.method !== 'POST') {
    writeJson(response, 405, { error: 'method_not_allowed' });
    return true;
  }

  let model: unknown;
  try {
    model = await readJsonBody(request);
  } catch (error) {
    writeJson(response, 400, { error: error instanceof Error ? error.message : 'invalid_json' });
    return true;
  }

  if (!isCockpitModel(model)) {
    writeJson(response, 400, { error: 'cockpit_model_invalid' });
    return true;
  }

  writeHtml(response, 200, renderCockpitReadOnlyHtml(model));
  return true;
}

function sampleCockpitModel(): CockpitProjectionAdoptionContract {
  return {
    status: 'review',
    cockpitModelAllowed: true,
    executableActionAllowed: false,
    audience: 'operator',
    contractTaskId: 'BPK-sample-cockpit',
    reasons: ['cockpit_sample.review_required'],
    headline: 'Operator review required',
    panels: [
      {
        id: 'sample.dispatch',
        title: 'Dispatch decision',
        status: 'review',
        lines: ['dispatch_allowed:false', 'frontend_projection_allowed:true'],
      },
      {
        id: 'sample.runtime',
        title: 'Runtime integration',
        status: 'review',
        lines: ['status:operator_review', 'dry_run_allowed:false'],
      },
      {
        id: 'sample.claims',
        title: 'Pre-registered claims',
        status: 'ready',
        lines: ['decision:allow', 'claims:2'],
      },
    ],
    actions: [
      { id: 'open_runtime_dispatch', enabled: false, reason: 'contract_only_no_runtime_action' },
      { id: 'open_write', enabled: false, reason: 'write_actions_require_later_contract' },
    ],
  };
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

function isCockpitModel(value: unknown): value is CockpitProjectionAdoptionContract {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const model = value as Partial<CockpitProjectionAdoptionContract>;
  return typeof model.status === 'string'
    && typeof model.cockpitModelAllowed === 'boolean'
    && model.executableActionAllowed === false
    && typeof model.audience === 'string'
    && typeof model.contractTaskId === 'string'
    && typeof model.headline === 'string'
    && Array.isArray(model.reasons)
    && Array.isArray(model.panels)
    && Array.isArray(model.actions);
}

function writeHtml(response: ServerResponse, statusCode: number, html: string): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'text/html; charset=utf-8');
  response.end(html);
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(payload)}\n`);
}
