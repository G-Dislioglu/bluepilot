#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const CHECK_VALUES = {
  pass: 1,
  review: 0.5,
  fail: 0,
  unknown: 0.25,
};

const MVP_DECISIONS = new Set(['allow_single_track', 'require_human_review', 'reject']);

const BUILT_IN_NO_GO = [
  { label: 'auto_merge', patterns: ['auto-merge', 'automerge', 'automatic merge'] },
  { label: 'auto_deploy', patterns: ['auto-deploy', 'autodeploy', 'automatic deploy'] },
  { label: 'render_port', patterns: ['render port', 'render integration', 'render service'] },
  { label: 'builder_chat_fusion', patterns: ['builder chat fusion'] },
  { label: 'free_council', patterns: ['free council', 'unbounded council', 'unlimited council'] },
  { label: 'aicos_mutation', patterns: ['aicos write', 'aicos mutation', 'mutate aicos'] },
  { label: 'maya_write', patterns: ['maya write', 'write to maya'] },
  { label: 'desktop_bridge_write', patterns: ['desktop bridge write'] },
  { label: 'unbounded_worker_tracks', patterns: ['unlimited worker', 'unbounded worker', 'unlimited tracks'] },
  { label: 'patrol_auto_repair', patterns: ['automatic patrol repair', 'patrol auto repair'] },
  { label: 'model_assumption_without_benchmark', patterns: ['model assumption without benchmark'] },
  { label: 'implemented_without_repo_evidence', patterns: ['implemented without repo evidence'] },
];

const RISK_KEYWORDS = {
  drift: ['drift', 'scope'],
  runtime: ['runtime', 'worker', 'cron'],
  deploy: ['deploy', 'production'],
  product_decision: ['product decision', 'primacy', 'architecture decision'],
  data: ['data', 'auth', 'secret', 'database', 'credential'],
  cost: ['cost', 'billing', 'external service'],
};

function usage(message) {
  if (message) console.error(message);
  console.error('Usage: node tools/phase-scanner.cjs --input <path> [--pretty]');
  process.exit(1);
}

const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');
const pretty = args.includes('--pretty');

