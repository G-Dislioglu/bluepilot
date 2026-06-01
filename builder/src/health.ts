import type { IncomingMessage, ServerResponse } from 'node:http';
import { sql } from 'drizzle-orm';

import { getDb } from './db.js';
import {
  assessBudget,
  assessCorridor,
  recordCost,
  type BuilderGateDecision,
  type BudgetAssessInput,
  type CorridorAssessInput,
} from './mayaBuilderGateClient.js';

export type DbReadinessStatus = 'reachable' | 'not_configured' | 'unreachable';
export type GateProbeStatus = 'reachable' | 'unreachable';

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

export interface GateProbeResult {
  reachable: boolean;
  status: GateProbeStatus;
  reason?: string;
  recorded?: boolean;
}

export interface MayaGateProbePayload {
  service: 'bluepilot-builder';
  mayaCoreConfigured: boolean;
  timestamp: string;
  budget: GateProbeResult;
  corridor: GateProbeResult;
  cost: GateProbeResult;
}

type DbFactory = typeof getDb;

interface MayaGateProbeClient {
  assessBudget(input: BudgetAssessInput): Promise<BuilderGateDecision>;
  assessCorridor(input: CorridorAssessInput): Promise<BuilderGateDecision>;
  recordCost(input: BudgetAssessInput & { outputTokens: number; at?: string }): Promise<{ recorded: boolean; error?: string }>;
}

const defaultMayaGateProbeClient: MayaGateProbeClient = {
  assessBudget,
  assessCorridor,
  recordCost,
};

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

function isMayaCoreConfigured(): boolean {
  const coreUrl = process.env.MAYA_CORE_URL?.trim();
  const gateToken = (process.env.MAYA_CORE_GATE_TOKEN || process.env.MAYA_BUILDER_GATE_TOKEN || '').trim();
  return Boolean(coreUrl && gateToken);
}

function gateDecisionToProbe(decision: BuilderGateDecision): GateProbeResult {
  const reachable = decision.gateAvailable === true;
  return {
    reachable,
    status: reachable ? 'reachable' : 'unreachable',
    reason: typeof decision.reason === 'string' ? decision.reason : undefined,
  };
}

async function runDecisionProbe(label: 'budget' | 'corridor', action: () => Promise<BuilderGateDecision>): Promise<GateProbeResult> {
  try {
    return gateDecisionToProbe(await action());
  } catch (error) {
    return {
      reachable: false,
      status: 'unreachable',
      reason: error instanceof Error ? `${label}_probe_error:${error.message}` : `${label}_probe_error`,
    };
  }
}

async function runCostProbe(action: () => Promise<{ recorded: boolean; error?: string }>): Promise<GateProbeResult> {
  try {
    const result = await action();
    return {
      reachable: result.recorded === true,
      status: result.recorded === true ? 'reachable' : 'unreachable',
      recorded: result.recorded === true,
      reason: result.recorded === true ? 'recorded' : result.error || 'cost_record_failed',
    };
  } catch (error) {
    return {
      reachable: false,
      status: 'unreachable',
      recorded: false,
      reason: error instanceof Error ? `cost_probe_error:${error.message}` : 'cost_probe_error',
    };
  }
}

export async function checkMayaGateReadiness(
  gateClient: MayaGateProbeClient = defaultMayaGateProbeClient,
  now = new Date(),
): Promise<MayaGateProbePayload> {
  const budgetPayload: BudgetAssessInput = {
    taskId: 'bp-135-maya-gate-readiness',
    providerId: 'openai',
    modelId: 'gpt-4.1-nano',
    inputTokens: 1,
    outputTokens: 1,
    taskDescription: 'Bluepilot Builder Maya gate readiness probe',
  };

  const corridorPayload: CorridorAssessInput = {
    intent: 'Bluepilot Builder Maya gate readiness dry-run probe',
    actionKind: 'push',
    dryRun: true,
  };

  const [budget, corridor, cost] = await Promise.all([
    runDecisionProbe('budget', () => gateClient.assessBudget(budgetPayload)),
    runDecisionProbe('corridor', () => gateClient.assessCorridor(corridorPayload)),
    runCostProbe(() => gateClient.recordCost({ ...budgetPayload, at: now.toISOString() })),
  ]);

  return {
    service: 'bluepilot-builder',
    mayaCoreConfigured: isMayaCoreConfigured(),
    timestamp: now.toISOString(),
    budget,
    corridor,
    cost,
  };
}

export async function handleHealthRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: { dbFactory?: DbFactory; gateClient?: MayaGateProbeClient; now?: Date } = {},
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

  if (url.pathname === '/health/maya-gate') {
    const readiness = await checkMayaGateReadiness(options.gateClient, options.now);
    const allReachable = readiness.budget.reachable && readiness.corridor.reachable && readiness.cost.reachable;
    writeJson(response, allReachable ? 200 : 503, readiness);
    return;
  }

  writeJson(response, 404, { error: 'not_found' });
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(payload)}\n`);
}
