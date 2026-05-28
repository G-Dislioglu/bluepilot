#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ALLOWED_INTENTS = new Set(['prepare_auth_persistence_readiness']);
const BLOCKED_INTENTS = new Set([
  'configure_auth',
  'configure_persistence',
  'record_approval',
  'approve_task',
  'create_task',
  'execute_task',
  'push_task',
  'deploy_task',
  'live_builder_call',
]);

function usage(message) {
  if (message) console.error(message);
  console.error('Usage: node tools/auth-persistence-readiness-candidate.cjs --input <path> [--pretty]');
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
  const readiness = input.approval_readiness && typeof input.approval_readiness === 'object'
    ? input.approval_readiness
    : {};
  const requiredEvidence = asArray(readiness.required_evidence).map(String).filter(Boolean);
  const blockedReasons = [];
  const readinessNotes = [];

  if (!input.auth_persistence_readiness_id) addReason(blockedReasons, 'Missing required input: auth_persistence_readiness_id.');
  if (!readiness.approval_readiness_id) addReason(blockedReasons, 'Missing required input: approval_readiness.approval_readiness_id.');
  if (!readiness.status) addReason(blockedReasons, 'Missing required input: approval_readiness.status.');
  if (!readiness.target_repo) addReason(blockedReasons, 'Missing required input: approval_readiness.target_repo.');
  if (!Array.isArray(readiness.read_scope)) addReason(blockedReasons, 'Missing required input: approval_readiness.read_scope.');
  if (!Array.isArray(readiness.write_scope_candidate)) addReason(blockedReasons, 'Missing required input: approval_readiness.write_scope_candidate.');
  if (!Array.isArray(readiness.required_evidence)) addReason(blockedReasons, 'Missing required input: approval_readiness.required_evidence.');
  if (!readiness.identity_boundary) addReason(blockedReasons, 'Missing required input: approval_readiness.identity_boundary.');
  if (!readiness.persistence_boundary) addReason(blockedReasons, 'Missing required input: approval_readiness.persistence_boundary.');
  if (!readiness.approval_effect) addReason(blockedReasons, 'Missing required input: approval_readiness.approval_effect.');
  if (typeof readiness.human_approval_recorded !== 'boolean') addReason(blockedReasons, 'Missing required input: approval_readiness.human_approval_recorded.');
  if (typeof readiness.approval_record_allowed !== 'boolean') addReason(blockedReasons, 'Missing required input: approval_readiness.approval_record_allowed.');
  if (typeof readiness.builder_task_create_allowed !== 'boolean') addReason(blockedReasons, 'Missing required input: approval_readiness.builder_task_create_allowed.');
  if (typeof readiness.builder_execute_allowed !== 'boolean') addReason(blockedReasons, 'Missing required input: approval_readiness.builder_execute_allowed.');
  if (!input.readiness_intent) addReason(blockedReasons, 'Missing required input: readiness_intent.');
  if (!input.identity_provider) addReason(blockedReasons, 'Missing required input: identity_provider.');
  if (!input.persistence_target) addReason(blockedReasons, 'Missing required input: persistence_target.');
  if (!input.approval_record_effect_requested) addReason(blockedReasons, 'Missing required input: approval_record_effect_requested.');

  if (readiness.status && readiness.status !== 'readiness_candidate_prepared') {
    addReason(blockedReasons, `Approval Readiness status ${readiness.status} cannot prepare Auth/Persistence Readiness.`);
  }
  if (readiness.approval_effect && readiness.approval_effect !== 'none') addReason(blockedReasons, 'Approval Readiness approval_effect must remain none.');
  if (readiness.human_approval_recorded === true) addReason(blockedReasons, 'Human approval must not be recorded before auth/persistence readiness.');
  if (readiness.approval_record_allowed === true) addReason(blockedReasons, 'Approval record must remain blocked.');
  if (readiness.builder_task_create_allowed === true) addReason(blockedReasons, 'Builder task create must remain blocked.');
  if (readiness.builder_execute_allowed === true) addReason(blockedReasons, 'Builder execute must remain blocked.');
  if (input.identity_provider && input.identity_provider !== 'none') addReason(blockedReasons, 'Identity provider must remain none in Auth/Persistence Readiness MVP.');
  if (input.persistence_target && input.persistence_target !== 'none') addReason(blockedReasons, 'Persistence target must remain none in Auth/Persistence Readiness MVP.');
  if (input.approval_record_effect_requested && input.approval_record_effect_requested !== 'none') {
    addReason(blockedReasons, 'Approval record effect requested must remain none in Auth/Persistence Readiness MVP.');
  }
  if (BLOCKED_INTENTS.has(input.readiness_intent) || (input.readiness_intent && !ALLOWED_INTENTS.has(input.readiness_intent))) {
    addReason(blockedReasons, `Readiness intent ${input.readiness_intent} is not allowed for Auth/Persistence Readiness MVP.`);
  }

  if (requiredEvidence.includes('risk_summary')) addReason(readinessNotes, 'Required evidence includes risk_summary and needs human review.');
  if (asArray(readiness.readiness_notes).length > 0) addReason(readinessNotes, 'Approval Readiness notes need human review.');
  if (readiness.identity_boundary !== 'not_configured') addReason(readinessNotes, 'Identity boundary is not not_configured.');
  if (readiness.persistence_boundary !== 'not_configured') addReason(readinessNotes, 'Persistence boundary is not not_configured.');

  const status = blockedReasons.length > 0
    ? 'blocked'
    : readinessNotes.length > 0
      ? 'requires_human_review'
      : 'readiness_boundary_prepared';

  if (status === 'readiness_boundary_prepared') {
    readinessNotes.push('Auth and persistence are readiness boundaries only. No identity provider, DB, approval record, or Builder action is configured.');
  }

  return {
    auth_persistence_readiness_id: input.auth_persistence_readiness_id || null,
    status,
    target_repo: readiness.target_repo || null,
    identity_provider: input.identity_provider || null,
    persistence_target: input.persistence_target || null,
    approval_record_effect: 'none',
    identity_ready: false,
    persistence_ready: false,
    approval_record_allowed: false,
    builder_task_create_allowed: false,
    builder_execute_allowed: false,
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
