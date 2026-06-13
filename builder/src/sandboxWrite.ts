import type { IncomingMessage, ServerResponse } from 'node:http';
import { TextDecoder } from 'node:util';

import { outboundFetch } from './outboundHttp.js';
import { smartPush } from './opusSmartPush.js';

type SmartPushImpl = typeof smartPush;
type FetchLike = typeof outboundFetch;

interface SandboxWriteOptions {
  env?: NodeJS.ProcessEnv;
  now?: Date;
  fetchImpl?: FetchLike;
  smartPushImpl?: SmartPushImpl;
}

interface RequestBody {
  path?: unknown;
  contentBase64?: unknown;
  op?: unknown;
  permitId?: unknown;
}

export interface SandboxWritePrevious {
  existed: boolean;
  sha?: string;
  contentBase64?: string;
}

export interface SandboxWritePayload {
  service: 'bluepilot-builder';
  repository: typeof SANDBOX_REPO;
  branch: typeof SANDBOX_BRANCH;
  path: string;
  timestamp: string;
  status: 'write_succeeded' | 'write_blocked';
  op: 'write' | 'delete';
  contentLen: number;
  pushed: boolean;
  landed: boolean;
  previous: SandboxWritePrevious;
  permitId?: string;
  permitOp?: 'create' | 'update';
  commit?: string;
  reason?: string;
}

type GitHubFileState =
  | { exists: true; sha: string; contentBase64: string }
  | { exists: false };

const SANDBOX_REPO = 'G-Dislioglu/bluepilot-sandbox';
const SANDBOX_OWNER = 'G-Dislioglu';
const SANDBOX_NAME = 'bluepilot-sandbox';
const SANDBOX_BRANCH = 'main';
const PERMIT_WRITE_ENV = 'BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED';
const MAX_BODY_BYTES = 64 * 1024;
const MAX_PATH_LENGTH = 200;

const base64Utf8Decoder = new TextDecoder('utf-8', { fatal: true });

export async function handleSandboxWriteRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: SandboxWriteOptions = {},
): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://bluepilot-builder.local');

  if (url.pathname !== '/probe/sandbox-write') {
    return false;
  }

  if (request.method !== 'POST') {
    writeJson(response, 405, { error: 'method_not_allowed' });
    return true;
  }

  const env = options.env ?? process.env;
  if (env[PERMIT_WRITE_ENV] !== 'true') {
    writeJson(response, 403, { error: 'sandbox_write_disabled', requiredEnv: PERMIT_WRITE_ENV });
    return true;
  }

  let body: RequestBody;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    writeJson(response, 400, { error: error instanceof Error ? error.message : 'invalid_json' });
    return true;
  }

  let path: string;
  try {
    path = normalizeSandboxPath(body.path);
  } catch {
    writeJson(response, 400, { error: 'invalid_path' });
    return true;
  }

  let op: 'write' | 'delete';
  try {
    op = normalizeOperation(body.op);
  } catch {
    writeJson(response, 400, { error: 'invalid_operation' });
    return true;
  }

  let content = '';
  try {
    if (op === 'write') {
      content = decodeBase64Utf8(body.contentBase64);
    }
  } catch (error) {
    writeJson(response, 400, { error: error instanceof Error ? error.message : 'invalid_content_base64' });
    return true;
  }

  if (op === 'delete') {
    writeJson(response, 403, {
      error: 'sandbox_delete_requires_dedicated_permit',
      reason: 'delete_undo_permit_not_contractualized',
    });
    return true;
  }

  let permitId: string;
  try {
    permitId = normalizePermitId(body.permitId);
  } catch {
    writeJson(response, 400, { error: 'permit_id_required' });
    return true;
  }

  const token = env.GITHUB_PAT || env.GITHUB_TOKEN || env.GH_TOKEN || '';
  if (!token) {
    writeJson(response, 500, { error: 'github_token_missing' });
    return true;
  }

  const fetchImpl = options.fetchImpl ?? outboundFetch;
  const smartPushImpl = options.smartPushImpl ?? smartPush;
  const now = options.now ?? new Date();

  try {
    const state = await getSandboxFileState(path, token, fetchImpl);
    const previous = summarizePreviousState(state);

    const permitOp = state.exists ? 'update' : 'create';
    const smartPushMode = state.exists ? 'overwrite' : 'create';
    const baseSha = state.exists ? state.sha : '';
    const result = await smartPushImpl(
      [{
        file: path,
        mode: smartPushMode,
        content,
      }],
      `Maya sandbox write: ${path}`,
      {
        targetRepo: SANDBOX_REPO,
        writePermit: {
          permitId,
          op: permitOp,
          branch: SANDBOX_BRANCH,
          baseSha,
        },
      },
    );

    writeJson(response, 200, summarizeSandboxWriteResult(result, path, content, now, previous, permitId, permitOp));
  } catch (error) {
    writeJson(response, 500, {
      error: 'sandbox_write_failed',
      detail: error instanceof Error ? error.message : 'unknown_error',
    });
  }

  return true;
}

