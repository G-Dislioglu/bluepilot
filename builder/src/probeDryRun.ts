import type { IncomingMessage, ServerResponse } from 'node:http';

import { orchestrateTask, type OpusTaskInput, type OpusTaskResult } from './opusTaskOrchestrator.js';

type OrchestrateTask = (input: OpusTaskInput) => Promise<OpusTaskResult>;

export interface DryRunProbePayload {
  service: 'bluepilot-builder';
  status: OpusTaskResult['status'];
  runId: string;
  timestamp: string;
  summary: string;
  scopeFiles: string[];
  safety: {
    source: 'builder_safety_policy';
    decision?: OpusTaskResult['decision'];
    reason?: string;
    pushAllowed: boolean;
    requiredExternalApproval: boolean;
  };
  phases: Array<{
    phase: string;
    status: string;
  }>;
}

interface ProbeDryRunOptions {
  orchestrator?: OrchestrateTask;
  now?: Date;
}

interface RequestBody {
  instruction?: unknown;
}

const MAX_BODY_BYTES = 128 * 1024;

export async function handleProbeDryRunRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: ProbeDryRunOptions = {},
): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://bluepilot-builder.local');

  if (url.pathname !== '/probe/dry-run') {
    return false;
  }

  if (request.method !== 'POST') {
    writeJson(response, 405, { error: 'method_not_allowed' });
    return true;
  }

  let body: RequestBody;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    writeJson(response, 400, { error: error instanceof Error ? error.message : 'invalid_json' });
    return true;
  }

  if (typeof body.instruction !== 'string' || body.instruction.trim().length === 0) {
    writeJson(response, 400, { error: 'instruction_required' });
    return true;
  }

  let result: OpusTaskResult;
  try {
    result = await (options.orchestrator ?? orchestrateTask)({
      instruction: body.instruction,
      dryRun: true,
      skipDeploy: true,
    });
  } catch {
    writeJson(response, 500, { error: 'dry_run_failed' });
    return true;
  }

  writeJson(response, 200, summarizeDryRunResult(result, options.now));
  return true;
}

export function summarizeDryRunResult(result: OpusTaskResult, now = new Date()): DryRunProbePayload {
  return {
    service: 'bluepilot-builder',
    status: result.status,
    runId: result.runId,
    timestamp: now.toISOString(),
    summary: result.summary,
    scopeFiles: extractScopeFiles(result),
    safety: {
      source: 'builder_safety_policy',
      decision: result.decision,
      reason: result.pushBlockedReason ?? result.approvalReason ?? result.decision,
      pushAllowed: result.pushAllowed === true,
      requiredExternalApproval: result.requiredExternalApproval === true,
    },
    phases: result.phases.map((phase) => ({
      phase: phase.phase,
      status: phase.status,
    })),
  };
}

async function readJsonBody(request: IncomingMessage): Promise<RequestBody> {
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

  return parsed as RequestBody;
}

function extractScopeFiles(result: OpusTaskResult): string[] {
  const scopePhase = result.phases.find((phase) => phase.phase === 'scope');
  const detail = scopePhase?.detail;

  if (!detail || typeof detail !== 'object' || !('files' in detail)) {
    return [];
  }

  const files = (detail as { files?: unknown }).files;
  if (!Array.isArray(files)) {
    return [];
  }

  return files.filter((file): file is string => typeof file === 'string');
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(payload)}\n`);
}
