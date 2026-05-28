#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ALLOWED_TASK_INTENTS = new Set(['prepare_contract_candidate']);
const BLOCKED_TASK_INTENTS = new Set([
  'create_task',
  'execute_task',
  'approve_task',
  'push_task',
  'deploy_task',
  'live_builder_call',
]);
const BLOCKED_OPERATION_TERMS = ['execute', 'approve', 'push', 'deploy', 'live_builder_call'];

function usage(message) {
  if (message) console.error(message);
  console.error('Usage: node tools/builder-task-candidate.cjs --input <path> [--pretty]');
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

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function unique(values) {
  return [...new Set(values)];
}

function operationNeedsWrites(value) {
  const text = normalizeText(value);
  return ['change', 'write', 'edit', 'modify', 'patch'].some((term) => text.includes(term));
}

function hasBlockedOperation(value) {
  const text = normalizeText(value);
  return BLOCKED_OPERATION_TERMS.some((term) => text.includes(term));
}

function hasReviewNote(notes) {
  return asArray(notes)
    .map(normalizeText)
    .some((note) => note.includes('review') || note.includes('risk') || note.includes('coverage map'));
}

function buildOutput(input) {
  const resolver = input.scope_resolver && typeof input.scope_resolver === 'object'
    ? input.scope_resolver
    : {};
  const humanGate = input.human_gate && typeof input.human_gate === 'object'
    ? input.human_gate
    : {};
  const readScope = asArray(resolver.allowed_read_paths).map(String).filter(Boolean);
  const writeScopeCandidate = asArray(resolver.allowed_write_paths).map(String).filter(Boolean);
  const requiredEvidence = unique(asArray(resolver.required_evidence).map(String).filter(Boolean));
  const blockedReasons = [];
  const reviewNotes = [];

  if (!input.task_contract_candidate_id) addReason(blockedReasons, 'Missing required input: task_contract_candidate_id.');
  if (!resolver.status) addReason(blockedReasons, 'Missing required input: scope_resolver.status.');
  if (!resolver.target_repo) addReason(blockedReasons, 'Missing required input: scope_resolver.target_repo.');
  if (!Array.isArray(resolver.allowed_read_paths)) addReason(blockedReasons, 'Missing required input: scope_resolver.allowed_read_paths.');
  if (!Array.isArray(resolver.allowed_write_paths)) addReason(blockedReasons, 'Missing required input: scope_resolver.allowed_write_paths.');
  if (typeof resolver.requires_human_gate !== 'boolean') addReason(blockedReasons, 'Missing required input: scope_resolver.requires_human_gate.');
  if (typeof resolver.writes_allowed_now !== 'boolean') addReason(blockedReasons, 'Missing required input: scope_resolver.writes_allowed_now.');
  if (typeof resolver.task_create_allowed !== 'boolean') addReason(blockedReasons, 'Missing required input: scope_resolver.task_create_allowed.');
  if (!Array.isArray(resolver.required_evidence)) addReason(blockedReasons, 'Missing required input: scope_resolver.required_evidence.');
  if (!input.task_intent) addReason(blockedReasons, 'Missing required input: task_intent.');
  if (!input.requested_operation) addReason(blockedReasons, 'Missing required input: requested_operation.');
  if (typeof humanGate.required !== 'boolean') addReason(blockedReasons, 'Missing required input: human_gate.required.');
  if (!humanGate.status) addReason(blockedReasons, 'Missing required input: human_gate.status.');

  if (resolver.status && resolver.status !== 'resolved') {
    addReason(blockedReasons, `Scope Resolver status ${resolver.status} cannot prepare a Builder Task Contract candidate.`);
  }
  if (resolver.writes_allowed_now === true) addReason(blockedReasons, 'Scope Resolver writes_allowed_now must remain false.');
  if (resolver.task_create_allowed === true) addReason(blockedReasons, 'Scope Resolver task_create_allowed must remain false.');
  if (resolver.requires_human_gate !== true) addReason(blockedReasons, 'Scope Resolver must require a human gate.');
  if (humanGate.required !== true) addReason(blockedReasons, 'Human gate must be required for Builder Task Contract candidates.');
  if (BLOCKED_TASK_INTENTS.has(input.task_intent) || (input.task_intent && !ALLOWED_TASK_INTENTS.has(input.task_intent))) {
    addReason(blockedReasons, `Task intent ${input.task_intent} is not allowed for Builder Task Contract Candidate MVP.`);
  }
  if (hasBlockedOperation(input.requested_operation)) {
    addReason(blockedReasons, `Requested operation ${input.requested_operation} is not allowed for Builder Task Contract Candidate MVP.`);
  }
  if (asArray(resolver.blocked_paths).length > 0) addReason(blockedReasons, 'Scope Resolver output contains blocked paths.');
  if (readScope.length === 0) addReason(blockedReasons, 'Scope Resolver output must contain at least one read path.');
  if (requiredEvidence.length === 0) addReason(blockedReasons, 'Scope Resolver output must contain required evidence.');

  if (operationNeedsWrites(input.requested_operation) && writeScopeCandidate.length === 0) {
    addReason(reviewNotes, 'Requested operation appears to need writes but no write scope candidate is available.');
  }
  if (requiredEvidence.includes('risk_summary')) {
    addReason(reviewNotes, 'Required evidence includes risk_summary and needs human review.');
  }
  if (hasReviewNote(resolver.scope_notes)) {
    addReason(reviewNotes, 'Scope Resolver notes contain review or risk signals.');
  }

  const status = blockedReasons.length > 0
    ? 'blocked'
    : reviewNotes.length > 0
      ? 'requires_human_review'
      : 'candidate_prepared';

  const notes = status === 'candidate_prepared'
    ? ['Candidate is local only. Builder Task Create remains blocked.']
    : reviewNotes;

  return {
    task_contract_candidate_id: input.task_contract_candidate_id || null,
    status,
    target_repo: resolver.target_repo || null,
    read_scope: status === 'blocked' ? [] : readScope,
    write_scope_candidate: status === 'candidate_prepared' ? writeScopeCandidate : [],
    required_evidence: requiredEvidence,
    human_gate_required: true,
    human_gate_status: humanGate.status || null,
    builder_task_create_allowed: false,
    builder_execute_allowed: false,
    blocked_reasons: blockedReasons,
    notes,
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
