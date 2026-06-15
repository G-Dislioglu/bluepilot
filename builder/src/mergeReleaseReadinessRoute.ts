import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  buildMergeReleaseReadinessContract,
  buildMergeReleaseReadinessPreflight,
  type MergeReleaseReadinessPreflightRequest,
} from './mergeReleaseReadinessPreflight.js';

const CONTRACT_PATH = '/probe/merge-release-readiness-contract';
const PREFLIGHT_PATH = '/probe/merge-release-readiness-preflight';
const MAX_BODY_BYTES = 64 * 1024;

export async function handleMergeReleaseReadinessRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: { now?: Date } = {},
): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://bluepilot-builder.local');

  if (url.pathname === CONTRACT_PATH) {
    if (request.method !== 'GET') {
      writeJson(response, 405, { error: 'method_not_allowed' });
      return true;
    }

    writeJson(response, 200, buildMergeReleaseReadinessContract(options.now));
    return true;
  }

  if (url.pathname !== PREFLIGHT_PATH) {
    return false;
  }

  if (request.method !== 'POST') {
    writeJson(response, 405, { error: 'method_not_allowed' });
    return true;
  }

  let body: MergeReleaseReadinessPreflightRequest;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    writeJson(response, 400, { error: error instanceof Error ? error.message : 'invalid_json' });
    return true;
  }

  writeJson(response, 200, buildMergeReleaseReadinessPreflight(body, options.now));
  return true;
}

async function readJsonBody(request: IncomingMessage): Promise<MergeReleaseReadinessPreflightRequest> {
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

  return parsed as MergeReleaseReadinessPreflightRequest;
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(payload)}\n`);
}
