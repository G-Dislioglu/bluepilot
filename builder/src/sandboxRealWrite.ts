import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  getBuilderTargetProfile,
  type BuilderTargetProfile,
} from './builderTargetProfiles.js';
import { orchestrateTask, type OpusTaskInput, type OpusTaskResult } from './opusTaskOrchestrator.js';

type OrchestrateTask = (input: OpusTaskInput) => Promise<OpusTaskResult>;
type ProfileResolver = (id: string) => BuilderTargetProfile | null;

interface SandboxRealWriteOptions {
  env?: NodeJS.ProcessEnv;
  now?: Date;
  orchestrator?: OrchestrateTask;
  profileResolver?: ProfileResolver;
}

interface RequestBody {
  confirm?: unknown;
}

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
const CONFIRMATION_PHRASE = 'real-write-to-bluepilot-sandbox';
const REAL_WRITE_ENV = 'BLUEPILOT_SANDBOX_REAL_WRITE_ENABLED';
const MAX_BODY_BYTES = 16 * 1024;

export async function handleSandboxRealWriteRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: SandboxRealWriteOptions = {},
): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://bluepilot-builder.local');

  if (url.pathname !== '/probe/sandbox-real-write') {
    return false;
  }

  if (request.method !== 'POST') {
    writeJson(response, 405, { error: 'method_not_allowed' });
    return true;
  }

  const env = options.env ?? process.env;
  if (env[REAL_WRITE_ENV] !== 'true') {
    writeJson(response, 403, { error: 'sandbox_real_write_disabled', requiredEnv: REAL_WRITE_ENV });
    return true;
  }

  let body: RequestBody;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    writeJson(response, 400, { error: error instanceof Error ? error.message : 'invalid_json' });
    return true;
  }

  if (body.confirm !== CONFIRMATION_PHRASE) {
    writeJson(response, 400, {
      error: 'confirmation_required',
      required: CONFIRMATION_PHRASE,
    });
    return true;
  }

  const profile = (options.profileResolver ?? getBuilderTargetProfile)(SANDBOX_PROFILE_ID);
  const guardFailure = validateSandboxProfile(profile);
  if (guardFailure) {
    writeJson(response, 500, { error: 'sandbox_repo_guard_failed', detail: guardFailure });
    return true;
  }

  const now = options.now ?? new Date();
  let result: OpusTaskResult;
  try {
    result = await (options.orchestrator ?? orchestrateTask)(buildSandboxRealWriteInput(now));
  } catch {
    writeJson(response, 500, { error: 'sandbox_real_write_failed' });
    return true;
  }

  writeJson(response, 200, summarizeSandboxRealWriteResult(result, now));
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

function validateSandboxProfile(profile: BuilderTargetProfile | null): string {
  if (!profile) {
    return 'sandbox_profile_missing';
  }

  if (profile.id !== SANDBOX_PROFILE_ID) {
    return 'sandbox_profile_id_mismatch';
  }

  if (profile.repo !== SANDBOX_REPO) {
    return 'sandbox_repo_mismatch';
  }

  if (profile.branch !== SANDBOX_BRANCH) {
    return 'sandbox_branch_mismatch';
  }

  if (profile.writePolicy !== 'sandbox_real_write') {
    return 'sandbox_write_policy_not_enabled';
  }

  if (profile.pushAllowed !== true) {
    return 'sandbox_push_not_allowed';
  }

  return '';
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

  const keys = Object.keys(parsed);
  const unexpected = keys.find((key) => key !== 'confirm');
  if (unexpected) {
    throw new Error(`unexpected_field:${unexpected}`);
  }

  return parsed as RequestBody;
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(payload)}\n`);
}
