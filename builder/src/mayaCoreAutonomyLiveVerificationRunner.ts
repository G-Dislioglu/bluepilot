import {
  buildMayaCoreAutonomyVerificationPreflight,
  type MayaCoreAutonomyVerificationPreflight,
  type MayaCoreAutonomyVerificationPreflightRequest,
  type MayaCoreAutonomyVerificationSideEffects,
} from './mayaCoreAutonomyVerificationPreflight.js';

export interface MayaCoreAutonomyLiveVerificationRunRequest extends MayaCoreAutonomyVerificationPreflightRequest {
  executeLiveVerification?: unknown;
}

export interface MayaCoreAutonomyLiveVerificationContract {
  service: 'bluepilot-builder';
  version: 'bluepilot-maya-core-autonomy-live-verification-contract-v0.1';
  generatedAt: string;
  sourceOfTruth: 'maya_kaya';
  endpointEnv: 'MAYA_CORE_URL';
  tokenEnv: ['MAYA_CORE_GATE_TOKEN', 'MAYA_BUILDER_GATE_TOKEN'];
  requestHeader: 'x-maya-core-gate-token';
  boundary: {
    requiresExplicitExecuteFlag: true;
    callsMayaKayaOnlyForVerify: true;
    executesActions: false;
    grantsAutonomyLocally: false;
    callsProviders: false;
    writesFiles: false;
    writesDatabase: false;
    writesGitHub: false;
    deploys: false;
  };
}

export interface MayaCoreAutonomyLiveVerificationResult {
  service: 'bluepilot-builder';
  version: 'bluepilot-maya-core-autonomy-live-verification-run-v0.1';
  generatedAt: string;
  status: 'ready_for_live_verification' | 'verified_by_maya_core' | 'blocked';
  executeLiveVerification: boolean;
  liveVerificationReady: boolean;
  liveVerificationVerified: boolean;
  mayaCoreUrlConfigured: boolean;
  mayaCoreGateTokenConfigured: boolean;
  verificationUrl?: string;
  blockers: string[];
  reviewItems: string[];
  preflight: MayaCoreAutonomyVerificationPreflight;
  mayaCoreResponse?: unknown;
  sideEffects: Omit<MayaCoreAutonomyVerificationSideEffects, 'callsMayaKaya'> & {
    callsMayaKaya: boolean;
  };
  contract: MayaCoreAutonomyLiveVerificationContract;
}

export type MayaCoreAutonomyLiveVerificationFetch = (
  url: string,
  init: {
    method: 'POST';
    headers: Record<string, string>;
    body: string;
  },
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

export interface MayaCoreAutonomyLiveVerificationOptions {
  now?: Date;
  env?: NodeJS.ProcessEnv;
  fetchImpl?: MayaCoreAutonomyLiveVerificationFetch;
}

const AUTHORITY_PATH = '/api/maya/autonomy/authority';

export function buildMayaCoreAutonomyLiveVerificationContract(
  now = new Date(),
): MayaCoreAutonomyLiveVerificationContract {
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-maya-core-autonomy-live-verification-contract-v0.1',
    generatedAt: now.toISOString(),
    sourceOfTruth: 'maya_kaya',
    endpointEnv: 'MAYA_CORE_URL',
    tokenEnv: ['MAYA_CORE_GATE_TOKEN', 'MAYA_BUILDER_GATE_TOKEN'],
    requestHeader: 'x-maya-core-gate-token',
    boundary: {
      requiresExplicitExecuteFlag: true,
      callsMayaKayaOnlyForVerify: true,
      executesActions: false,
      grantsAutonomyLocally: false,
      callsProviders: false,
      writesFiles: false,
      writesDatabase: false,
      writesGitHub: false,
      deploys: false,
    },
  };
}

