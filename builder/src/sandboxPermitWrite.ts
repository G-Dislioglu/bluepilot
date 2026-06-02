import type { IncomingMessage, ServerResponse } from 'node:http';
import { TextDecoder } from 'node:util';

import { smartPush } from './opusSmartPush.js';

type SmartPushImpl = typeof smartPush;

interface SandboxPermitWriteOptions {
  env?: NodeJS.ProcessEnv;
  now?: Date;
  smartPushImpl?: SmartPushImpl;
}

interface RequestBody {
  confirm?: unknown;
  permitId?: unknown;
  contentBase64?: unknown;
}

export interface SandboxPermitWritePayload {
  service: 'bluepilot-builder';
  repository: typeof SANDBOX_REPO;
  branch: typeof SANDBOX_BRANCH;
  targetFile: typeof SANDBOX_TARGET_FILE;
  timestamp: string;
  status: 'write_succeeded' | 'write_blocked';
  permitId: string;
  contentLen: number;
  pushed: boolean;
  landed?: boolean;
  commitHash?: string;
  error?: string;
}

const SANDBOX_REPO = 'G-Dislioglu/bluepilot-sandbox';
const SANDBOX_BRANCH = 'main';
const SANDBOX_TARGET_FILE = '.bluepilot/phase-3c-permit-write.md';
const CONFIRMATION_PHRASE = 'permit-write-to-bluepilot-sandbox';
const PERMIT_WRITE_ENV = 'BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED';
const MAX_BODY_BYTES = 64 * 1024;
const MAX_PERMIT_ID_LENGTH = 200;

const base64Utf8Decoder = new TextDecoder('utf-8', { fatal: true });

export async function handleSandboxPermitWriteRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: SandboxPermitWriteOptions = {},
): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://bluepilot-builder.local');

  if (url.pathname !== '/probe/sandbox-permit-write') {
    return false;
  }

  if (request.method !== 'POST') {
    writeJson(response, 405, { error: 'method_not_allowed' });
    return true;
  }

  const env = options.env ?? process.env;
  if (env[PERMIT_WRITE_ENV] !== 'true') {
    writeJson(response, 403, { error: 'sandbox_permit_write_disabled', requiredEnv: PERMIT_WRITE_ENV });
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

  if (typeof body.permitId !== 'string' || !body.permitId.trim()) {
    writeJson(response, 400, { error: 'permit_id_required' });
    return true;
  }

  const permitId = body.permitId.trim();
  if (permitId.length > MAX_PERMIT_ID_LENGTH) {
    writeJson(response, 400, { error: 'permit_id_too_long' });
    return true;
  }

  let content: string;
  try {
    content = decodeBase64Utf8(body.contentBase64);
  } catch (error) {
    writeJson(response, 400, { error: error instanceof Error ? error.message : 'invalid_content_base64' });
    return true;
  }

  const now = options.now ?? new Date();
  try {
    const result = await (options.smartPushImpl ?? smartPush)(
      [
        {
          file: SANDBOX_TARGET_FILE,
          mode: 'create',
          content,
        },
      ],
      'BP-146 permit-gated sandbox write',
      {
        targetRepo: SANDBOX_REPO,
        writePermit: {
          permitId,
          op: 'create',
          branch: SANDBOX_BRANCH,
          baseSha: '',
        },
      },
    );

    writeJson(response, 200, summarizeSandboxPermitWriteResult(result, permitId, content, now));
  } catch {
    writeJson(response, 500, { error: 'sandbox_permit_write_failed' });
  }

  return true;
}

function summarizeSandboxPermitWriteResult(
  result: Awaited<ReturnType<SmartPushImpl>>,
  permitId: string,
  content: string,
  now = new Date(),
): SandboxPermitWritePayload {
  return {
    service: 'bluepilot-builder',
    repository: SANDBOX_REPO,
    branch: SANDBOX_BRANCH,
    targetFile: SANDBOX_TARGET_FILE,
    timestamp: now.toISOString(),
    status: result.pushed ? 'write_succeeded' : 'write_blocked',
    permitId,
    contentLen: Buffer.byteLength(content, 'utf8'),
    pushed: result.pushed,
    ...(result.landed !== undefined ? { landed: result.landed } : {}),
    ...(result.commitHash ? { commitHash: result.commitHash } : {}),
    ...(result.error ? { error: result.error } : {}),
  };
}

function decodeBase64Utf8(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    throw new Error('content_base64_required');
  }

  if (value.trim() !== value) {
    throw new Error('content_base64_must_not_have_outer_whitespace');
  }

  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error('invalid_content_base64');
  }

  const decoded = Buffer.from(value, 'base64');
  if (decoded.length === 0) {
    throw new Error('content_required');
  }

  return base64Utf8Decoder.decode(decoded);
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

  const allowed = new Set(['confirm', 'permitId', 'contentBase64']);
  const unexpected = Object.keys(parsed).find((key) => !allowed.has(key));
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
