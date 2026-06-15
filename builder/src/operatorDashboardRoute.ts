import type { IncomingMessage, ServerResponse } from 'node:http';

import { buildEightPointIntegrationReadiness, buildOperatorDashboardModel } from './eightPointIntegrationReadiness.js';
import { renderOperatorDashboardHtml } from './operatorDashboardHtml.js';

const DASHBOARD_PATH = '/cockpit/operator-read-only';
const READINESS_PATH = '/probe/eight-point-integration-readiness';

export async function handleOperatorDashboardRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: { enabled?: boolean; now?: Date } = {},
): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://bluepilot-builder.local');

  if (url.pathname === READINESS_PATH) {
    if (request.method !== 'GET') {
      writeJson(response, 405, { error: 'method_not_allowed' });
      return true;
    }
    writeJson(response, 200, buildEightPointIntegrationReadiness(options.now));
    return true;
  }

  if (url.pathname !== DASHBOARD_PATH) {
    return false;
  }

  const enabled = options.enabled ?? process.env.BLUEPILOT_OPERATOR_READ_ONLY_ROUTE_ENABLED === 'true';
  if (!enabled) {
    writeJson(response, 403, { error: 'operator_read_only_route_disabled' });
    return true;
  }

  if (request.method !== 'GET') {
    writeJson(response, 405, { error: 'method_not_allowed' });
    return true;
  }

  writeHtml(response, 200, renderOperatorDashboardHtml(buildOperatorDashboardModel(options.now)));
  return true;
}

function writeHtml(response: ServerResponse, statusCode: number, html: string): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'text/html; charset=utf-8');
  response.end(html);
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(payload)}\n`);
}
