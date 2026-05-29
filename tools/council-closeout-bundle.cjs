#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { createReportBundle } = require('./council-session-report-bundle.cjs');
const { createCloseoutCandidate, writeCandidate } = require('./council-closeout-candidate.cjs');
const { renderHandoff, writeHandoff } = require('./operator-handoff.cjs');

const VERSION = '0.1.0';

function nowIso() {
  return new Date().toISOString();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function writeJson(filePath, value) {
  const resolved = path.resolve(filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return resolved;
}

function createCloseoutBundle(options) {
  const outDir = path.resolve(options.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const reportBundle = createReportBundle({ councilRoot: options.councilRoot, outDir });
  const report = readJson(reportBundle.artifacts.json_report);
  const candidate = createCloseoutCandidate(report);
  const candidatePath = writeCandidate(path.join(outDir, 'council-closeout-candidate.json'), candidate);
  const handoff = renderHandoff(report, candidate);
  const handoffPath = writeHandoff(path.join(outDir, 'operator-handoff.md'), handoff);
  const summary = {
    tool: 'council-closeout-bundle',
    version: VERSION,
    generated_at: nowIso(),
    read_only: true,
    council_root: path.resolve(options.councilRoot),
    out_dir: outDir,
    artifacts: {
      report_bundle: reportBundle.artifacts.bundle_summary,
      json_report: reportBundle.artifacts.json_report,
      markdown_report: reportBundle.artifacts.markdown_report,
      closeout_candidate: candidatePath,
      operator_handoff: handoffPath,
    },
    candidate_status: candidate.candidate_status,
    can_auto_close: false,
    next_actions: candidate.next_actions,
    claims: {
      session_mutated: false,
      event_appended: false,
      auto_closed: false,
      agent_spawned: false,
      human_decision_inferred: false,
    },
  };
  summary.artifacts.closeout_bundle = writeJson(path.join(outDir, 'council-closeout-bundle.json'), summary);
  return summary;
}

function usage() {
  return [
    'Usage:',
    '  node tools/council-closeout-bundle.cjs --council-root <root> --out <dir>',
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
  const councilRoot = getArg(argv, '--council-root');
  const outDir = getArg(argv, '--out');
  if (!councilRoot) throw new Error('Missing required --council-root path.');
  if (!outDir) throw new Error('Missing required --out path.');
  process.stdout.write(`${JSON.stringify(createCloseoutBundle({ councilRoot, outDir }), null, 2)}\n`);
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
  createCloseoutBundle,
};
