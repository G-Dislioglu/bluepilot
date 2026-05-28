#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ALLOWED_INTENTS = new Set(['prepare_builder_task_create_readiness']);
const BLOCKED_INTENTS = new Set([
  'create_task',
  'execute_task',
  'approve_task',
  'push_task',
  'deploy_task',
  'live_builder_call',
  'configure_builder_adapter',
]);

function usage(message) {
  if (message) console.error(message);
  console.error('Usage: node tools/builder-task-create-readiness-candidate.cjs --input <path> [--pretty]');
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
  const readiness = input.auth_persistence_readiness && typeof input.auth_persistence_readiness === 'object'
    ? input.auth_persistence_readiness
    : {};
  const blockedReasons = [];
  const readinessNotes = [];

  if (!input.builder_task_create_readiness_id) addReason(blockedReasons, 'Missing required input: builder_task_create_readiness_id.');
  if (!readiness.auth_persistence_readiness_id) addReason(blockedReasons, 'Missing required input: auth_persistence_readiness.auth_persistence_readiness_id.');
  if (!readiness.status) addReason(blockedReasons, 'Missing required input: auth_persistence_readiness.status.');
  if (!readiness.target_repo) addReason(blockedReasons, 'Missing required input: auth_persistence_readiness.target_repo.');
  if (!readiness.identity_provider) addReason(blockedReasons, 'Missing required input: auth_persistence_readiness.identity_provider.');
  if (!readiness.persistence_target) addReason(blockedReasons, 'Missing required input: auth_persistence_readiness.persistence_target.');
  if (!readiness.approval_record_effect) addReason(blockedReasons, 'Missing required input: auth_persistence_readiness.approval_record_effect.');
  if (typeof readiness.identity_ready !== 'boolean') addReason(blockedReasons, 'Missing required input: auth_persistence_readiness.identity_ready.');
  if (typeof readiness.persistence_ready !== 'boolean') addReason(blockedReasons, 'Missing required input: auth_persistence_readiness.persistence_ready.');
  if (typeof readiness.approval_record_allowed !== 'boolean') addReason(blockedReasons, 'Missing required input: auth_persistence_readiness.approval_record_allowed.');
  if (typeof readiness.builder_task_create_allowed !== 'boolean') addReason(blockedReasons, 'Missing required input: auth_persistence_readiness.builder_task_create_allowed.');
  if (typeof readiness.builder_execute_allowed !== 'boolean') addReason(blockedReasons, 'Missing required input: auth_persistence_readiness.builder_execute_allowed.');
  if (!input.task_create_intent) addReason(blockedReasons, 'Missing required input: task_create_intent.');
  if (!input.builder_adapter_mode) addReason(blockedReasons, 'Missing required input: builder_adapter_mode.');
  if (!input.task_create_effect_requested) addReason(blockedReasons, 'Missing required input: task_create_effect_requested.');
  if (!input.execute_effect_requested) addReason(blockedReasons, 'Missing required input: execute_effect_requested.');

  if (readiness.status && readiness.status !== 'readiness_boundary_prepared') {
    addReason(blockedReasons, `Auth/Persistence Readiness status ${readiness.status} cannot prepare Builder Task Create Readiness.`);
  }
  if (readiness.identity_ready === true) addReason(blockedReasons, 'Identity must remain not ready before Builder Task Create Readiness.');
  if (readiness.persistence_ready === true) addReason(blockedReasons, 'Persistence must remain not ready before Builder Task Create Readiness.');
  if (readiness.approval_record_allowed === true) addReason(blockedReasons, 'Approval record must remain blocked before Builder Task Create Readiness.');
  if (readiness.builder_task_create_allowed === true) addReason(blockedReasons, 'Builder task create must remain blocked.');
  if (readiness.builder_execute_allowed === true) addReason(blockedReasons, 'Builder execute must remain blocked.');
  if (input.builder_adapter_mode && input.builder_adapter_mode !== 'none') addReason(blockedReasons, 'Builder adapter mode must remain none in Builder Task Create Readiness MVP.');
  if (input.task_create_effect_requested && input.task_create_effect_requested !== 'none') addReason(blockedReasons, 'Task create effect requested must remain none in Builder Task Create Readiness MVP.');
  if (input.execute_effect_requested && input.execute_effect_requested !== 'none') addReason(blockedReasons, 'Execute effect requested must remain none in Builder Task Create Readiness MVP.');
  if (BLOCKED_INTENTS.has(input.task_create_intent) || (input.task_create_intent && !ALLOWED_INTENTS.has(input.task_create_intent))) {
    addReason(blockedReasons, `Task create intent ${input.task_create_intent} is not allowed for Builder Task Create Readiness MVP.`);
  }

  if (asArray(readiness.readiness_notes).length > 0) addReason(readinessNotes, 'Auth/Persistence Readiness notes need human review.');
  if (!readiness.target_repo) addReason(readinessNotes, 'Target repo is missing or not explicit.');

  const status = blockedReasons.length > 0
    ? 'blocked'
    : readinessNotes.length > 0
      ? 'requires_human_review'
      : 'task_create_readiness_prepared';

  if (status === 'task_create_readiness_prepared') {
    readinessNotes.push('Task Create readiness is local only. Live Builder, auth, persistence, approval record, and execute remain blocked.');
  }

  return {
    builder_task_create_readiness_id: input.builder_task_create_readiness_id || null,
    status,
    target_repo: readiness.target_repo || null,
    builder_adapter_mode: input.builder_adapter_mode || null,
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
