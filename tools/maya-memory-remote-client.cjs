#!/usr/bin/env node

'use strict';

const APP_ORIGIN = 'bluepilot';
const DEFAULT_USER_ID = 'default';
const DEFAULT_PERSONA_ID = 'maya';

const KEY_SCHEMA = Object.freeze({
  preferred_models: { category: 'preference', topic: 'bluepilot.preferred_models' },
  project_name: { category: 'fact', topic: 'bluepilot.project_name' },
  working_dir: { category: 'fact', topic: 'bluepilot.working_dir' },
  user_preferences: { category: 'preference', topic: 'bluepilot.user_preferences' },
});

class MayaMemoryRemoteUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MayaMemoryRemoteUnavailableError';
  }
}

let fetchImpl = (...args) => fetch(...args);

function getMayaCoreUrl() {
  const raw = (process.env.MAYA_CORE_URL || '').trim();
  return raw ? raw.replace(/\/+$/, '') : null;
}

function getGateToken() {
  return process.env.MAYA_CORE_GATE_TOKEN || process.env.MAYA_BUILDER_GATE_TOKEN || '';
}

function buildHeaders() {
  const token = getGateToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'x-maya-core-gate-token': token } : {}),
  };
}

function assertKnownKey(key) {
  if (!Object.prototype.hasOwnProperty.call(KEY_SCHEMA, key)) {
    throw new Error(`Unsupported remote memory key: ${key}`);
  }
}

function encodeContent(key, value) {
  return JSON.stringify({ key, value });
}

function buildMetaJson(key, value, source) {
  return JSON.stringify({
    bluepilot_key: key,
    bluepilot_value: value,
    bluepilot_source: source || 'bluepilot',
    app_origin: APP_ORIGIN,
  });
}

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (_err) {
    return value;
  }
}

function parseMeta(entry) {
  return parseMaybeJson(entry && (entry.metaJson || entry.meta_json)) || {};
}

function readRemoteKey(entry) {
  const meta = parseMeta(entry);
  if (meta && typeof meta.bluepilot_key === 'string') {
    return meta.bluepilot_key;
  }
  const content = parseMaybeJson(entry && entry.content);
  return content && typeof content.key === 'string' ? content.key : null;
}

function readRemoteValue(entry) {
  const meta = parseMeta(entry);
  if (meta && Object.prototype.hasOwnProperty.call(meta, 'bluepilot_value')) {
    return meta.bluepilot_value;
  }
  const content = parseMaybeJson(entry && entry.content);
  if (content && Object.prototype.hasOwnProperty.call(content, 'value')) {
    return content.value;
  }
  return entry ? entry.content : null;
}

function normalizeReviewStatus(entry) {
  return entry.reviewStatus || entry.review_status || 'pending';
}

function mapRemoteEntry(entry) {
  const key = readRemoteKey(entry);
  return {
    key,
    value: readRemoteValue(entry),
    proposal_only: normalizeReviewStatus(entry) !== 'confirmed',
    source: 'maya-core',
    storage: 'shared_block2',
    offline: false,
    app_origin: entry.appOrigin || entry.app_origin || APP_ORIGIN,
    review_status: normalizeReviewStatus(entry),
    memory_id: entry.id || null,
    updated_at: entry.updatedAt || entry.updated_at || entry.createdAt || entry.created_at || null,
  };
}

async function requestJson(path, init = {}) {
  const baseUrl = getMayaCoreUrl();
  if (!baseUrl) {
    throw new MayaMemoryRemoteUnavailableError('MAYA_CORE_URL not configured');
  }

  const response = await fetchImpl(`${baseUrl}${path}`, {
    method: init.method || 'GET',
    headers: {
      ...buildHeaders(),
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(5000),
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  });

  if (!response.ok) {
    throw new MayaMemoryRemoteUnavailableError(`maya-core memory HTTP ${response.status}`);
  }

  return response.json();
}

async function proposeEntry(key, value, options = {}) {
  assertKnownKey(key);
  const mapping = KEY_SCHEMA[key];
  const body = {
    userId: options.userId || DEFAULT_USER_ID,
    personaId: options.personaId || DEFAULT_PERSONA_ID,
    appOrigin: APP_ORIGIN,
    app_origin: APP_ORIGIN,
    tier: 'working',
    category: mapping.category,
    topic: mapping.topic,
    content: encodeContent(key, value),
    confidence: options.confidence || 75,
    domain: 'bluepilot',
    source: 'external',
    assumption: true,
    keyInsight: `Bluepilot ${key}`,
    topicTags: ['bluepilot', key],
    metaJson: buildMetaJson(key, value, options.source),
    reviewStatus: 'pending',
    review_status: 'pending',
  };
  const data = await requestJson('/api/maya/memory', { method: 'POST', body });
  return mapRemoteEntry(data.entry || data);
}

async function listConfirmed(options = {}) {
  const params = new URLSearchParams({
    origin: APP_ORIGIN,
    persona: options.personaId || DEFAULT_PERSONA_ID,
    user: options.userId || DEFAULT_USER_ID,
    tier: 'working',
  });
  const data = await requestJson(`/api/maya/memory?${params.toString()}`);
  const entries = Array.isArray(data.entries) ? data.entries : [];
  return entries
    .filter((entry) => normalizeReviewStatus(entry) === 'confirmed')
    .map(mapRemoteEntry)
    .filter((entry) => entry.key && Object.prototype.hasOwnProperty.call(KEY_SCHEMA, entry.key));
}

async function readConfirmed(key, options = {}) {
  assertKnownKey(key);
  const entries = await listConfirmed(options);
  return entries.find((entry) => entry.key === key) || null;
}

function setFetchForTests(nextFetch) {
  fetchImpl = nextFetch;
}

function resetFetchForTests() {
  fetchImpl = (...args) => fetch(...args);
}

module.exports = {
  APP_ORIGIN,
  KEY_SCHEMA,
  MayaMemoryRemoteUnavailableError,
  listConfirmed,
  proposeEntry,
  readConfirmed,
  resetFetchForTests,
  setFetchForTests,
};
