import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  buildAicosPermissionMapReadonly,
  buildBpkExecutionLedgerReadonly,
  buildPatrolVisualCoverageReadonly,
  buildRepoMutationKillSwitchReadonly,
} from './readonlyIntegrationSurfaces.js';

export async function handleReadonlyIntegrationRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: { now?: Date } = {},
): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://bluepilot-builder.local');

  const builders: Record<string, () => unknown> = {
    '/probe/bpk-execution-ledger': () => buildBpkExecutionLedgerReadonly(options.now),
    '/probe/patrol-visual-coverage': () => buildPatrolVisualCoverageReadonly(options.now),
    '/probe/repo-mutation-kill-switch': () => buildRepoMutationKillSwitchReadonly(options.now),
    '/probe/aicos-permission-map': () => buildAicosPermissionMapReadonly(options.now),
  };

  const buildPayload = builders[url.pathname];
  if (!buildPayload) {
    return false;
  }

  if (request.method !== 'GET') {
    writeJson(response, 405, { error: 'method_not_allowed' });
    return true;
  }

  writeJson(response, 200, buildPayload());
  return true;
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(payload)}\n`);
}
