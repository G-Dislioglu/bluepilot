/**
 * providers.ts — Unified callProvider() for discuss-style LLM calls.
 * Uses OpenAI Responses API for OpenAI and chat/completions-compatible
 * transports for xAI, DeepSeek, OpenRouter, Moonshot, and Zhipu.
 * No structured-output schema — expects free JSON or plain text responses.
 */

import { outboundFetch, type OutboundFetchInit, type OutboundFetchResponse } from './outboundHttp.js';
import { assertPremiumModelAllowed, type PremiumModelApprovalSource } from './premiumModelGate.js';
import {
  assertGateAllowed,
  assessBudget,
  estimateProviderInputTokens,
  estimateProviderOutputTokens,
  recordCost,
} from './mayaBuilderGateClient.js';
import {
  assessLocalSafetyGuard,
  assertLocalSafetyAllowed,
  recordLocalProviderTokens,
} from './localSafetyGuard.js';

interface ProviderEndpoint {
  apiUrl: string;
  envKey: string;
}

const PROVIDER_ENDPOINTS: Record<string, ProviderEndpoint> = {
  openai:   { apiUrl: 'https://api.openai.com/v1/responses',        envKey: 'OPENAI_API_KEY' },
  xai:      { apiUrl: 'https://api.x.ai/v1/chat/completions',       envKey: 'XAI_API_KEY' },
  deepseek: { apiUrl: 'https://api.deepseek.com/chat/completions',   envKey: 'DEEPSEEK_API_KEY' },
  openrouter: { apiUrl: 'https://openrouter.ai/api/v1/chat/completions', envKey: 'OPENROUTER_API_KEY' },
  moonshot: { apiUrl: 'https://api.moonshot.ai/v1/chat/completions', envKey: 'MOONSHOT_API_KEY' },
  zhipu:    { apiUrl: 'https://api.z.ai/api/paas/v4/chat/completions', envKey: 'ZHIPU_API_KEY' },
};

const RETRYABLE_HTTP_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const RETRY_DELAY_MS = [250, 800];
const PROVIDER_TIMEOUT_MS = 240_000; // 240s per request — slow providers plus large moderator inputs
const ANTHROPIC_ENV_KEY = 'ANTHROPIC_API_KEY';
const PROVIDER_DEGRADED_TTL_MS = 120_000;

type ProviderDegradedState = {
  reason: string;
  until: number;
};

const providerDegradedState = new Map<string, ProviderDegradedState>();

function buildProviderDegradedKey(provider: string, model: string): string {
  return `${provider}:${model}`;
}

function buildProviderLabel(provider: string, model: string): string {
  return `${provider}/${model}`;
}

function shouldDisableOpenRouterReasoning(model: string): boolean {
  return model.startsWith('qwen/') || model.startsWith('z-ai/glm-');
}

function normalizeOpenAiReasoning(
  model: string,
  reasoning: CallProviderParams['reasoning'],
): { effort: 'low' | 'medium' | 'high' } | undefined {
  if (reasoning === false) {
    return undefined;
  }

  if (reasoning === true) {
    return { effort: 'low' };
  }

  if (reasoning && typeof reasoning === 'object' && 'effort' in reasoning && reasoning.effort) {
    return { effort: reasoning.effort };
  }

  if (model.startsWith('gpt-5') || model.startsWith('o3') || model.startsWith('o4')) {
    return { effort: 'low' };
  }

  return undefined;
}

function normalizeOpenRouterReasoning(
  model: string,
  reasoning: CallProviderParams['reasoning'],
): { enabled: boolean } | undefined {
  if (reasoning && typeof reasoning === 'object' && 'enabled' in reasoning && typeof reasoning.enabled === 'boolean') {
    return { enabled: reasoning.enabled };
  }

  if (shouldDisableOpenRouterReasoning(model)) {
    return { enabled: false };
  }

  return undefined;
}

function normalizeXaiReasoningEffort(reasoning: CallProviderParams['reasoning']): 'none' | 'low' | 'medium' | 'high' | undefined {
  if (reasoning === false) return 'none';
  if (reasoning && typeof reasoning === 'object' && 'effort' in reasoning && reasoning.effort) {
    return reasoning.effort;
  }
  return undefined;
}

