#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ALLOWED_READS = [
  {
    method: 'GET',
    pattern: /^\/api\/builder\/tasks\/([^/]+)\/evidence$/,
    refKey: 'task_evidence_ref',
    refFor: (taskId) => `mock-builder://tasks/${taskId}/evidence`,
  },
  {
    method: 'GET',
    pattern: /^\/api\/builder\/tasks\/([^/]+)\/artifacts$/,
    refKey: 'task_artifacts_ref',
    refFor: (taskId) => `mock-builder://tasks/${taskId}/artifacts`,
  },
  {
    method: 'GET',
    pattern: /^\/api\/builder\/tasks\/([^/]+)\/audit$/,
    refKey: 'task_audit_ref',
    refFor: (taskId) => `mock-builder://tasks/${taskId}/audit`,
  },
  {
    method: 'GET',
    pattern: /^\/api\/builder\/opus-bridge\/audit$/,
    refKey: 'bridge_audit_ref',
    refFor: () => 'mock-builder://opus-bridge/audit',
  },
  {
    method: 'GET',
    pattern: /^\/api\/builder\/opus-bridge\/metrics$/,
    refKey: 'bridge_metrics_ref',
    refFor: () => 'mock-builder://opus-bridge/metrics',
  },
];

function usage() {
  return [
    'Usage:',
    '  node tools/builder-live-read-probe.cjs --input <file> [--pretty]',
    '',
    'BP-022 supports mock mode only. It performs no network, auth, persistence, or Builder writes.',
  ].join('\n');
}

function parseArgs(argv) {
  const args = { input: null, pretty: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--input') {
      args.input = argv[index + 1] || null;
      index += 1;
      continue;
    }

    if (arg === '--pretty') {
      args.pretty = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!args.input) {
    throw new Error('Missing required --input <file>');
  }

  return args;
}

function readJson(filePath) {
  const resolved = path.resolve(filePath);
  return JSON.parse(fs.readFileSync(resolved, 'utf8'));
}

function normalizeRead(read, index) {
  if (!read || typeof read !== 'object' || Array.isArray(read)) {
    return { error: `reads[${index}] must be an object` };
  }

  const method = typeof read.method === 'string' ? read.method.toUpperCase() : '';
  const readPath = typeof read.path === 'string' ? read.path : '';

  if (!method) {
    return { error: `reads[${index}].method is required` };
  }

  if (!readPath.startsWith('/')) {
    return { error: `reads[${index}].path must start with /` };
  }

  return { method, path: readPath };
}

function matchAllowedRead(read) {
  if (read.method !== 'GET') {
    return {
      allowed: false,
      reason: `Method ${read.method} is blocked; BP-021 allows GET only`,
    };
  }

  for (const allowed of ALLOWED_READS) {
    const match = read.path.match(allowed.pattern);

    if (match) {
      const taskId = match[1] || null;
      return {
        allowed: true,
        refKey: allowed.refKey,
        refValue: allowed.refFor(taskId),
      };
    }
  }

  return {
    allowed: false,
    reason: `Path ${read.path} is not in the BP-021 read allowlist`,
  };
}

function baseEnvelope(input, status, blockedReasons) {
  return {
    probe_id: input.probe_id || 'BP-LIVE-READ-MOCK',
    status,
    source: 'mock-builder-read-only',
    builder_refs: {},
    writes_attempted: false,
    decision_ready: false,
    requires_human_gate: true,
    mock: true,
    blocked_reasons: blockedReasons,
  };
}

function runProbe(input) {
  const blockedReasons = [];

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return baseEnvelope({ probe_id: 'BP-LIVE-READ-MOCK' }, 'blocked', ['Input must be a JSON object']);
  }

  if (input.mode !== 'mock') {
    blockedReasons.push('BP-022 supports mode=mock only');
  }

  if (!Array.isArray(input.reads) || input.reads.length === 0) {
    blockedReasons.push('reads must contain at least one read candidate');
  }

  const output = baseEnvelope(input, blockedReasons.length > 0 ? 'blocked' : 'completed', blockedReasons);

  if (blockedReasons.length > 0) {
    return output;
  }

  for (let index = 0; index < input.reads.length; index += 1) {
    const normalized = normalizeRead(input.reads[index], index);

    if (normalized.error) {
      output.status = 'blocked';
      output.blocked_reasons.push(normalized.error);
      continue;
    }

    const allow = matchAllowedRead(normalized);

    if (!allow.allowed) {
      output.status = 'blocked';
      output.blocked_reasons.push(allow.reason);
      continue;
    }

    output.builder_refs[allow.refKey] = allow.refValue;
  }

  if (output.blocked_reasons.length > 0) {
    output.builder_refs = {};
  }

  return output;
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const input = readJson(args.input);
    const output = runProbe(input);
    process.stdout.write(JSON.stringify(output, null, args.pretty ? 2 : 0));
    process.stdout.write('\n');
  } catch (error) {
    process.stderr.write(`${error.message}\n\n${usage()}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  ALLOWED_READS,
  runProbe,
};