export async function runMayaCoreAutonomyLiveVerification(
  request: MayaCoreAutonomyLiveVerificationRunRequest,
  options: MayaCoreAutonomyLiveVerificationOptions = {},
): Promise<MayaCoreAutonomyLiveVerificationResult> {
  const now = options.now ?? new Date();
  const env = options.env ?? process.env;
  const mayaCoreUrl = readTrimmedEnv(env, 'MAYA_CORE_URL');
  const gateToken = readTrimmedEnv(env, 'MAYA_CORE_GATE_TOKEN') || readTrimmedEnv(env, 'MAYA_BUILDER_GATE_TOKEN');
  const verificationUrl = resolveAuthorityUrl(mayaCoreUrl);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (mayaCoreUrl && !verificationUrl) blockers.push('maya_core_live.invalid_maya_core_url');

  const preflight = buildMayaCoreAutonomyVerificationPreflight({
    ...request,
    mayaCoreUrlConfigured: Boolean(verificationUrl),
    mayaCoreGateTokenConfigured: Boolean(gateToken),
    verificationEndpoint: AUTHORITY_PATH,
  }, now);
  blockers.push(...preflight.blockers);
  reviewItems.push(...preflight.reviewItems);

  const executeLiveVerification = request.executeLiveVerification === true;
  if (!executeLiveVerification) {
    return buildResult({
      now,
      status: preflight.liveVerificationReady ? 'ready_for_live_verification' : 'blocked',
      executeLiveVerification,
      liveVerificationVerified: false,
      mayaCoreUrlConfigured: Boolean(verificationUrl),
      mayaCoreGateTokenConfigured: Boolean(gateToken),
      verificationUrl,
      blockers,
      reviewItems,
      preflight,
      mayaCoreResponse: undefined,
      callsMayaKaya: false,
    });
  }

  if (!preflight.liveVerificationReady || !preflight.plannedRequest || !verificationUrl || !gateToken) {
    return buildResult({
      now,
      status: 'blocked',
      executeLiveVerification,
      liveVerificationVerified: false,
      mayaCoreUrlConfigured: Boolean(verificationUrl),
      mayaCoreGateTokenConfigured: Boolean(gateToken),
      verificationUrl,
      blockers,
      reviewItems,
      preflight,
      mayaCoreResponse: undefined,
      callsMayaKaya: false,
    });
  }

  let mayaCoreResponse: unknown;
  try {
    const fetchImpl = options.fetchImpl ?? fetch;
    const response = await fetchImpl(verificationUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-maya-core-gate-token': gateToken,
      },
      body: JSON.stringify(preflight.plannedRequest.body),
    });
    mayaCoreResponse = await response.json().catch(() => ({ error: 'invalid_json_response' }));
    if (!response.ok) blockers.push(`maya_core_live.http_${response.status}`);
  } catch (error) {
    blockers.push('maya_core_live.fetch_failed');
    reviewItems.push(error instanceof Error ? `maya_core_live.error:${error.message}` : 'maya_core_live.error:unknown');
  }

  const responseStatus = readObjectString(mayaCoreResponse, 'status');
  const liveVerificationVerified = blockers.length === 0 && responseStatus === 'verified';
  if (blockers.length === 0 && !liveVerificationVerified) {
    blockers.push('maya_core_live.response_not_verified');
  }

  return buildResult({
    now,
    status: liveVerificationVerified ? 'verified_by_maya_core' : 'blocked',
    executeLiveVerification,
    liveVerificationVerified,
    mayaCoreUrlConfigured: Boolean(verificationUrl),
    mayaCoreGateTokenConfigured: Boolean(gateToken),
    verificationUrl,
    blockers,
    reviewItems,
    preflight,
    mayaCoreResponse,
    callsMayaKaya: true,
  });
}

function buildResult(input: {
  now: Date;
  status: MayaCoreAutonomyLiveVerificationResult['status'];
  executeLiveVerification: boolean;
  liveVerificationVerified: boolean;
  mayaCoreUrlConfigured: boolean;
  mayaCoreGateTokenConfigured: boolean;
  verificationUrl?: string;
  blockers: string[];
  reviewItems: string[];
  preflight: MayaCoreAutonomyVerificationPreflight;
  mayaCoreResponse?: unknown;
  callsMayaKaya: boolean;
}): MayaCoreAutonomyLiveVerificationResult {
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-maya-core-autonomy-live-verification-run-v0.1',
    generatedAt: input.now.toISOString(),
    status: input.status,
    executeLiveVerification: input.executeLiveVerification,
    liveVerificationReady: input.preflight.liveVerificationReady,
    liveVerificationVerified: input.liveVerificationVerified,
    mayaCoreUrlConfigured: input.mayaCoreUrlConfigured,
    mayaCoreGateTokenConfigured: input.mayaCoreGateTokenConfigured,
    ...(input.verificationUrl ? { verificationUrl: input.verificationUrl } : {}),
    blockers: unique(input.blockers),
    reviewItems: unique(input.reviewItems),
    preflight: input.preflight,
    ...(input.mayaCoreResponse !== undefined ? { mayaCoreResponse: input.mayaCoreResponse } : {}),
    sideEffects: {
      ...input.preflight.sideEffects,
      callsMayaKaya: input.callsMayaKaya,
    },
    contract: buildMayaCoreAutonomyLiveVerificationContract(input.now),
  };
}

function resolveAuthorityUrl(baseUrl: string): string | undefined {
  if (!baseUrl) return undefined;
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
    url.pathname = `${url.pathname.replace(/\/+$/, '')}${AUTHORITY_PATH}`;
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return undefined;
  }
}

function readTrimmedEnv(env: NodeJS.ProcessEnv, key: string): string {
  return String(env[key] ?? '').trim();
}

function readObjectString(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === 'string' ? candidate : undefined;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