function isDeepSeekV4Model(provider: string, model: string): boolean {
  return provider === 'deepseek' && /^deepseek-v4-(flash|pro)$/.test(model);
}

function resolveDeepSeekV4Thinking(
  provider: string,
  model: string,
  params: CallProviderParams,
): { type: 'enabled' | 'disabled' } | undefined {
  if (!isDeepSeekV4Model(provider, model)) {
    return undefined;
  }

  if (params.reasoning === false || params.thinking === 'disabled') {
    return { type: 'disabled' };
  }

  if (params.reasoning || params.thinking === 'enabled') {
    return { type: 'enabled' };
  }

  // DeepSeek V4 defaults to thinking mode. For generic calls we opt out unless
  // the caller explicitly requests reasoning, keeping routine scouts cheap/fast.
  return { type: 'disabled' };
}

function normalizeDeepSeekReasoningEffort(
  thinking: { type: 'enabled' | 'disabled' } | undefined,
  reasoning: CallProviderParams['reasoning'],
): 'high' | undefined {
  if (thinking?.type !== 'enabled') {
    return undefined;
  }

  if (reasoning === true) {
    return 'high';
  }

  if (reasoning && typeof reasoning === 'object' && 'effort' in reasoning && reasoning.effort) {
    return 'high';
  }

  return undefined;
}

function isMoonshotKimiModel(provider: string, model: string): boolean {
  return provider === 'moonshot' && /^kimi-k2\./.test(model);
}

function isGemini3Model(model: string): boolean {
  return model.startsWith('gemini-3');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readProviderDegradedState(provider: string, model: string): ProviderDegradedState | undefined {
  const state = providerDegradedState.get(buildProviderDegradedKey(provider, model));
  if (!state) {
    return undefined;
  }

  if (state.until <= Date.now()) {
    providerDegradedState.delete(buildProviderDegradedKey(provider, model));
    return undefined;
  }

  return state;
}

function markProviderDegraded(provider: string, model: string, reason: string): void {
  providerDegradedState.set(buildProviderDegradedKey(provider, model), {
    reason,
    until: Date.now() + PROVIDER_DEGRADED_TTL_MS,
  });
}

function clearProviderDegraded(provider: string, model: string): void {
  providerDegradedState.delete(buildProviderDegradedKey(provider, model));
}

function isRetryableTransportError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /wsasend|forcibly closed|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|EAI_FAIL|EAI_AGAIN|ENOTFOUND|unreachable|network|fetch failed|unavailable|dns/i.test(message);
}

async function fetchWithRetries(url: string, init: OutboundFetchInit, provider: string, model: string): Promise<OutboundFetchResponse> {
  const providerLabel = buildProviderLabel(provider, model);
  const degraded = readProviderDegradedState(provider, model);
  if (degraded) {
    throw new Error(`${providerLabel} temporarily degraded: ${degraded.reason}`);
  }

  const maxAttempts = RETRY_DELAY_MS.length + 1;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const timeoutSignal = AbortSignal.timeout(PROVIDER_TIMEOUT_MS);
      const response = await outboundFetch(url, {
        ...init,
        signal: init.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal,
      });
      if (RETRYABLE_HTTP_STATUS.has(response.status) && attempt < maxAttempts) {
        const delayMs = RETRY_DELAY_MS[attempt - 1] ?? RETRY_DELAY_MS[RETRY_DELAY_MS.length - 1] ?? 250;
        console.warn(`[providers] ${providerLabel} transient HTTP ${response.status}, retrying`, { attempt, maxAttempts, delayMs });
        await sleep(delayMs);
        continue;
      }
      clearProviderDegraded(provider, model);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts && isRetryableTransportError(error)) {
        const delayMs = RETRY_DELAY_MS[attempt - 1] ?? RETRY_DELAY_MS[RETRY_DELAY_MS.length - 1] ?? 250;
        console.warn(`[providers] ${providerLabel} transport error, retrying`, {
          attempt,
          maxAttempts,
          delayMs,
          error: error instanceof Error ? error.message : String(error),
        });
        await sleep(delayMs);
        continue;
      }
      if (isRetryableTransportError(error)) {
        markProviderDegraded(
          provider,
          model,
          error instanceof Error ? error.message : String(error),
        );
      }
      throw error;
    }
  }

  throw (lastError instanceof Error ? lastError : new Error(`${provider} API request failed after retries`));
}