function summarizeSandboxWriteResult(
  result: Awaited<ReturnType<SmartPushImpl>>,
  path: string,
  content: string,
  now = new Date(),
  previous: SandboxWritePrevious,
  permitId: string,
  permitOp: 'create' | 'update',
): SandboxWritePayload {
  const pushed = Boolean(result.pushed && result.landed !== false);

  return {
    service: 'bluepilot-builder',
    repository: SANDBOX_REPO,
    branch: SANDBOX_BRANCH,
    path,
    timestamp: now.toISOString(),
    status: pushed ? 'write_succeeded' : 'write_blocked',
    op: 'write',
    contentLen: Buffer.byteLength(content, 'utf8'),
    pushed,
    landed: pushed,
    previous,
    permitId,
    permitOp,
    ...(result.commitHash ? { commit: result.commitHash } : {}),
    ...(!pushed ? { reason: result.error || 'write_not_landed' } : {}),
  };
}

async function getSandboxFileState(path: string, token: string, fetchImpl: FetchLike): Promise<GitHubFileState> {
  const url = `https://api.github.com/repos/${SANDBOX_OWNER}/${SANDBOX_NAME}/contents/${encodePath(path)}?ref=${SANDBOX_BRANCH}`;
  const response = await fetchImpl(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (response.ok) {
    const body = await response.json() as { sha?: unknown; content?: unknown; encoding?: unknown };
    if (typeof body.sha !== 'string' || !body.sha) {
      throw new Error('github_file_sha_missing');
    }

    const contentBase64 = typeof body.content === 'string'
      ? body.content.replace(/\s+/g, '')
      : '';
    if (body.encoding !== 'base64' || !contentBase64) {
      throw new Error('github_file_content_missing');
    }

    return { exists: true, sha: body.sha, contentBase64 };
  }

  if (response.status === 404) {
    return { exists: false };
  }

  throw new Error(`github_file_inspect_failed:${response.status}`);
}

function summarizePreviousState(state: GitHubFileState): SandboxWritePrevious {
  if (!state.exists) {
    return { existed: false };
  }

  return {
    existed: true,
    sha: state.sha,
    contentBase64: state.contentBase64,
  };
}

function normalizeSandboxPath(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('invalid_path');
  }

  const path = value.trim().replace(/\\/g, '/');
  if (!path || path.length > MAX_PATH_LENGTH || path.startsWith('/') || path.includes('//')) {
    throw new Error('invalid_path');
  }

  if (!/^[A-Za-z0-9._/-]+$/.test(path)) {
    throw new Error('invalid_path');
  }

  const segments = path.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new Error('invalid_path');
  }

  return path;
}

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
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

function normalizePermitId(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('permit_id_required');
  }

  const permitId = value.trim();
  if (!permitId || permitId.length > 160 || !/^[A-Za-z0-9._:-]+$/.test(permitId)) {
    throw new Error('permit_id_required');
  }

  return permitId;
}

function normalizeOperation(value: unknown): 'write' | 'delete' {
  if (value === undefined || value === null || value === '' || value === 'write') {
    return 'write';
  }

  if (value === 'delete') {
    return 'delete';
  }

  throw new Error('invalid_operation');
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

  const allowed = new Set(['path', 'contentBase64', 'op', 'permitId']);
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
