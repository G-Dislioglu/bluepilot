import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';

import { classifyBuilderTask, guardBuilderPush, type BuilderSafetyDecision } from './builderSafetyPolicy.js';
import { resolveSmartPushTargetRepo, smartPush } from './opusSmartPush.js';
import type { WritePermitOperation } from './writePermitContentHash.js';

type SmartPushImpl = typeof smartPush;

interface PermitApplyOptions {
  smartPushImpl?: SmartPushImpl;
  now?: Date;
}

interface PermitApplyRequestBody {
  permitId?: unknown;
  repo?: unknown;
  branch?: unknown;
  path?: unknown;
  content?: unknown;
  baseSha?: unknown;
  op?: unknown;
  approvalId?: unknown;
}

interface ValidPermitApplyInput {
  permitId: string;
  repo: string;
  branch: string;
  path: string;
  content: string;
  baseSha: string;
  op: WritePermitOperation;
  approvalId?: string;
}

export interface PermitApplyPayload {
  service: 'bluepilot-builder';
  status: 'applied' | 'blocked';
  timestamp: string;
  target: {
    repo: string;
    branch: string;
    path: string;
    op: WritePermitOperation;
  };
  permitId: string;
  safety: {
    source: 'builder_safety_policy';
    decision: BuilderSafetyDecision['decision'];
    pushAllowed: boolean;
    requiredExternalApproval: boolean;
    reason?: string;
  };
  result: {
    pushed: boolean;
    filesCount: number;
    asyncDispatch: boolean;
    landed?: boolean;
    commitHash?: string;
    error?: string;
  };
}

const PERMIT_APPLY_PATH = '/probe/permit-apply';
const MAX_BODY_BYTES = 1024 * 1024;

export async function handlePermitApplyRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: PermitApplyOptions = {},
): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://bluepilot-builder.local');

  if (url.pathname !== PERMIT_APPLY_PATH) {
    return false;
  }

  if (request.method !== 'POST') {
    writeJson(response, 405, { error: 'method_not_allowed' });
    return true;
  }

  let body: PermitApplyRequestBody;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    writeJson(response, 400, { error: error instanceof Error ? error.message : 'invalid_json' });
    return true;
  }

  let input: ValidPermitApplyInput;
  try {
    input = validateRequestBody(body);
  } catch (error) {
    writeJson(response, 400, { error: error instanceof Error ? error.message : 'invalid_permit_apply_request' });
    return true;
  }

  const safety = classifyBuilderTask({
    targetFile: input.path,
    files: [input.path],
    approvalId: input.approvalId,
    hasApprovedPlan: Boolean(input.approvalId),
    allowAutonomousPush: true,
    judgeDecision: 'approve',
  });

  const guarded = await guardBuilderPush(safety, async () => {
    const mode = input.op === 'create' ? 'create' : 'overwrite';
    return (options.smartPushImpl ?? smartPush)(
      [{
        file: input.path,
        mode,
        content: input.content,
      }],
      `permit apply: ${input.path}`,
      {
        targetRepo: input.repo,
        writePermit: {
          permitId: input.permitId,
          op: input.op,
          branch: input.branch,
          baseSha: input.baseSha,
        },
      },
    );
  });

  if (!guarded.executed) {
    writeJson(response, 403, {
      error: 'builder_safety_policy_blocked',
      reason: guarded.pushBlockedReason,
      safety: summarizeSafety(guarded.decision),
    });
    return true;
  }

  const statusCode = guarded.result.pushed ? 200 : 409;
  writeJson(response, statusCode, summarizeApplyResult(input, guarded.decision, guarded.result, options.now));
  return true;
}

function validateRequestBody(body: PermitApplyRequestBody): ValidPermitApplyInput {
  const permitId = readRequiredString(body.permitId, 'permitId', 'write_permit_required');
  const repo = readRequiredString(body.repo, 'repo', 'write_permit_incomplete');
  const branch = readRequiredString(body.branch, 'branch', 'write_permit_incomplete');
  const targetPath = readRequiredString(body.path, 'path', 'write_permit_incomplete');
  const content = readContent(body.content);
  const baseSha = readString(body.baseSha, 'baseSha', 'write_permit_incomplete');
  const op = readOperation(body.op);
  const approvalId = readOptionalString(body.approvalId, 'approvalId');
  const target = resolveSmartPushTargetRepo(repo);

  if (target.isDefault) {
    throw new Error('default_target_repo_forbidden');
  }
  if (!isRepoRelativePath(targetPath)) {
    throw new Error('invalid_target_path');
  }

  return {
    permitId,
    repo,
    branch,
    path: targetPath,
    content,
    baseSha,
    op,
    ...(approvalId ? { approvalId } : {}),
  };
}

function readRequiredString(value: unknown, field: string, error: string): string {
  const result = readString(value, field, error).trim();
  if (!result) {
    throw new Error(error);
  }
  return result;
}

function readString(value: unknown, field: string, error: string): string {
  if (typeof value !== 'string') {
    throw new Error(error || `${field}_required`);
  }
  return value;
}

function readOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error(`${field}_invalid`);
  }
  return value.trim() || undefined;
}

function readContent(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('write_permit_incomplete');
  }
  return value;
}

function readOperation(value: unknown): WritePermitOperation {
  if (value === 'create' || value === 'update') {
    return value;
  }
  throw new Error('write_permit_incomplete');
}

function isRepoRelativePath(value: string): boolean {
  const normalized = value.replace(/\\/g, '/').replace(/^\.\/+/, '');
  if (!normalized || path.isAbsolute(normalized)) {
    return false;
  }
  return !normalized.split('/').some((part) => part === '..' || part === '');
}

async function readJsonBody(request: IncomingMessage): Promise<PermitApplyRequestBody> {
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

  return parsed as PermitApplyRequestBody;
}

function summarizeApplyResult(
  input: ValidPermitApplyInput,
  safety: BuilderSafetyDecision,
  result: Awaited<ReturnType<SmartPushImpl>>,
  now = new Date(),
): PermitApplyPayload {
  return {
    service: 'bluepilot-builder',
    status: result.pushed ? 'applied' : 'blocked',
    timestamp: now.toISOString(),
    target: {
      repo: input.repo,
      branch: input.branch,
      path: input.path,
      op: input.op,
    },
    permitId: input.permitId,
    safety: summarizeSafety(safety),
    result: {
      pushed: result.pushed,
      filesCount: result.filesCount,
      asyncDispatch: result.asyncDispatch,
      ...(result.landed !== undefined ? { landed: result.landed } : {}),
      ...(result.commitHash ? { commitHash: result.commitHash } : {}),
      ...(result.error ? { error: result.error } : {}),
    },
  };
}

function summarizeSafety(safety: BuilderSafetyDecision): PermitApplyPayload['safety'] {
  return {
    source: 'builder_safety_policy',
    decision: safety.decision,
    pushAllowed: safety.pushAllowed,
    requiredExternalApproval: safety.requiredExternalApproval,
    ...(safety.reasons[0] ? { reason: safety.reasons[0] } : {}),
  };
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(payload)}\n`);
}
