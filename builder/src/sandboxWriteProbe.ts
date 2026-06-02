import type { IncomingMessage, ServerResponse } from 'node:http';

const SANDBOX_OWNER = 'G-Dislioglu';
const SANDBOX_REPO = 'bluepilot-sandbox';
const SANDBOX_FULL_NAME = `${SANDBOX_OWNER}/${SANDBOX_REPO}` as const;
const SANDBOX_BRANCH = 'main';
const CONFIRMATION_PHRASE = 'write-to-bluepilot-sandbox';
const WRITE_CHECK_ENV = 'BLUEPILOT_SANDBOX_WRITE_CHECK_ENABLED';
const MAX_BODY_BYTES = 16 * 1024;

type FetchLike = typeof fetch;

interface SandboxWriteProbeOptions {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: FetchLike;
  token?: string;
  now?: Date;
  nonce?: string;
}

interface RequestBody {
  confirm?: unknown;
}

export interface SandboxWriteProbePayload {
  service: 'bluepilot-builder';
  repository: typeof SANDBOX_FULL_NAME;
  branch: typeof SANDBOX_BRANCH;
  status: 'writable' | 'not_configured' | 'not_writable';
  timestamp: string;
  detail: string;
  createCommit?: string;
  deleteCommit?: string;
}

interface GitHubContentResponse {
  content?: {
    sha?: string;
  };
  commit?: {
    sha?: string;
  };
  message?: string;
}

function getGitHubToken(explicitToken?: string): string {
  return (explicitToken ?? process.env.GITHUB_PAT ?? process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? '').trim();
}

function buildProbePath(now: Date, nonce: string): string {
  const stamp = now.toISOString().replace(/[^0-9A-Za-z]/g, '-');
  const safeNonce = nonce.replace(/[^0-9A-Za-z_-]/g, '').slice(0, 32) || 'probe';
  return `.bluepilot/write-check-${stamp}-${safeNonce}.json`;
}

function toBase64Utf8(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64');
}

function sanitizeError(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object' && 'message' in value) {
    return String((value as { message?: unknown }).message);
  }
  return 'github_write_check_failed';
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

async function readGitHubJson(response: Response): Promise<GitHubContentResponse> {
  try {
    return await response.json() as GitHubContentResponse;
  } catch {
    return {};
  }
}

function githubHeaders(token: string): Record<string, string> {
  return {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    'user-agent': 'bluepilot-builder-sandbox-write-check',
    'x-github-api-version': '2022-11-28',
  };
}

export async function checkSandboxWriteAccess(options: SandboxWriteProbeOptions = {}): Promise<SandboxWriteProbePayload> {
  const now = options.now ?? new Date();
  const fetchImpl = options.fetchImpl ?? fetch;
  const token = getGitHubToken(options.token);

  if (!token) {
    return {
      service: 'bluepilot-builder',
      repository: SANDBOX_FULL_NAME,
      branch: SANDBOX_BRANCH,
      status: 'not_configured',
      timestamp: now.toISOString(),
      detail: 'GitHub token is not configured',
    };
  }

  const path = buildProbePath(now, options.nonce ?? Math.random().toString(36).slice(2));
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const url = `https://api.github.com/repos/${SANDBOX_OWNER}/${SANDBOX_REPO}/contents/${encodedPath}`;
  const headers = githubHeaders(token);
  let createdSha = '';
  let createCommit = '';

  try {
    const createResponse = await fetchImpl(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        branch: SANDBOX_BRANCH,
        message: 'Bluepilot sandbox write readiness check',
        content: toBase64Utf8(JSON.stringify({
          source: 'bluepilot-builder',
          purpose: 'sandbox-write-readiness-check',
          createdAt: now.toISOString(),
        }, null, 2)),
      }),
    });
    const createBody = await readGitHubJson(createResponse);

    if (!createResponse.ok || !createBody.content?.sha) {
      return {
        service: 'bluepilot-builder',
        repository: SANDBOX_FULL_NAME,
        branch: SANDBOX_BRANCH,
        status: 'not_writable',
        timestamp: now.toISOString(),
        detail: `create_failed:${createResponse.status}:${sanitizeError(createBody.message)}`,
      };
    }

    createdSha = createBody.content.sha;
    createCommit = createBody.commit?.sha ?? '';

    const deleteResponse = await fetchImpl(url, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({
        branch: SANDBOX_BRANCH,
        message: 'Remove Bluepilot sandbox write readiness check',
        sha: createdSha,
      }),
    });
    const deleteBody = await readGitHubJson(deleteResponse);

    if (!deleteResponse.ok) {
      return {
        service: 'bluepilot-builder',
        repository: SANDBOX_FULL_NAME,
        branch: SANDBOX_BRANCH,
        status: 'not_writable',
        timestamp: now.toISOString(),
        detail: `delete_failed:${deleteResponse.status}:${sanitizeError(deleteBody.message)}`,
        ...(createCommit ? { createCommit } : {}),
      };
    }

    return {
      service: 'bluepilot-builder',
      repository: SANDBOX_FULL_NAME,
      branch: SANDBOX_BRANCH,
      status: 'writable',
      timestamp: now.toISOString(),
      detail: 'sandbox write and cleanup succeeded',
      ...(createCommit ? { createCommit } : {}),
      ...(deleteBody.commit?.sha ? { deleteCommit: deleteBody.commit.sha } : {}),
    };
  } catch (error) {
    return {
      service: 'bluepilot-builder',
      repository: SANDBOX_FULL_NAME,
      branch: SANDBOX_BRANCH,
      status: 'not_writable',
      timestamp: now.toISOString(),
      detail: sanitizeError(error),
      ...(createCommit ? { createCommit } : {}),
    };
  }
}

export async function handleSandboxWriteProbeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: SandboxWriteProbeOptions = {},
): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://bluepilot-builder.local');

  if (url.pathname !== '/probe/sandbox-write-check') {
    return false;
  }

  if (request.method !== 'POST') {
    writeJson(response, 405, { error: 'method_not_allowed' });
    return true;
  }

  const env = options.env ?? process.env;
  if (env[WRITE_CHECK_ENV] !== 'true') {
    writeJson(response, 403, { error: 'sandbox_write_check_disabled', requiredEnv: WRITE_CHECK_ENV });
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

  const readiness = await checkSandboxWriteAccess(options);
  writeJson(response, readiness.status === 'writable' ? 200 : 503, readiness);
  return true;
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(payload)}\n`);
}
