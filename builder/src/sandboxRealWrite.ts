import type { IncomingMessage, ServerResponse } from 'node:http';

import type { OpusTaskInput, OpusTaskResult } from './opusTaskOrchestrator.js';

export interface SandboxRealWritePayload {
  service: 'bluepilot-builder';
  repository: typeof SANDBOX_REPO;
  branch: typeof SANDBOX_BRANCH;
  targetProfileId: typeof SANDBOX_PROFILE_ID;
  targetFile: typeof SANDBOX_TARGET_FILE;
  timestamp: string;
  status: OpusTaskResult['status'];
  runId: string;
  summary: string;
  pushAllowed: boolean;
  pushBlockedReason?: string;
  landed?: boolean;
  verifiedCommit?: string;
  phases: Array<{
    phase: string;
    status: string;
  }>;
}

const SANDBOX_PROFILE_ID = 'bluepilot-sandbox';
const SANDBOX_REPO = 'G-Dislioglu/bluepilot-sandbox';
const SANDBOX_BRANCH = 'main';
const SANDBOX_TARGET_FILE = '.bluepilot/phase-b-real-write.md';
const RETIRED_REPLACEMENT = '/probe/sandbox-write';

export async function handleSandboxRealWriteRequest(
  request: IncomingMessage,
  response: ServerResponse,
  _options: Record<string, unknown> = {},
): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://bluepilot-builder.local');

  if (url.pathname !== '/probe/sandbox-real-write') {
    return false;
  }

  writeJson(response, 410, {
    error: 'sandbox_real_write_retired',
    detail: 'Legacy sandbox real-write path is retired. Use the one-shot permit write path instead.',
    replacement: RETIRED_REPLACEMENT,
  });
  return true;
}

export function buildSandboxRealWriteInput(now = new Date()): OpusTaskInput {
  return {
    instruction: [
      `Create or update ${SANDBOX_TARGET_FILE}.`,
      'Write a short Markdown marker for the Bluepilot Phase B sandbox real-write check.',
      `Include timestamp ${now.toISOString()}.`,
      'Do not edit any other file.',
    ].join(' '),
    targetProfileId: SANDBOX_PROFILE_ID,
    dryRun: false,
    scope: [SANDBOX_TARGET_FILE],
    targetFile: SANDBOX_TARGET_FILE,
    skipInlinePostPushChecks: true,
    sourceTaskId: 'BP-141',
  };
}

export function summarizeSandboxRealWriteResult(result: OpusTaskResult, now = new Date()): SandboxRealWritePayload {
  return {
    service: 'bluepilot-builder',
    repository: SANDBOX_REPO,
    branch: SANDBOX_BRANCH,
    targetProfileId: SANDBOX_PROFILE_ID,
    targetFile: SANDBOX_TARGET_FILE,
    timestamp: now.toISOString(),
    status: result.status,
    runId: result.runId,
    summary: result.summary,
    pushAllowed: result.pushAllowed === true,
    ...(result.pushBlockedReason ? { pushBlockedReason: result.pushBlockedReason } : {}),
    ...(result.landed !== undefined ? { landed: result.landed } : {}),
    ...(result.verifiedCommit ? { verifiedCommit: result.verifiedCommit } : {}),
    phases: result.phases.map((phase) => ({
      phase: phase.phase,
      status: phase.status,
    })),
  };
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(payload)}\n`);
}
