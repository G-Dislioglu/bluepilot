import type { BuilderSafetyDecision } from './builderSafetyPolicy.js';

export type LocalSafetyTarget = 'provider_call' | 'write_action' | 'runtime_execution';
export type LocalSafetyStatus = 'allowed' | 'blocked';
export type LocalSafetyReason =
  | 'local_emergency_stop'
  | 'local_daily_provider_token_cap';

export interface LocalSafetyGuardInput {
  target: LocalSafetyTarget;
  requestedProviderTokens?: number;
  now?: Date;
  env?: NodeJS.ProcessEnv;
}

export interface LocalSafetyGuardDecision {
  status: LocalSafetyStatus;
  allowed: boolean;
  reason?: LocalSafetyReason;
  detail?: string;
  dayKey: string;
  providerTokensUsedToday: number;
  providerTokenLimit?: number;
}

export class LocalSafetyGuardBlockedError extends Error {
  constructor(public readonly decision: LocalSafetyGuardDecision) {
    super(`bluepilot_local_safety_blocked:${decision.reason}`);
    this.name = 'LocalSafetyGuardBlockedError';
  }
}

export const LOCAL_EMERGENCY_STOP_ENV = 'BLUEPILOT_LOCAL_EMERGENCY_STOP';
export const LOCAL_DAILY_PROVIDER_TOKEN_LIMIT_ENV = 'BLUEPILOT_LOCAL_DAILY_PROVIDER_TOKEN_LIMIT';

const providerTokensByDay = new Map<string, number>();

function isTruthyFlag(value: string | undefined): boolean {
  return /^(1|true|yes|on)$/i.test(value?.trim() ?? '');
}

function dayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return Math.floor(parsed);
}

function usedTokensForDay(key: string): number {
  return providerTokensByDay.get(key) ?? 0;
}

export function assessLocalSafetyGuard(input: LocalSafetyGuardInput): LocalSafetyGuardDecision {
  const env = input.env ?? process.env;
  const now = input.now ?? new Date();
  const key = dayKey(now);
  const used = usedTokensForDay(key);

  if (isTruthyFlag(env[LOCAL_EMERGENCY_STOP_ENV])) {
    return {
      status: 'blocked',
      allowed: false,
      reason: 'local_emergency_stop',
      detail: `${LOCAL_EMERGENCY_STOP_ENV} is enabled`,
      dayKey: key,
      providerTokensUsedToday: used,
    };
  }

  const providerTokenLimit = parsePositiveInteger(env[LOCAL_DAILY_PROVIDER_TOKEN_LIMIT_ENV]);
  if (input.target === 'provider_call' && providerTokenLimit !== undefined) {
    const requested = Math.max(0, Math.ceil(input.requestedProviderTokens ?? 0));
    if (used + requested > providerTokenLimit) {
      return {
        status: 'blocked',
        allowed: false,
        reason: 'local_daily_provider_token_cap',
        detail: `projected provider tokens ${used + requested} exceed local daily cap ${providerTokenLimit}`,
        dayKey: key,
        providerTokensUsedToday: used,
        providerTokenLimit,
      };
    }
  }

  return {
    status: 'allowed',
    allowed: true,
    dayKey: key,
    providerTokensUsedToday: used,
    ...(providerTokenLimit !== undefined ? { providerTokenLimit } : {}),
  };
}

export function assertLocalSafetyAllowed(decision: LocalSafetyGuardDecision): void {
  if (!decision.allowed) {
    throw new LocalSafetyGuardBlockedError(decision);
  }
}

export function recordLocalProviderTokens(tokens: number, now = new Date()): void {
  const key = dayKey(now);
  const normalized = Math.max(0, Math.ceil(tokens));
  providerTokensByDay.set(key, usedTokensForDay(key) + normalized);
}

export function applyLocalSafetyToBuilderSafetyDecision(
  decision: BuilderSafetyDecision,
  localSafety: LocalSafetyGuardDecision,
): BuilderSafetyDecision {
  if (localSafety.allowed) {
    return decision;
  }

  const reason = `Local safety guard blocked: ${localSafety.reason}`;
  return {
    ...decision,
    taskClass: 'class_3',
    executionPolicy: 'manual_only',
    decision: 'block',
    pushAllowed: false,
    requiredExternalApproval: true,
    approvalReason: decision.approvalReason ?? reason,
    reasons: [...decision.reasons, reason],
  };
}

export function resetLocalSafetyGuardForTests(): void {
  providerTokensByDay.clear();
}