export interface CallProviderParams {
  system: string;
  messages: ProviderMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  forceJsonObject?: boolean;
  /** Controls GLM thinking/reasoning mode. 'enabled' for workers (quality), 'disabled' for scouts (speed). Default: 'disabled'. */
  thinking?: 'enabled' | 'disabled';
  /** Controls Gemini 3 thinking level for latency/quality-sensitive calls. */
  geminiThinkingLevel?: 'minimal' | 'low' | 'medium' | 'high';
  reasoning?: boolean | { enabled: boolean } | { effort: 'low' | 'medium' | 'high' };
  premiumApproval?: PremiumModelApprovalSource;
  anthropicThinking?:
    | { type: 'enabled'; budget_tokens: number }
    | { type: 'disabled' }
    | { type: 'adaptive' };
}

export type ProviderMessagePart =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mediaType: string; detail?: 'auto' | 'low' | 'high' };

export interface ProviderMessage {
  role: 'user' | 'assistant';
  content: string | ProviderMessagePart[];
}

function normalizeMessageParts(content: ProviderMessage['content']): ProviderMessagePart[] {
  if (typeof content === 'string') {
    return [{ type: 'text', text: content }];
  }
  return content;
}

function messageHasImage(content: ProviderMessage['content']): boolean {
  return normalizeMessageParts(content).some((part) => part.type === 'image');
}

function providerSupportsVision(provider: string): boolean {
  return provider === 'anthropic'
    || provider === 'gemini'
    || provider === 'openai'
    || provider === 'openrouter'
    || provider === 'moonshot'
    || provider === 'xai'
    || provider === 'zhipu';
}

function assertProviderVisionSupport(provider: string, model: string, messages: ProviderMessage[]) {
  const needsVision = messages.some((message) => messageHasImage(message.content));
  if (needsVision && !providerSupportsVision(provider)) {
    throw new Error(`${provider}/${model} does not support image inputs in the current provider transport`);
  }
}

function buildAnthropicContent(content: ProviderMessage['content']) {
  return normalizeMessageParts(content).map((part) => {
    if (part.type === 'text') {
      return { type: 'text', text: part.text };
    }
    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: part.mediaType,
        data: part.data,
      },
    };
  });
}

function buildGeminiParts(content: ProviderMessage['content']) {
  return normalizeMessageParts(content).map((part) => {
    if (part.type === 'text') {
      return { text: part.text };
    }
    return {
      inlineData: {
        mimeType: part.mediaType,
        data: part.data,
      },
    };
  });
}

function buildOpenAiResponsesContent(content: ProviderMessage['content']) {
  return normalizeMessageParts(content).map((part) => {
    if (part.type === 'text') {
      return { type: 'input_text', text: part.text };
    }
    return {
      type: 'input_image',
      image_url: `data:${part.mediaType};base64,${part.data}`,
      detail: part.detail ?? 'auto',
    };
  });
}

function buildOpenAiCompatibleContent(content: ProviderMessage['content']): string | Array<Record<string, unknown>> {
  const parts = normalizeMessageParts(content);
  if (parts.every((part) => part.type === 'text')) {
    return parts.map((part) => part.type === 'text' ? part.text : '').join('\n');
  }

  return parts.map((part) => {
    if (part.type === 'text') {
      return { type: 'text', text: part.text };
    }
    return {
      type: 'image_url',
      image_url: {
        url: `data:${part.mediaType};base64,${part.data}`,
        detail: part.detail ?? 'auto',
      },
    };
  });
}

function shouldUseJsonResponseFormat(provider: string, model: string, params: CallProviderParams): boolean {
  return params.forceJsonObject !== false && !isMoonshotKimiModel(provider, model);
}

function messageTextForJsonGuard(content: ProviderMessage['content']): string {
  return normalizeMessageParts(content)
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('\n');
}