if (inputIndex === -1 || !args[inputIndex + 1] || args[inputIndex + 1].startsWith('--')) {
  usage();
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

function inputText(input) {
  return [
    input.idea,
    input.target_repo,
    ...asArray(input.requested_scope),
    ...asArray(input.repo_context),
    ...asArray(input.known_risks),
    ...asArray(input.available_donors),
  ].map(normalizeText).join('\n');
}

function result(name, status, reason) {
  return { name, status, reason };
}

function hasAnyText(values, needles) {
  const haystack = asArray(values).map(normalizeText).join('\n');
  return needles.some((needle) => haystack.includes(needle));
}

function hasEvidenceSource(input) {
  const evidenceSources = asArray(input.evidence_sources);
  const donors = asArray(input.available_donors);
  return evidenceSources.length > 0 || hasAnyText(donors, ['evidence', 'audit', 'test', 'artifact']);
}

function scopeEntries(input) {
  return asArray(input.requested_scope).map(String).filter(Boolean);
}

function trackEntries(input) {
  return asArray(input.tracks).filter((track) => track && typeof track === 'object');
}

function checkRequiredInput(input) {
  const missing = [];
  if (typeof input.idea !== 'string' || input.idea.trim() === '') missing.push('idea');
  if (typeof input.target_repo !== 'string' || input.target_repo.trim() === '') missing.push('target_repo');
  if (scopeEntries(input).length === 0) missing.push('requested_scope');
  if (missing.length > 0) {
    return result('input_schema', 'fail', `Missing required input: ${missing.join(', ')}.`);
  }
  return result('input_schema', 'pass', 'Required input fields are present.');
}

function checkScopeClarity(input) {
  const scope = scopeEntries(input);
  if (!input.idea || !input.target_repo || scope.length === 0) {
    return result('scope_clarity', 'fail', 'Goal, target repo, or requested scope is missing.');
  }
  if (scope.length > 8 || normalizeText(input.idea).includes('everything')) {
    return result('scope_clarity', 'review', 'Scope looks broad and needs human narrowing.');
  }
  return result('scope_clarity', 'pass', 'Goal, target repo, and requested scope are bounded.');
}

function checkFileRisk(input) {
  const risky = scopeEntries(input).filter((entry) => {
    const normalized = entry.replace(/\\/g, '/');
    return path.isAbsolute(entry) || normalized.includes('../') || normalized.includes('/.env') || normalized === '.env';
  });
  if (risky.length > 0) {
    return result('file_risk', 'fail', `Unsafe requested scope: ${risky.join(', ')}.`);
  }
  if (scopeEntries(input).some((entry) => normalizeText(entry).includes('*'))) {
    return result('file_risk', 'review', 'Wildcard scope needs human confirmation before writes.');
  }
  return result('file_risk', 'pass', 'Requested scope is repo-relative and gateable.');
}

function checkNoGo(input) {
  const text = inputText(input);
  const externalNoGo = asArray(input.no_go_zones)
    .map((zone) => ({ label: String(zone), patterns: [normalizeText(zone)] }))
    .filter((zone) => zone.patterns[0]);
  const hits = [...BUILT_IN_NO_GO, ...externalNoGo]
    .filter((zone) => zone.patterns.some((pattern) => text.includes(pattern)));
  if (hits.length > 0) {
    return result('no_go_zones', 'fail', `No-Go matched: ${hits.map((hit) => hit.label).join(', ')}.`);
  }
  return result('no_go_zones', 'pass', 'No No-Go zone matched.');
}

function checkDependencyRisk(input) {
  const text = inputText(input);
  if (['builder chat fusion', 'render integration', 'aicos write', 'aicos mutation'].some((needle) => text.includes(needle))) {
    return result('dependency_risk', 'fail', 'Requested dependency touches a blocked donor or mutation path.');
  }
  if (['maya context', 'maya director', 'maya chat', 'desktop bridge', 'swarm'].some((needle) => text.includes(needle))) {
    return result('dependency_risk', 'review', 'Requested dependency is adapter-only or future-path and needs review.');
  }
  return result('dependency_risk', 'pass', 'No blocked dependency detected.');
}

function checkRuntimeRisk(input) {
  const text = inputText(input);
  if (['auto-deploy', 'autodeploy', 'render service', 'production mutation'].some((needle) => text.includes(needle))) {
    return result('runtime_deploy_risk', 'fail', 'Run would depend on deploy or production mutation.');
  }
  if (['deploy', 'runtime', 'cron', 'worker'].some((needle) => text.includes(needle))) {
    return result('runtime_deploy_risk', 'review', 'Runtime or deploy risk needs human review.');
  }
  return result('runtime_deploy_risk', 'pass', 'Run can be assessed without deploy or production mutation.');
}

function checkEvidence(input) {
  if (!hasEvidenceSource(input)) {
    return result('evidence_availability', 'fail', 'No evidence source, audit, artifact, or test path was provided.');
  }
  return result('evidence_availability', 'pass', 'At least one evidence source is available.');
}

function checkTrackIndependence(input) {
  const tracks = trackEntries(input);
  if (tracks.length === 0 || tracks.length === 1) {
    return result('track_independence', 'pass', 'Single-track execution only.');
  }

  const seenScopes = new Set();
  for (const track of tracks) {
    const trackScope = asArray(track.scope).map(String);
    if (trackScope.length === 0 || asArray(track.depends_on).length > 0) {
      return result('track_independence', 'review', 'Parallel tracks need human review because a scope or dependency is unclear.');
    }
    for (const scope of trackScope) {
      if (seenScopes.has(scope)) {
        return result('track_independence', 'review', 'Parallel tracks overlap in requested scope.');
      }
      seenScopes.add(scope);
    }
  }
  return result('track_independence', 'review', 'Parallel-track recommendation is future-capable only; MVP requires human review.');
}

function classifyRisks(input) {
  return asArray(input.known_risks).map((risk) => {
    const text = normalizeText(risk);
    const type = Object.entries(RISK_KEYWORDS).find(([, keywords]) => keywords.some((keyword) => text.includes(keyword)));
    return {
      risk: String(risk),
      type: type ? type[0] : 'other',
      action: type && ['deploy', 'data'].includes(type[0]) ? 'block_or_review' : 'human_review',
    };
  });
}

function checkKnownRisks(input) {
  const risks = asArray(input.known_risks);
  if (risks.length === 0) {
    return result('known_risks', 'pass', 'No known_risks were provided; output marks not_provided.');
  }
  if (classifyRisks(input).some((risk) => risk.action === 'block_or_review')) {
    return result('known_risks', 'review', 'Known risks include deploy, data, auth, or secret concerns.');
  }
  return result('known_risks', 'review', 'Known risks were provided and require visible handling.');
}

function checkHumanGate() {
  return result('human_gate', 'pass', 'MVP keeps human gate required for execution.');
}

function checkCouncilTrigger(input) {
  const text = inputText(input);
  if (['architecture decision', 'tradeoff', 'conflict between phases', 'repeated retry'].some((needle) => text.includes(needle))) {
    return result('council_trigger', 'review', 'Council trigger may exist, but MVP degrades to human review.');
  }
  return result('council_trigger', 'pass', 'No council trigger detected.');
}

function calculateConfidence(checks) {
  const total = checks.reduce((sum, check) => sum + CHECK_VALUES[check.status], 0);
  return Number((total / checks.length).toFixed(2));
}

function applyOverrides(confidence, checks) {
  const failedNames = checks.filter((check) => check.status === 'fail').map((check) => check.name);
  let adjusted = confidence;
  if (failedNames.includes('no_go_zones')) adjusted = Math.min(adjusted, 0.3);
  if (failedNames.includes('evidence_availability')) adjusted = Math.min(adjusted, 0.4);
  if (failedNames.includes('file_risk')) adjusted = Math.min(adjusted, 0.6);
  if (failedNames.includes('input_schema')) adjusted = Math.min(adjusted, 0.4);
  return Number(adjusted.toFixed(2));
}

function stoplightFor(confidence, hasFail, hasReview) {
  if (hasFail || confidence < 0.55) return 'red';
  if (hasReview) return 'yellow';
  if (confidence < 0.8) return 'yellow';
  return 'green';
}

function decisionFor(checks, stoplight) {
  if (checks.some((check) => check.status === 'fail')) return 'reject';
  if (stoplight === 'yellow' || checks.some((check) => check.status === 'review' || check.status === 'unknown')) {
    return 'require_human_review';
  }
  return 'allow_single_track';
}

function buildOutput(input) {
  const checks = [
    checkRequiredInput(input),
    checkScopeClarity(input),
    checkFileRisk(input),
    checkNoGo(input),
    checkDependencyRisk(input),
    checkRuntimeRisk(input),
    checkEvidence(input),
    checkTrackIndependence(input),
    checkKnownRisks(input),
    checkHumanGate(input),
    checkCouncilTrigger(input),
  ];

  const rawConfidence = calculateConfidence(checks);
  const confidence = applyOverrides(rawConfidence, checks);
  const hasFail = checks.some((check) => check.status === 'fail');
  const hasReview = checks.some((check) => check.status === 'review' || check.status === 'unknown');
  const stoplight = stoplightFor(confidence, hasFail, hasReview);
  const decision = decisionFor(checks, stoplight);
  if (!MVP_DECISIONS.has(decision)) {
    throw new Error(`Internal scanner error: non-MVP decision ${decision}`);
  }

  const knownRiskSummary = classifyRisks(input);
  const requiredEvidence = hasEvidenceSource(input)
    ? asArray(input.evidence_sources).concat(hasAnyText(input.available_donors, ['audit']) ? ['task_audit'] : [])
    : [];
  if (knownRiskSummary.length > 0 && !requiredEvidence.includes('risk_summary')) {
    requiredEvidence.push('risk_summary');
  }

  return {
    decision,
    confidence,
    stoplight,
    check_results: checks,
    known_risks_status: knownRiskSummary.length > 0 ? 'processed' : 'not_provided',
    risk_summary: knownRiskSummary,
    allowed_tracks: decision === 'allow_single_track'
      ? [{
        name: 'single-builder-task',
        scope: scopeEntries(input),
        requires_human_gate: true,
      }]
      : [],
    blocked_reasons: checks
      .filter((check) => check.status === 'fail')
      .map((check) => check.reason),
    required_evidence: [...new Set(requiredEvidence)],
    human_gate_required: true,
    council_required: checks.some((check) => check.name === 'council_trigger' && check.status === 'review'),
  };
}

const input = readInput(args[inputIndex + 1]);
const output = buildOutput(input);
process.stdout.write(JSON.stringify(output, null, pretty ? 2 : 0));
process.stdout.write('\n');
