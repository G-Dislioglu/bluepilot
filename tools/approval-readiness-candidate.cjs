#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ALLOWED_READINESS_INTENTS = new Set(['prepare_approval_readiness']);
const BLOCKED_READINESS_INTENTS = new Set([
  'record_approval',
  'approve_task',
  'reject_task',
  'create_task',
  'execute_task',
  'push_task',
  'deploy_task',
  'live_builder_call',
]);

function usage(message) {
  if (message) console.error(message);
  console.error('Usage: node tools/approval-readiness-candidate.cjs --input <path> [--pretty]');
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

function unique(values) {
  return [...new Set(values)];
}

function buildOutput(input) {
  const candidate = input.human_gate_candidate && typeof input.human_gate_candidate === 'object'
    ? input.human_gate_candidate
    : {};
  const readScope = asArray(candidate.read_scope).map(String).filter(Boolean);
  const writeScopeCandidate = asArray(candidate.write_scope_candidate).map(String).filter(Boolean);
  const requiredEvidence = unique(asArray(candidate.required_evidence).map(String).filter(Boolean));
  const reviewQuestions = asArray(candidate.review_questions).map(String).filter(Boolean);
  const blockedReasons = [];
  const readinessNotes = [];

  if (!input.approval_readiness_id) addReason(blockedReasons, 'Missing required input: approval_readiness_id.');
  if (!candidate.human_gate_candidate_id) addReason(blockedReasons, 'Missing required input: human_gate_candidate.human_gate_candidate_id.');
  if (!candidate.status) addReason(blockedReasons, 'Missing required input: human_gate_candidate.status.');
  if (!candidate.target_repo) addReason(blockedReasons, 'Missing required input: human_gate_candidate.target_repo.');
  if (!Array.isArray(candidate.read_scope)) addReason(blockedReasons, 'Missing required input: human_gate_candidate.read_scope.');
  if (!Array.isArray(candidate.write_scope_candidate)) addReason(blockedReasons, 'Missing required input: human_gate_candidate.write_scope_candidate.');
  if (!Array.isArray(candidate.required_evidence)) addReason(blockedReasons, 'Missing required input: human_gate_candidate.required_evidence.');
  if (!candidate.review_surface) addReason(blockedReasons, 'Missing required input: human_gate_candidate.review_surface.');
  if (!candidate.approval_effect) addReason(blockedReasons, 'Missing required input: human_gate_candidate.approval_effect.');
  if (typeof candidate.human_approval_recorded !== 'boolean') addReason(blockedReasons, 'Missing required input: human_gate_candidate.human_approval_recorded.');
  if (typeof candidate.builder_task_create_allowed !== 'boolean') addReason(blockedReasons, 'Missing required input: human_gate_candidate.builder_task_create_allowed.');
  if (typeof candidate.builder_execute_allowed !== 'boolean') addReason(blockedReasons, 'Missing required input: human_gate_candidate.builder_execute_allowed.');
  if (!Array.isArray(candidate.review_questions)) addReason(blockedReasons, 'Missing required input: human_gate_candidate.review_questions.');
  if (!input.readiness_intent) addReason(blockedReasons, 'Missing required input: readiness_intent.');
  if (!input.identity_boundary) addReason(blockedReasons, 'Missing required input: identity_boundary.');
  if (!input.persistence_boundary) addReason(blockedReasons, 'Missing required input: persistence_boundary.');
  if (!input.approval_effect_requested) addReason(blockedReasons, 'Missing required input: approval_effect_requested.');

  if (candidate.status && candidate.status !== 'review_candidate_prepared') {
    addReason(blockedReasons, `Human Gate Candidate status ${candidate.status} cannot prepare Approval Readiness.`);
  }
  if (candidate.approval_effect && candidate.approval_effect !== 'none') {
    addReason(blockedReasons, 'Human Gate Candidate approval_effect must remain none.');
  }
  if (candidate.human_approval_recorded === true) addReason(blockedReasons, 'Human approval must not be recorded in Approval Readiness MVP.');
  if (candidate.builder_task_create_allowed === true) addReason(blockedReasons, 'Builder task create must remain blocked.');
  if (candidate.builder_execute_allowed === true) addReason(blockedReasons, 'Builder execute must remain blocked.');
  if (input.approval_effect_requested && input.approval_effect_requested !== 'none') {
    addReason(blockedReasons, 'Approval effect requested must remain none in Approval Readiness MVP.');
  }
  if (BLOCKED_READINESS_INTENTS.has(input.readiness_intent) || (input.readiness_intent && !ALLOWED_READINESS_INTENTS.has(input.readiness_intent))) {
    addReason(blockedReasons, `Readiness intent ${input.readiness_intent} is not allowed for Approval Readiness MVP.`);
  }
  if (readScope.length === 0) addReason(blockedReasons, 'Human Gate Candidate output must contain at least one read path.');
  if (requiredEvidence.length === 0) addReason(blockedReasons, 'Human Gate Candidate output must contain required evidence.');
  if (reviewQuestions.length === 0) addReason(blockedReasons, 'Human Gate Candidate output must contain review questions.');
  if (asArray(candidate.blocked_reasons).length > 0) addReason(blockedReasons, 'Human Gate Candidate output contains blocked reasons.');

  if (writeScopeCandidate.length === 0) addReason(readinessNotes, 'Write scope candidate is empty and needs human review.');
  if (requiredEvidence.includes('risk_summary')) addReason(readinessNotes, 'Required evidence includes risk_summary and needs human review.');
  if (asArray(candidate.review_notes).length > 0) addReason(readinessNotes, 'Human Gate Candidate review notes need human review.');
  if (input.identity_boundary !== 'not_configured') addReason(readinessNotes, 'Identity boundary is not the MVP-safe not_configured value.');
  if (input.persistence_boundary !== 'not_configured') addReason(readinessNotes, 'Persistence boundary is not the MVP-safe not_configured value.');

  const status = blockedReasons.length > 0
    ? 'blocked'
    : readinessNotes.length > 0
      ? 'requires_human_review'
      : 'readiness_candidate_prepared';

  if (status === 'readiness_candidate_prepared') {
    readinessNotes.push('Approval readiness is local only. Effective approval requires later auth, identity, persistence, and audit decisions.');
  }

  return {
    approval_readiness_id: input.approval_readiness_id || null,
    status,
    target_repo: candidate.target_repo || null,
    read_scope: status === 'blocked' ? [] : readScope,
    write_scope_candidate: status === 'readiness_candidate_prepared' ? writeScopeCandidate : [],
    required_evidence: requiredEvidence,
    identity_boundary: input.identity_boundary || null,
    persistence_boundary: input.persistence_boundary || null,
    approval_effect: 'none',
    human_approval_recorded: false,
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