function hasJsonInstruction(params: CallProviderParams): boolean {
  return [
    params.system,
    ...params.messages.map((message) => messageTextForJsonGuard(message.content)),
  ].some((text) => /\bjson\b/i.test(text));
}

function buildOpenAiCompatibleSystemPrompt(provider: string, model: string, params: CallProviderParams): string {
  if (provider === 'deepseek' && shouldUseJsonResponseFormat(provider, model, params) && !hasJsonInstruction(params)) {
    return `${params.system || ''}\n\nReturn valid JSON.`.trim();
  }
  return params.system;
}

export function buildOpenAiCompatibleChatCompletionRequest(
  provider: string,
  model: string,
  params: CallProviderParams,
): Record<string, unknown> {
  const openRouterReasoning = normalizeOpenRouterReasoning(model, params.reasoning);
  const xaiReasoningEffort = normalizeXaiReasoningEffort(params.reasoning);
  const deepSeekThinking = resolveDeepSeekV4Thinking(provider, model, params);
  const deepSeekReasoningEffort = normalizeDeepSeekReasoningEffort(deepSeekThinking, params.reasoning);
  const omitGenericTemperature = isMoonshotKimiModel(provider, model)
    || (provider === 'deepseek' && deepSeekThinking?.type === 'enabled');
  const useJsonResponseFormat = shouldUseJsonResponseFormat(provider, model, params);
  const systemPrompt = buildOpenAiCompatibleSystemPrompt(provider, model, params);

  return {
    // Chat Completions format (xAI, DeepSeek, OpenRouter, Moonshot, Zhipu)
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...params.messages.map((message) => ({
        role: message.role,
        content: buildOpenAiCompatibleContent(message.content),
      })),
    ],
    ...(useJsonResponseFormat ? { response_format: { type: 'json_object' } } : {}),
    ...(omitGenericTemperature ? {} : { temperature: params.temperature ?? 0.85 }),
    max_tokens: params.maxTokens ?? 2000,
    ...(provider === 'deepseek' && model.includes('reasoner')
      ? { max_completion_tokens: params.maxTokens ?? 2000 }
      : {}),
    ...(provider === 'deepseek' && deepSeekThinking
      ? { thinking: deepSeekThinking }
      : {}),
    ...(provider === 'deepseek' && deepSeekReasoningEffort
      ? { reasoning_effort: deepSeekReasoningEffort }
      : {}),
    ...(provider === 'openrouter' && openRouterReasoning
      ? { reasoning: openRouterReasoning }
      : {}),
    ...(provider === 'xai' && xaiReasoningEffort
      ? { reasoning_effort: xaiReasoningEffort }
      : {}),
    ...(isMoonshotKimiModel(provider, model)
      ? { thinking: { type: params.thinking ?? 'disabled' } }
      : {}),
    // Direct Zhipu calls still use the native thinking parameter.
    ...(provider === 'zhipu'
      ? { thinking: { type: params.thinking ?? 'disabled' } }
      : {}),
  };
}

async function assertBuilderBudgetGate(provider: string, model: string, params: CallProviderParams): Promise<number> {
  const inputTokens = estimateProviderInputTokens({ system: params.system, messages: params.messages });
  const outputTokens = params.maxTokens ?? 2000;
  assertLocalSafetyAllowed(assessLocalSafetyGuard({
    target: 'provider_call',
    requestedProviderTokens: inputTokens + outputTokens,
  }));
  const decision = await assessBudget({
    taskId: process.env.MAYA_BUILDER_TASK_ID || 'soulmatch-builder',
    providerId: provider,
    modelId: model,
    inputTokens,
    outputTokens,
    taskDescription: `soulmatch builder model call ${provider}/${model}`,
  });
  assertGateAllowed('budget', decision);
  return inputTokens;
}

async function recordBuilderCost(provider: string, model: string, inputTokens: number, outputText: string): Promise<void> {
  const outputTokens = estimateProviderOutputTokens(outputText);
  recordLocalProviderTokens(inputTokens + outputTokens);
  const result = await recordCost({
    taskId: process.env.MAYA_BUILDER_TASK_ID || 'soulmatch-builder',
    providerId: provider,
    modelId: model,
    inputTokens,
    outputTokens,
    taskDescription: `soulmatch builder model call ${provider}/${model}`,
  });

  if (!result.recorded && process.env.NODE_ENV !== 'test') {
    console.warn('[maya-builder-gate] cost recording failed', {
      provider,
      model,
      error: result.error,
    });
  }
}

