import type { IncomingMessage, ServerResponse } from 'node:http';

export interface BluepilotMetaPayload {
  service: 'bluepilot-builder';
  status: 'ok';
  timestamp: string;
  bpkPath: {
    completed: 226;
    total: 226;
    percent: 100;
    knownPathComplete: true;
  };
  git: {
    commit: string;
    branch: string;
  };
  surfaces: {
    health: '/health';
    dbHealth: '/health/db';
    mayaGateHealth: '/health/maya-gate';
    capabilityAudit: '/probe/repo-capability-audit';
    bpkExecutionLedger: '/probe/bpk-execution-ledger';
    patrolVisualCoverage: '/probe/patrol-visual-coverage';
    repoMutationKillSwitch: '/probe/repo-mutation-kill-switch';
    aicosPermissionMap: '/probe/aicos-permission-map';
    goatDesktopBridgeContract: '/probe/goat-desktop-bridge-contract';
    goatDesktopBuilderCuePreflight: '/probe/goat-desktop-builder-cue-preflight';
    mayaCoreGateEnforcement: '/probe/maya-core-gate-enforcement';
    mayaCoreGateEnforcementPreflight: '/probe/maya-core-gate-enforcement-preflight';
    eightPointIntegrationReadiness: '/probe/eight-point-integration-readiness';
    operatorDashboardReadOnly: '/cockpit/operator-read-only';
    cockpitReadOnly: '/cockpit/read-only';
    runtimeDryRun: '/probe/runtime-dry-run';
  };
  sideEffects: {
    metaReadWritesFiles: false;
    metaCallsProviders: false;
    metaExecutesRuntime: false;
  };
}

function envValue(env: NodeJS.ProcessEnv, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return fallback;
}

export function createBluepilotMetaPayload(
  now = new Date(),
  env: NodeJS.ProcessEnv = process.env,
): BluepilotMetaPayload {
  return {
    service: 'bluepilot-builder',
    status: 'ok',
    timestamp: now.toISOString(),
    bpkPath: {
      completed: 226,
      total: 226,
      percent: 100,
      knownPathComplete: true,
    },
    git: {
      commit: envValue(env, ['RENDER_GIT_COMMIT', 'GIT_COMMIT', 'SOURCE_VERSION', 'COMMIT_SHA'], 'unknown'),
      branch: envValue(env, ['RENDER_GIT_BRANCH', 'GIT_BRANCH', 'BRANCH'], 'unknown'),
    },
    surfaces: {
      health: '/health',
      dbHealth: '/health/db',
      mayaGateHealth: '/health/maya-gate',
      capabilityAudit: '/probe/repo-capability-audit',
      bpkExecutionLedger: '/probe/bpk-execution-ledger',
      patrolVisualCoverage: '/probe/patrol-visual-coverage',
      repoMutationKillSwitch: '/probe/repo-mutation-kill-switch',
      aicosPermissionMap: '/probe/aicos-permission-map',
      goatDesktopBridgeContract: '/probe/goat-desktop-bridge-contract',
      goatDesktopBuilderCuePreflight: '/probe/goat-desktop-builder-cue-preflight',
      mayaCoreGateEnforcement: '/probe/maya-core-gate-enforcement',
      mayaCoreGateEnforcementPreflight: '/probe/maya-core-gate-enforcement-preflight',
      eightPointIntegrationReadiness: '/probe/eight-point-integration-readiness',
      operatorDashboardReadOnly: '/cockpit/operator-read-only',
      cockpitReadOnly: '/cockpit/read-only',
      runtimeDryRun: '/probe/runtime-dry-run',
    },
    sideEffects: {
      metaReadWritesFiles: false,
      metaCallsProviders: false,
      metaExecutesRuntime: false,
    },
  };
}

export async function handleMetaRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: { now?: Date; env?: NodeJS.ProcessEnv } = {},
): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://bluepilot-builder.local');

  if (url.pathname !== '/api/meta' && url.pathname !== '/meta') {
    return false;
  }

  if (request.method !== 'GET') {
    writeJson(response, 405, { error: 'method_not_allowed' });
    return true;
  }

  writeJson(response, 200, createBluepilotMetaPayload(options.now, options.env));
  return true;
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(payload)}\n`);
}
