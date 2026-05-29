#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { buildSessionReport, writeReport } = require('./council-session-report.cjs');
const { renderMarkdown, writeMarkdown } = require('./council-session-report-markdown.cjs');

const VERSION = '0.1.0';

function nowIso() {
  return new Date().toISOString();
}

function writeJson(outPath, value) {
  const resolved = path.resolve(outPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return resolved;
}

function createReportBundle(options) {
  const councilRoot = path.resolve(options.councilRoot || process.cwd());
  const outDir = path.resolve(options.outDir);
  fs.mkdirSync(outDir, { recursive: true });

  const report = buildSessionReport({ councilRoot });
  const reportPath = writeReport(path.join(outDir, 'council-session-report.json'), report);
  const markdown = renderMarkdown(report);
  const markdownPath = writeMarkdown(path.join(outDir, 'council-session-report.md'), markdown);

  const bundle = {
    tool: 'council-session-report-bundle',
    version: VERSION,
    generated_at: nowIso(),
    read_only: true,
    council_root: councilRoot,
    out_dir: outDir,
    artifacts: {
      json_report: reportPath,
      markdown_report: markdownPath,
    },
    gates: report.gates,
    next_actions: report.next_actions,
    claims: {
      session_mutated: false,
      event_appended: false,
      agent_spawned: false,
      human_ui_review_inferred: false,
      artifacts_auto_committed: false,
    },
  };
  bundle.artifacts.bundle_summary = writeJson(path.join(outDir, 'council-session-report-bundle.json'), bundle);
  return bundle;
}

function usage() {
  return [
    'Usage:',
    '  node tools/council-session-report-bundle.cjs --council-root <root> --out <dir>',
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

  const bundle = createReportBundle({ councilRoot, outDir });
  process.stdout.write(`${JSON.stringify(bundle, null, 2)}\n`);
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
  createReportBundle,
};
