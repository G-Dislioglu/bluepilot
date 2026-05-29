#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const VERSION = '0.1.0';

function nowIso() {
  return new Date().toISOString();
}

function readReport(reportPath) {
  const resolved = path.resolve(reportPath);
  if (!fs.existsSync(resolved)) throw new Error(`Report not found: ${reportPath}`);
  const report = JSON.parse(fs.readFileSync(resolved, 'utf8').replace(/^\uFEFF/, ''));
  if (!report || report.tool !== 'council-session-report') {
    throw new Error('Input is not a council-session-report JSON file.');
  }
  return report;
}

function failedGateNames(gates) {
  return Object.entries(gates || {})
    .filter(([, value]) => value !== true)
    .map(([name]) => name);
}

function blockingReasons(report) {
  const gates = report.gates || {};
  const reasons = [];
  if (gates.all_tasks_done_or_skipped !== true) reasons.push('tasks_not_all_done_or_skipped');
  if (gates.no_hard_stop !== true) reasons.push('hard_stop_present_or_session_paused');
  if (gates.all_tasks_have_evidence !== true) reasons.push('missing_task_evidence');
  if (gates.all_technical_evidence_ready !== true) reasons.push('technical_evidence_not_ready');
  return reasons;
}

function reviewReasons(report) {
  const gates = report.gates || {};
  const reasons = [];
  if (gates.human_ui_review_complete !== true) reasons.push('human_ui_review_not_complete');
  return reasons;
}

function createCloseoutCandidate(report) {
  const blocking = blockingReasons(report);
  const review = reviewReasons(report);
  const candidateStatus = blocking.length === 0 ? 'READY_FOR_HUMAN_REVIEW' : 'BLOCKED';
  return {
    tool: 'council-closeout-candidate',
    version: VERSION,
    generated_at: nowIso(),
    read_only: true,
    session_id: report.session && report.session.session_id ? report.session.session_id : null,
    candidate_status: candidateStatus,
    can_auto_close: false,
    closeout_decision_required_from: 'human_operator',
    failed_gates: failedGateNames(report.gates),
    blocking_reasons: blocking,
    review_reasons: review,
    evidence_summary: report.evidence || {},
    task_summary: {
      total: report.tasks && report.tasks.total ? report.tasks.total : 0,
      by_status: report.tasks && report.tasks.by_status ? report.tasks.by_status : {},
    },
    next_actions: blocking.length > 0 ? report.next_actions || [] : [
      'perform_human_closeout_review',
      'record_human_decision_before_session_close',
    ],
    claims: {
      session_mutated: false,
      event_appended: false,
      auto_closed: false,
      human_decision_inferred: false,
    },
  };
}

function writeCandidate(outPath, candidate) {
  const resolved = path.resolve(outPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(candidate, null, 2)}\n`, 'utf8');
  return resolved;
}

function usage() {
  return [
    'Usage:',
    '  node tools/council-closeout-candidate.cjs --report council-session-report.json [--out closeout-candidate.json]',
  ].join('\n');
}

function getArg(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  return argv[index + 1] || null;
}

function runCli(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  const reportPath = getArg(argv, '--report');
  const outPath = getArg(argv, '--out');
  if (!reportPath) throw new Error('Missing required --report path.');
  if (argv.includes('--out') && !outPath) throw new Error('Missing value after --out.');
  const candidate = createCloseoutCandidate(readReport(reportPath));
  if (outPath) {
    process.stdout.write(`${JSON.stringify({ written: writeCandidate(outPath, candidate), candidate }, null, 2)}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(candidate, null, 2)}\n`);
  }
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = runCli(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  VERSION,
  blockingReasons,
  createCloseoutCandidate,
  failedGateNames,
  readReport,
  reviewReasons,
  writeCandidate,
};