/**
 * Calls any supported provider via the chat/completions endpoint.
 * Returns the raw text content of the first choice.
 * Throws on HTTP error or missing content.
 */
export async function callProvider(
  provider: string,
  model: string,
  params: CallProviderParams,
  clientApiKey?: string,
): Promise<string> {
  assertPremiumModelAllowed(provider, model, params.premiumApproval);
  assertProviderVisionSupport(provider, model, params.messages);
  const openAiReasoning = normalizeOpenAiReasoning(model, params.reasoning);
  const gateInputTokens = await assertBuilderBudgetGate(provider, model, params);

  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY || clientApiKey;
    if (!apiKey) throw new Error('No API key for gemini. Set GEMINI_API_KEY on server.');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = params.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: buildGeminiParts(m.content),
    }));

    const resp = await fetchWithRetries(url, {
      method: 'POST',
      signal: params.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: params.system
          ? { parts: [{ text: params.system }] }
          : undefined,
        generationConfig: {
          maxOutputTokens: params.maxTokens ?? 2000,
          ...(isGemini3Model(model) ? { thinkingConfig: { thinkingLevel: params.geminiThinkingLevel ?? 'low' } } : {}),
          ...(isGemini3Model(model) ? {} : { temperature: params.temperature ?? 0.85 }),
        },
      }),
    }, 'gemini', model);

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`gemini API ${resp.status}: ${errText}`);
    }

    const data = await resp.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string; inlineData?: { data?: string; mimeType?: string } }>;
        };
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('') ?? '';
    const output = typeof text === 'string' ? text : '';
    await recordBuilderCost(provider, model, gateInputTokens, output);
    return output;
  }

  if (provider === 'anthropic') {
    if (process.env.ANTHROPIC_USAGE_ENABLED === 'false') {
      throw new Error('anthropic provider disabled by ANTHROPIC_USAGE_ENABLED=false.');
    }
    const apiKey = process.env[ANTHROPIC_ENV_KEY] || clientApiKey;
    if (!apiKey) throw new Error(`No API key for anthropic. Set ${ANTHROPIC_ENV_KEY} on server.`);

    const url = 'https://api.anthropic.com/v1/messages';
    const isOpus47OrLater =
      model.startsWith('claude-opus-4-7')
      || model.startsWith('claude-opus-4-8')
      || model.startsWith('claude-opus-5');

    const body: Record<string, unknown> = {
      model,
      system: params.system || undefined,
      messages: params.messages.map((message) => ({
        role: message.role,
        content: buildAnthropicContent(message.content),
      })),
      max_tokens: params.maxTokens ?? 2000,
    };

    if (isOpus47OrLater) {
      body.thinking = { type: 'adaptive' };
    } else if (params.anthropicThinking) {
      body.thinking = params.anthropicThinking;
    } else {
      body.temperature = params.temperature ?? 0.7;
    }

    const resp = await fetchWithRetries(url, {
      method: 'POST',
      signal: params.signal,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }, 'anthropic', model);

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`anthropic API ${resp.status}: ${errText}`);
    }

    const data = await resp.json() as {
      content?: Array<{ type?: string; text?: string }>;
    };

    const text = data.content
      ?.filter((block) => block.type === 'text')
      .map((block) => block.text)
      .filter(Boolean)
      .join('') ?? '';

    if (!text) throw new Error('No text content in anthropic response');

    let content = text.trim();
    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    await recordBuilderCost(provider, model, gateInputTokens, content);
    return content;
  }

  const endpoint = PROVIDER_ENDPOINTS[provider];
  if (!endpoint) throw new Error(`Unknown provider: ${provider}`);

  const apiKey = process.env[endpoint.envKey] || clientApiKey;
  if (!apiKey) throw new Error(`No API key for ${provider}. Set ${endpoint.envKey} on server.`);

  const resp = await fetchWithRetries(endpoint.apiUrl, {
    method: 'POST',
    signal: params.signal,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      provider === 'openai'
        ? {
            // Responses API format (GPT-5 reasoning models)
            model,
            input: [
              { role: 'system', content: [{ type: 'input_text', text: params.system }] },
              ...params.messages.map((message) => ({
                role: message.role,
                content: buildOpenAiResponsesContent(message.content),
              })),
            ],
            ...(openAiReasoning ? { reasoning: openAiReasoning } : {}),
            max_output_tokens: params.maxTokens ?? 2000,
          }
        : {
            ...buildOpenAiCompatibleChatCompletionRequest(provider, model, params),
          },
    ),
  }, provider, model);

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`${provider} API ${resp.status}: ${errText}`);
  }

  const data = await resp.json() as Record<string, unknown>;

  if (provider === 'openai') {
    console.log('[providers] OpenAI raw response:', JSON.stringify(data, null, 2));
  }

  // Responses API (OpenAI GPT-5): output_text convenience field, then output[] items
  // Chat Completions (xAI, DeepSeek): choices[0].message.content
  type Choices = Array<{
    finish_reason?: string;
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
      reasoning_content?: string;
      reasoning_details?: unknown[];
      refusal?: string | null;
    };
    reasoning_details?: unknown[];
  }>;
  type Output = Array<{ type?: string; content?: Array<{ type?: string; text?: string }>; text?: string }>;

  const choices = data.choices as Choices | undefined;
  const output = data.output as Output | undefined;
  const outputText = typeof data.output_text === 'string' ? data.output_text : undefined;
  const firstChoice = choices?.[0];
  const firstMessage = firstChoice?.message;
  const messageContent = firstMessage?.content;
  const messageText = typeof messageContent === 'string'
    ? messageContent
    : Array.isArray(messageContent)
      ? messageContent.map((part) => part.text).filter(Boolean).join('')
      : undefined;

  // Walk output[] items: find first message item with text content
  let outputItemText: string | undefined;
  if (output) {
    for (const item of output) {
      if (item.content) {
        for (const part of item.content) {
          if (part.type === 'output_text' || part.type === 'text') {
            outputItemText = part.text;
            break;
          }
        }
      } else if (typeof item.text === 'string') {
        outputItemText = item.text;
        break;
      }
      if (outputItemText) break;
    }
  }

  let content: string | undefined =
    outputText ||
    outputItemText ||
    messageText ||
    undefined;

  // DeepSeek Reasoner: Wenn content leer, nutze reasoning_content als Fallback
  if (!content && firstMessage?.reasoning_content) {
    content = firstMessage.reasoning_content;
  }

  if (!content) {
    const diagnostics = {
      finishReason: firstChoice?.finish_reason ?? null,
      messageKeys: firstMessage ? Object.keys(firstMessage) : [],
      contentType: Array.isArray(messageContent) ? 'array' : typeof messageContent,
      contentParts: Array.isArray(messageContent) ? messageContent.map((part) => part.type ?? 'unknown') : [],
      hasReasoningContent: typeof firstMessage?.reasoning_content === 'string' && firstMessage.reasoning_content.length > 0,
      hasReasoningDetails: Array.isArray(firstMessage?.reasoning_details) || Array.isArray(firstChoice?.reasoning_details),
      hasRefusal: typeof firstMessage?.refusal === 'string' && firstMessage.refusal.length > 0,
    };
    throw new Error(`No content in ${provider} response (${JSON.stringify(diagnostics)})`);
  }

  content = content.trim();
  if (content.startsWith('```')) {
    content = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  await recordBuilderCost(provider, model, gateInputTokens, content);
  return content;
}

export function getProviderApiKey(provider: string, clientApiKey?: string): string | undefined {
  if (provider === 'gemini') {
    return process.env.GEMINI_API_KEY || clientApiKey || undefined;
  }
  if (provider === 'anthropic') {
    return process.env.ANTHROPIC_API_KEY || clientApiKey || undefined;
  }
  const endpoint = PROVIDER_ENDPOINTS[provider];
  if (!endpoint) return undefined;
  return process.env[endpoint.envKey] || clientApiKey || undefined;
}
