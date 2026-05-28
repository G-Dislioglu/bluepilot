#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ALLOWED_INTENTS = new Set(['read_only_candidate', 'read_write_candidate']);
const BLOCKED_INTENTS = new Set(['execute', 'approve', 'push', 'deploy', 'live_builder_call']);
const DATA_AUTH_SECRET_RISK = ['data', 'auth', 'secret', 'database', 'credential'];
const ADAPTER_ONLY_TERMS = ['maya context', 'maya director', 'maya chat', 'desktop bridge', 'swarm'];

function usage(message) {
  if (message) console.error(message);
  console.error('Usage: node tools/scope-resolver.cjs --input <path> [--pretty]');
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

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function scopeEntries(input) {
  return asArray(input.requested_scope).map(String).filter(Boolean);
}

function trackEntries(input) {
  const scanner = input.phase_scanner && typeof input.phase_scanner === 'object'
    ? input.phase_scanner
    : {};
  return asArray(scanner.allowed_tracks).filter((track) => track && typeof track === 'object');
}

function unique(values) {
  return [...new Set(values)];
}

function isExternalPath(entry) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(entry);
}

function isUnsafePath(entry) {
  const normalized = entry.replace(/\\/g, '/');
  return path.isAbsolute(entry)
    || normalized.includes('../')
    || normalized === '..'
    || normalized.startsWith('../')
    || normalized.endsWith('/..')
    || normalized.includes('/.env')
    || normalized === '.env'
    || /\.env(\.|$)/.test(normalized)
    || /secret/i.test(normalized)
    || isExternalPath(entry);
}

function hasWildcard(scope) {
  return scope.some((entry) => entry.includes('*'));
}

function isBroadScope(scope) {
  return scope.length > 8 || scope.some((entry) => ['.', './', '*', '**', 'src/**', 'app/**', 'docs/**'].includes(entry));
}

function hasOverlappingTracks(tracks) {
  const seen = new Set();
  for (const track of tracks) {
    for (const entry of asArray(track.scope).map(String).filter(Boolean)) {
      if (seen.has(entry)) return true;
      seen.add(entry);
    }
  }
  return false;
}

function hasTextHit(values, needles) {
  const haystack = asArray(values).map(normalizeText).join('\n');
  return needles.some((needle) => haystack.includes(needle));
}

function addReason(reasons, reason) {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function buildOutput(input) {
  const scanner = input.phase_scanner && typeof input.phase_scanner === 'object'
    ? input.phase_scanner
    : {};
  const requestedScope = scopeEntries(input);
  const tracks = trackEntries(input);
  const requiredEvidence = unique(asArray(scanner.required_evidence).map(String).filter(Boolean));
  const blockedReasons = [];
  const reviewReasons = [];
  const scopeNotes = [];

  if (!input.handoff_id) addReason(blockedReasons, 'Missing required input: handoff_id.');
  if (!scanner.decision) addReason(blockedReasons, 'Missing required input: phase_scanner.decision.');
  if (!scanner.stoplight) addReason(blockedReasons, 'Missing required input: phase_scanner.stoplight.');
  if (!Array.isArray(scanner.allowed_tracks)) addReason(blockedReasons, 'Missing required input: phase_scanner.allowed_tracks.');
  if (typeof scanner.human_gate_required !== 'boolean') addReason(blockedReasons, 'Missing required input: phase_scanner.human_gate_required.');
  if (!input.target_repo) addReason(blockedReasons, 'Missing required input: target_repo.');
  if (!input.operation_intent) addReason(blockedReasons, 'Missing required input: operation_intent.');
  if (requestedScope.length === 0) addReason(blockedReasons, 'Missing required input: requested_scope.');

  if (scanner.decision && scanner.decision !== 'allow_single_track') {
    addReason(blockedReasons, `Phase Scanner decision ${scanner.decision} cannot enter Scope Resolver task preparation.`);
  }
  if (scanner.human_gate_required !== true) {
    addReason(blockedReasons, 'Human gate must be explicitly required before scope resolution.');
  }
  if (BLOCKED_INTENTS.has(input.operation_intent) || (input.operation_intent && !ALLOWED_INTENTS.has(input.operation_intent))) {
    addReason(blockedReasons, `Operation intent ${input.operation_intent} is not allowed for Scope Resolver MVP.`);
  }

  const unsafePaths = requestedScope.filter(isUnsafePath);
  if (unsafePaths.length > 0) {
    addReason(blockedReasons, `Unsafe requested scope: ${unsafePaths.join(', ')}.`);
  }
  if (tracks.length > 1 && hasOverlappingTracks(tracks)) {
    addReason(blockedReasons, 'Multiple tracks have overlapping scope.');
  }

  if (hasWildcard(requestedScope)) addReason(reviewReasons, 'Wildcard scope needs human review.');
  if (isBroadScope(requestedScope)) addReason(reviewReasons, 'Broad scope needs human review.');
  if (scanner.stoplight && scanner.stoplight !== 'green') addReason(reviewReasons, 'Phase Scanner stoplight is not green.');
  if (scanner.council_required === true) addReason(reviewReasons, 'Council trigger degrades to human review.');
  if (hasTextHit(input.known_risks, DATA_AUTH_SECRET_RISK)) {
    addReason(reviewReasons, 'Known risks include data, auth, secret, database, or credential concerns.');
  }
  if (hasTextHit(input.known_risks, ADAPTER_ONLY_TERMS) || hasTextHit(input.no_go_zones, ADAPTER_ONLY_TERMS)) {
    addReason(reviewReasons, 'Adapter-only dependency needs human review.');
  }

  if (blockedReasons.length === 0 && reviewReasons.length === 0) {
    scopeNotes.push('Requested scope is repo-relative and single-track.');
  }
  for (const reason of reviewReasons) scopeNotes.push(reason);

  const status = blockedReasons.length > 0
    ? 'blocked'
    : reviewReasons.length > 0
      ? 'requires_human_review'
      : 'resolved';

  const readableScope = status === 'blocked' ? [] : requestedScope;
  const writeableScope = status === 'resolved' && input.operation_intent === 'read_write_candidate'
    ? requestedScope
    : [];

  return {
    handoff_id: input.handoff_id || null,
    status,
    target_repo: input.target_repo || null,
    allowed_read_paths: readableScope,
    allowed_write_paths: writeableScope,
    blocked_paths: status === 'blocked' ? requestedScope : [],
    scope_notes: scopeNotes,
    requires_human_gate: true,
    writes_allowed_now: false,
    task_create_allowed: false,
    required_evidence: requiredEvidence,
    blocked_reasons: blockedReasons,
  };
}

const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');
const pretty = args.includes('--pretty');

if (require.main === module) {
  if (inputIndex === -1 || !args[inputIndex + 1] || args[inputIndex + 1].startsWith('--')) {
    usage();
  }

  const input = readInput(args[inputIndex + 1]);
  const output = buildOutput(input);
  process.stdout.write(JSON.stringify(output, null, pretty ? 2 : 0));
  process.stdout.write('\n');
}

module.exports = { buildOutput };
