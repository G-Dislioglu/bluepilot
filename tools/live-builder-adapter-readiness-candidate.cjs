#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ALLOWED_INTENTS = new Set(['prepare_live_builder_adapter_readiness']);
const BLOCKED_INTENTS = new Set([
  'live_read',
  'create_task',
  'execute_task',
  'approve_task',
  'push_task',
  'deploy_task',
  'configure_auth',
  'configure_secrets',
  'configure_persistence',
  'configure_builder_adapter',
]);

function usage(message) {
  if (message) console.error(message);
  console.error('Usage: node tools/live-builder-adapter-readiness-candidate.cjs --input <path> [--pretty]');
  process.exit(1);
}

function readInput(filePath) {
  const resolved = path.resolve(filePath);
  try {
    return JSON.parse(fs.readFileSync(resolved, 'utf-8').replace(/^\uFEFF/, ''));
  } catch (err) {
    usage(`Input konnte nicht gelesen werden: ${err.message}`);
  }
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return [value];
}

function addReason(reasons, reason) {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function buildOutput(input) {
  const readiness = input.builder_task_create_readiness && typeof input.builder_task_create_readiness === 'object'
    ? input.builder_task_create_readiness
    : {};
  const blockedReasons = [];
  const readinessNotes = [];

  if (!input.live_builder_adapter_readiness_id) addReason(blockedReasons, 'Missing required input: live_builder_adapter_readiness_id.');
  if (!readiness.builder_task_create_readiness_id) addReason(blockedReasons, 'Missing required input: builder_task_create_readiness.builder_task_create_readiness_id.');
  if (!readiness.status) addReason(blockedReasons, 'Missing required input: builder_task_create_readiness.status.');
  if (!readiness.target_repo) addReason(blockedReasons, 'Missing required input: builder_task_create_readiness.target_repo.');
  if (!readiness.builder_adapter_mode) addReason(blockedReasons, 'Missing required input: builder_task_create_readiness.builder_adapter_mode.');
  if (!readiness.task_create_effect) addReason(blockedReasons, 'Missing required input: builder_task_create_readiness.task_create_effect.');
  if (!readiness.execute_effect) addReason(blockedReasons, 'Missing required input: builder_task_create_readiness.execute_effect.');
  if (typeof readiness.builder_task_create_allowed !== 'boolean') addReason(blockedReasons, 'Missing required input: builder_task_create_readiness.builder_task_create_allowed.');
  if (typeof readiness.builder_execute_allowed !== 'boolean') addReason(blockedReasons, 'Missing required input: builder_task_create_readiness.builder_execute_allowed.');
  if (typeof readiness.live_builder_call_allowed !== 'boolean') addReason(blockedReasons, 'Missing required input: builder_task_create_readiness.live_builder_call_allowed.');
  if (!input.adapter_readiness_intent) addReason(blockedReasons, 'Missing required input: adapter_readiness_intent.');
  if (!input.live_builder_target) addReason(blockedReasons, 'Missing required input: live_builder_target.');
  if (!input.auth_posture) addReason(blockedReasons, 'Missing required input: auth_posture.');
  if (!input.secret_source) addReason(blockedReasons, 'Missing required input: secret_source.');
  if (!input.persistence_target) addReason(blockedReasons, 'Missing required input: persistence_target.');
  if (!input.network_effect_requested) addReason(blockedReasons, 'Missing required input: network_effect_requested.');
  if (!input.task_create_effect_requested) addReason(blockedReasons, 'Missing required input: task_create_effect_requested.');
  if (!input.execute_effect_requested) addReason(blockedReasons, 'Missing required input: execute_effect_requested.');

  if (readiness.status && readiness.status !== 'task_create_readiness_prepared') {
    addReason(blockedReasons, `Builder Task Create Readiness status ${readiness.status} cannot prepare Live Builder Adapter Readiness.`);
  }
  if (readiness.builder_task_create_allowed === true) addReason(blockedReasons, 'Builder task create must remain blocked before Live Builder Adapter Readiness.');
  if (readiness.builder_execute_allowed === true) addReason(blockedReasons, 'Builder execute must remain blocked before Live Builder Adapter Readiness.');
  if (readiness.live_builder_call_allowed === true) addReason(blockedReasons, 'Live Builder calls must remain blocked.');
  if (readiness.builder_adapter_mode && readiness.builder_adapter_mode !== 'none') addReason(blockedReasons, 'Builder adapter mode must remain none in Live Builder Adapter Readiness MVP.');
  if (readiness.task_create_effect && readiness.task_create_effect !== 'none') addReason(blockedReasons, 'Task create effect must remain none before Live Builder Adapter Readiness.');
  if (readiness.execute_effect && readiness.execute_effect !== 'none') addReason(blockedReasons, 'Execute effect must remain none before Live Builder Adapter Readiness.');
  if (input.live_builder_target && input.live_builder_target !== 'none') addReason(blockedReasons, 'Live Builder target must remain none in Live Builder Adapter Readiness MVP.');
  if (input.auth_posture && input.auth_posture !== 'none') addReason(blockedReasons, 'Auth posture must remain none in Live Builder Adapter Readiness MVP.');
  if (input.secret_source && input.secret_source !== 'none') addReason(blockedReasons, 'Secret source must remain none in Live Builder Adapter Readiness MVP.');
  if (input.persistence_target && input.persistence_target !== 'none') addReason(blockedReasons, 'Persistence target must remain none in Live Builder Adapter Readiness MVP.');
  if (input.network_effect_requested && input.network_effect_requested !== 'none') addReason(blockedReasons, 'Network effect requested must remain none in Live Builder Adapter Readiness MVP.');
  if (input.task_create_effect_requested && input.task_create_effect_requested !== 'none') addReason(blockedReasons, 'Task create effect requested must remain none in Live Builder Adapter Readiness MVP.');
  if (input.execute_effect_requested && input.execute_effect_requested !== 'none') addReason(blockedReasons, 'Execute effect requested must remain none in Live Builder Adapter Readiness MVP.');
  if (BLOCKED_INTENTS.has(input.adapter_readiness_intent) || (input.adapter_readiness_intent && !ALLOWED_INTENTS.has(input.adapter_readiness_intent))) {
    addReason(blockedReasons, `Adapter readiness intent ${input.adapter_readiness_intent} is not allowed for Live Builder Adapter Readiness MVP.`);
  }

  if (asArray(readiness.readiness_notes).length > 0) addReason(readinessNotes, 'Builder Task Create Readiness notes need human review.');
  if (!readiness.target_repo) addReason(readinessNotes, 'Target repo is missing or not explicit.');

  const status = blockedReasons.length > 0
    ? 'blocked'
    : readinessNotes.length > 0
      ? 'requires_human_review'
      : 'live_builder_adapter_readiness_prepared';

  if (status === 'live_builder_adapter_readiness_prepared') {
    readinessNotes.push('Live Builder adapter readiness is local only. Live Builder, auth, secrets, persistence, task create, approval record, and execute remain blocked.');
  }

  return {
    live_builder_adapter_readiness_id: input.live_builder_adapter_readiness_id || null,
    status,
    target_repo: readiness.target_repo || null,
    live_builder_target: input.live_builder_target || null,
    auth_posture: input.auth_posture || null,
    secret_source: input.secret_source || null,
    persistence_target: input.persistence_target || null,
    network_effect: 'none',
    task_create_effect: 'none',
    execute_effect: 'none',
    builder_task_create_allowed: false,
    builder_execute_allowed: false,
    live_builder_call_allowed: false,
    blocked_reasons: blockedReasons,
    readiness_notes: readinessNotes,
  };
}

const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');
const pretty = args.includes('--pretty');

if (require.main === module) {
  if (inputIndex === -1 || !args[inputIndex + 1] || args[inputIndex + 1].startsWith('--')) usage();

  const input = readInput(args[inputIndex + 1]);
  const output = buildOutput(input);
  process.stdout.write(JSON.stringify(output, null, pretty ? 2 : 0));
  process.stdout.write('\n');
}

module.exports = { buildOutput };
