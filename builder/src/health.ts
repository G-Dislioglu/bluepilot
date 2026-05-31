import type { IncomingMessage, ServerResponse } from 'node:http';
import { sql } from 'drizzle-orm';

import { getDb } from './db.js';

export type DbReadinessStatus = 'reachable' | 'not_configured' | 'unreachable';

export interface HealthPayload {
  service: 'bluepilot-builder';
  status: 'ok';
  timestamp: string;
}

export interface DbReadinessPayload {
  service: 'bluepilot-builder';
  status: DbReadinessStatus;
  timestamp: string;
  detail: string;
}

type DbFactory = typeof getDb;

export function createHealthPayload(now = new Date()): HealthPayload {
  return {
    service: 'bluepilot-builder',
    status: 'ok',
    timestamp: now.toISOString(),
  };
}

export async function checkDbReadiness(dbFactory: DbFactory = getDb, now = new Date()): Promise<DbReadinessPayload> {
  try {
    const db = dbFactory();
    await db.execute(sql`select 1`);

    return {
      service: 'bluepilot-builder',
      status: 'reachable',
      timestamp: now.toISOString(),
      detail: 'database reachable',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status: DbReadinessStatus = message.includes('BLUEPILOT_BUILDER_DATABASE_URL')
      ? 'not_configured'
      : 'unreachable';

    return {
      service: 'bluepilot-builder',
      status,
      timestamp: now.toISOString(),
      detail: status === 'not_configured' ? 'BLUEPILOT_BUILDER_DATABASE_URL is not configured' : 'database unreachable',
    };
  }
}

export async function handleHealthRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: { dbFactory?: DbFactory; now?: Date } = {},
): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://bluepilot-builder.local');

  if (request.method !== 'GET') {
    writeJson(response, 405, { error: 'method_not_allowed' });
    return;
  }

  if (url.pathname === '/health') {
    writeJson(response, 200, createHealthPayload(options.now));
    return;
  }

  if (url.pathname === '/health/db') {
    const readiness = await checkDbReadiness(options.dbFactory, options.now);
    writeJson(response, readiness.status === 'reachable' ? 200 : 503, readiness);
    return;
  }

  writeJson(response, 404, { error: 'not_found' });
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(payload)}\n`);
}
