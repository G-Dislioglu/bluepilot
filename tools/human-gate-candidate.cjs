#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ALLOWED_REVIEW_INTENTS = new Set(['prepare_human_review_candidate']);
const BLOCKED_REVIEW_INTENTS = new Set([
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
  console.error('Usage: node tools/human-gate-candidate.cjs --input <path> [--pretty]');
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

function hasReviewNote(notes) {
  return asArray(notes)
    .map(normalizeText)
    .some((note) => note.includes('review') || note.includes('risk') || note.includes('coverage map'));
}

function buildOutput(input) {
  const candidate = input.builder_task_candidate && typeof input.builder_task_candidate === 'object'
    ? input.builder_task_candidate
    : {};
  const readScope = asArray(candidate.read_scope).map(String).filter(Boolean);
  const writeScopeCandidate = asArray(candidate.write_scope_candidate).map(String).filter(Boolean);
  const requiredEvidence = unique(asArray(candidate.required_evidence).map(String).filter(Boolean));
  const blockedReasons = [];
  const reviewReasons = [];

  if (!input.human_gate_candidate_id) addReason(blockedReasons, 'Missing required input: human_gate_candidate_id.');
  if (!candidate.task_contract_candidate_id) addReason(blockedReasons, 'Missing required input: builder_task_candidate.task_contract_candidate_id.');
  if (!candidate.status) addReason(blockedReasons, 'Missing required input: builder_task_candidate.status.');
  if (!candidate.target_repo) addReason(blockedReasons, 'Missing required input: builder_task_candidate.target_repo.');
  if (!Array.isArray(candidate.read_scope)) addReason(blockedReasons, 'Missing required input: builder_task_candidate.read_scope.');
  if (!Array.isArray(candidate.write_scope_candidate)) addReason(blockedReasons, 'Missing required input: builder_task_candidate.write_scope_candidate.');
  if (!Array.isArray(candidate.required_evidence)) addReason(blockedReasons, 'Missing required input: builder_task_candidate.required_evidence.');
  if (typeof candidate.human_gate_required !== 'boolean') addReason(blockedReasons, 'Missing required input: builder_task_candidate.human_gate_required.');
  if (!candidate.human_gate_status) addReason(blockedReasons, 'Missing required input: builder_task_candidate.human_gate_status.');
  if (typeof candidate.builder_task_create_allowed !== 'boolean') addReason(blockedReasons, 'Missing required input: builder_task_candidate.builder_task_create_allowed.');
  if (typeof candidate.builder_execute_allowed !== 'boolean') addReason(blockedReasons, 'Missing required input: builder_task_candidate.builder_execute_allowed.');
  if (!input.review_intent) addReason(blockedReasons, 'Missing required input: review_intent.');
  if (!input.review_surface) addReason(blockedReasons, 'Missing required input: review_surface.');
  if (!input.approval_effect) addReason(blockedReasons, 'Missing required input: approval_effect.');

  if (candidate.status && candidate.status !== 'candidate_prepared') {
    addReason(blockedReasons, `Builder Task Candidate status ${candidate.status} cannot prepare a Human Gate review candidate.`);
  }
  if (candidate.human_gate_required !== true) addReason(blockedReasons, 'Builder Task Candidate must require a human gate.');
  if (candidate.builder_task_create_allowed === true) addReason(blockedReasons, 'Builder Task Candidate task create must remain blocked.');
  if (candidate.builder_execute_allowed === true) addReason(blockedReasons, 'Builder Task Candidate execute must remain blocked.');
  if (input.approval_effect && input.approval_effect !== 'none') addReason(blockedReasons, 'Approval effect must remain none in the Human Gate Candidate MVP.');
  if (BLOCKED_REVIEW_INTENTS.has(input.review_intent) || (input.review_intent && !ALLOWED_REVIEW_INTENTS.has(input.review_intent))) {
    addReason(blockedReasons, `Review intent ${input.review_intent} is not allowed for Human Gate Candidate MVP.`);
  }
  if (readScope.length === 0) addReason(blockedReasons, 'Builder Task Candidate output must contain at least one read path.');
  if (requiredEvidence.length === 0) addReason(blockedReasons, 'Builder Task Candidate output must contain required evidence.');
  if (asArray(candidate.blocked_reasons).length > 0) addReason(blockedReasons, 'Builder Task Candidate output contains blocked reasons.');

  if (writeScopeCandidate.length === 0) addReason(reviewReasons, 'Write scope candidate is empty and needs human review.');
  if (requiredEvidence.includes('risk_summary')) addReason(reviewReasons, 'Required evidence includes risk_summary and needs human review.');
  if (hasReviewNote(candidate.notes)) addReason(reviewReasons, 'Builder Task Candidate notes contain review or risk signals.');

  const status = blockedReasons.length > 0
    ? 'blocked'
    : reviewReasons.length > 0
      ? 'requires_human_review'
      : 'review_candidate_prepared';

  return {
    human_gate_candidate_id: input.human_gate_candidate_id || null,
    status,
    target_repo: candidate.target_repo || null,
    read_scope: status === 'blocked' ? [] : readScope,
    write_scope_candidate: status === 'review_candidate_prepared' ? writeScopeCandidate : [],
    required_evidence: requiredEvidence,
    review_surface: input.review_surface || null,
    approval_effect: 'none',
    human_approval_recorded: false,
    builder_task_create_allowed: false,
    builder_execute_allowed: false,
    blocked_reasons: blockedReasons,
    review_questions: status === 'blocked' ? [] : [
      'Is the scope correct?',
      'Is the evidence sufficient?',
      'Should a later task-create step be allowed?',
    ],
    review_notes: reviewReasons,
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
