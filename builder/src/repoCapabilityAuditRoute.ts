import type { IncomingMessage, ServerResponse } from 'node:http';

import { buildRepoCapabilityAudit } from './repoCapabilityAudit.js';

export async function handleRepoCapabilityAuditRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: { now?: Date } = {},
): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://bluepilot-builder.local');

  if (url.pathname !== '/probe/repo-capability-audit') {
    return false;
  }

  if (request.method !== 'GET') {
    writeJson(response, 405, { error: 'method_not_allowed' });
    return true;
  }

  writeJson(response, 200, buildRepoCapabilityAudit(options.now));
  return true;
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(payload)}\n`);
}
