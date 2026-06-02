import { outboundFetch, type OutboundFetchInit, type OutboundFetchResponse } from './outboundHttp.js';
import { isPremiumProviderModel } from './premiumModelGate.js';

export type BuilderGateReason =
  | 'under_threshold'
  | 'budget_stop'
  | 'premium_model_stop'
  | 'gate_unavailable'
  | 'free_judgment'
  | 'dry_run_allowed'
  | 'kill_switch_closed'
  | 'ethics_blocked'
  | 'operator_approval_required'
  | 'approved_irreversible_action';

export interface BuilderGateDecision {
  allowed: boolean;
  reason: BuilderGateReason | string;
  requiresOperatorDecision?: boolean;
  requiresApproval?: boolean;
  dryRunOnly?: boolean;
  caseForOperator?: unknown;
  gateAvailable?: boolean;
}

export interface BudgetAssessInput {
  taskId?: string;
  providerId: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  taskDescription?: string;
}

export interface CorridorAssessInput {
  intent: string;
  actionKind: 'write_file' | 'push' | 'deploy';
  dryRun?: boolean;
  approvedByOperator?: boolean;
  permitId?: string;
  repo?: string;
  branch?: string;
  path?: string;
  op?: 'create' | 'update';
  baseSha?: string;
  contentHash?: string;
  contentLen?: number;
}

export class MayaBuilderGateBlockedError extends Error {
  constructor(
    public readonly gate: 'budget' | 'corridor',
    public readonly decision: BuilderGateDecision,
  ) {
    super(`maya_builder_${gate}_blocked:${decision.reason}`);
    this.name = 'MayaBuilderGateBlockedError';
  }
}

type GateFetch = (input: string, init?: OutboundFetchInit) => Promise<OutboundFetchResponse>;

let gateFetch: GateFetch = outboundFetch;

function getMayaCoreUrl(): string | null {
  const raw = process.env.MAYA_CORE_URL?.trim();
  return raw ? raw.replace(/\/+$/, '') : null;
}

function getGateToken(): string {
  return process.env.MAYA_CORE_GATE_TOKEN || process.env.MAYA_BUILDER_GATE_TOKEN || '';
}

function buildHeaders(): Record<string, string> {
  const token = getGateToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'x-maya-core-gate-token': token } : {}),
  };
}

function estimateTextTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function extractMessageText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => {
      if (!part || typeof part !== 'object') return '';
      const record = part as Record<string, unknown>;
      if (record.type === 'text' && typeof record.text === 'string') return record.text;
      if (record.type === 'image') return '[image]';
      return '';
    })
    .join('\n');
}

export function estimateProviderInputTokens(params: { system?: string; messages?: Array<{ content: unknown }> }): number {
  const text = [
    params.system || '',
    ...(params.messages || []).map((message) => extractMessageText(message.content)),
  ].join('\n');
  return estimateTextTokens(text);
}

export function estimateProviderOutputTokens(text: string): number {
  return estimateTextTokens(text);
}

function shouldFailClosedWithoutGate(input: BudgetAssessInput): boolean {
  return isPremiumProviderModel(input.providerId, input.modelId);
}

async function postToGate(path: string, body: unknown): Promise<BuilderGateDecision> {
  const baseUrl = getMayaCoreUrl();
  if (!baseUrl) {
    throw new Error('maya_core_url_not_configured');
  }

  const response = await gateFetch(`${baseUrl}${path}`, {
    method: 'POST',
    signal: AbortSignal.timeout(5_000),
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`maya_core_gate_http_${response.status}:${text.slice(0, 200)}`);
  }

  return await response.json() as BuilderGateDecision;
}

export async function assessBudget(input: BudgetAssessInput): Promise<BuilderGateDecision> {
  try {
    const decision = await postToGate('/api/builder/budget/assess', input);
    return { ...decision, gateAvailable: true };
  } catch (error) {
    if (!shouldFailClosedWithoutGate(input)) {
      return {
        allowed: true,
        reason: 'gate_unavailable',
        requiresOperatorDecision: false,
        gateAvailable: false,
      };
    }

    return {
      allowed: false,
      reason: 'gate_unavailable',
      requiresOperatorDecision: true,
      gateAvailable: false,
      caseForOperator: {
        what: `Premium or expensive model call ${input.providerId}/${input.modelId} cannot be checked.`,
        why: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export async function assessCorridor(input: CorridorAssessInput): Promise<BuilderGateDecision> {
  try {
    const decision = await postToGate('/api/builder/corridor/assess', input);
    return { ...decision, gateAvailable: true };
  } catch (error) {
    return {
      allowed: false,
      reason: 'gate_unavailable',
      requiresApproval: true,
      dryRunOnly: true,
      gateAvailable: false,
      caseForOperator: {
        what: `${input.actionKind} cannot be checked before an irreversible builder action.`,
        why: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export async function recordCost(input: BudgetAssessInput & { outputTokens: number; at?: string }): Promise<{ recorded: boolean; error?: string }> {
  try {
    await postToGate('/api/builder/cost/record', input);
    return { recorded: true };
  } catch (error) {
    return {
      recorded: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function assertGateAllowed(gate: 'budget' | 'corridor', decision: BuilderGateDecision): void {
  if (!decision.allowed) {
    throw new MayaBuilderGateBlockedError(gate, decision);
  }
}

export function setMayaBuilderGateFetchForTests(fetchImpl: GateFetch): void {
  gateFetch = fetchImpl;
}

export function resetMayaBuilderGateClientForTests(): void {
  gateFetch = outboundFetch;
}
