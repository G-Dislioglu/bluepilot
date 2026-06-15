import type { IncomingMessage, ServerResponse } from 'node:http';

import { planRuntimeDryRunAdapter } from './runtimeDryRunAdapterContract.js';
import { buildRuntimeDryRunRouteContractResponse } from './runtimeDryRunRouteContract.js';
import type { RuntimeDispatchIntegrationContract } from './runtimeDispatchIntegrationContract.js';

interface RuntimeDryRunRouteOptions {
  enabled?: boolean;
}

interface RuntimeDryRunRouteBody {
  confirm?: unknown;
  instruction?: unknown;
  requestedBy?: unknown;
}

const MAX_BODY_BYTES = 64 * 1024;
const ROUTE_PATH = '/probe/runtime-dry-run';

export async function handleRuntimeDryRunRouteRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: RuntimeDryRunRouteOptions = {},
): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://bluepilot-builder.local');
  if (url.pathname !== ROUTE_PATH) {
    return false;
  }

  const enabled = options.enabled ?? process.env.BLUEPILOT_RUNTIME_DRY_RUN_ROUTE_ENABLED === 'true';
  if (!enabled) {
    writeJson(response, 403, { error: 'runtime_dry_run_route_disabled' });
    return true;
  }

  if (request.method !== 'POST') {
    writeJson(response, 405, { error: 'method_not_allowed' });
    return true;
  }

  let body: RuntimeDryRunRouteBody;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    writeJson(response, 400, { error: error instanceof Error ? error.message : 'invalid_json' });
    return true;
  }

  const instruction = typeof body.instruction === 'string' ? body.instruction : '';
  const requestedBy = typeof body.requestedBy === 'string' ? body.requestedBy : undefined;
  const integration = buildContractOnlyIntegration();
  const plan = planRuntimeDryRunAdapter({ integration, instruction, requestedBy });
  const contractResponse = buildRuntimeDryRunRouteContractResponse({
    method: request.method ?? '',
    body: {
      confirm: typeof body.confirm === 'string' ? body.confirm : undefined,
      instruction,
      requestedBy,
    },
  }, plan);

  writeJson(response, contractResponse.statusCode, contractResponse.body);
  return true;
}

function buildContractOnlyIntegration(): RuntimeDispatchIntegrationContract {
  return {
    status: 'runtime_candidate',
    dryRunAllowed: true,
    runtimeDispatchAllowed: false,
    writePermitRequired: false,
    reasons: [],
    contractTaskId: 'BPK-runtime-dry-run-route',
    mode: 'dry_run_only',
    boundary: {
      executableRouteAllowed: false,
      providerCallAllowed: false,
      databaseWriteAllowed: false,
      githubWriteAllowed: false,
    },
    checklist: [{
      id: 'runtime_route_contract_only',
      passed: true,
      detail: 'route_returns_plan_without_execution',
    }],
  };
}

async function readJsonBody(request: IncomingMessage): Promise<RuntimeDryRunRouteBody> {
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
    return {};
  }

  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('json_object_required');
  }
  return parsed as RuntimeDryRunRouteBody;
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(payload)}\n`);
}
