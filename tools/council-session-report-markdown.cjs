#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const VERSION = '0.1.0';

function readReport(reportPath) {
  const resolved = path.resolve(reportPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Report not found: ${reportPath}`);
  }
  const report = JSON.parse(fs.readFileSync(resolved, 'utf8').replace(/^\uFEFF/, ''));
  if (!report || report.tool !== 'council-session-report') {
    throw new Error('Input is not a council-session-report JSON file.');
  }
  return report;
}

function boolText(value) {
  return value ? 'yes' : 'no';
}

function listText(items) {
  if (!items || items.length === 0) return '-';
  return items.join(', ');
}

function renderMarkdown(report) {
  const lines = [];
  lines.push('# Council Session Report');
  lines.push('');
  lines.push(`Generated: ${report.generated_at || 'unknown'}`);
  lines.push(`Session: ${report.session && report.session.session_id ? report.session.session_id : 'unknown'}`);
  lines.push(`Status: ${report.session && report.session.status ? report.session.status : 'unknown'}`);
  lines.push('');
  lines.push('## Gates');
  lines.push('');
  lines.push('| Gate | Passed |');
  lines.push('|---|---|');
  for (const [name, value] of Object.entries(report.gates || {})) {
    lines.push(`| ${name} | ${boolText(value)} |`);
  }
  lines.push('');
  lines.push('## Tasks');
  lines.push('');
  lines.push('| Task | Status | Evidence | Technical Ready | Human UI Review | Missing Gates |');
  lines.push('|---|---|---:|---|---|---|');
  for (const task of (report.tasks && report.tasks.items) || []) {
    lines.push(`| ${task.task_id} | ${task.status || '-'} | ${task.evidence_count || 0} | ${boolText(task.technical_ready)} | ${boolText(task.human_ui_review)} | ${listText(task.missing_gates)} |`);
  }
  lines.push('');
  lines.push('## Evidence Summary');
  lines.push('');
  const evidence = report.evidence || {};
  lines.push(`- Tasks: ${evidence.tasks || 0}`);
  lines.push(`- Technical ready: ${evidence.technical_ready || 0}`);
  lines.push(`- Missing evidence: ${evidence.missing_evidence || 0}`);
  lines.push(`- Human UI Review done: ${evidence.human_ui_review_done || 0}`);
  lines.push('');
  lines.push('## Next Actions');
  lines.push('');
  for (const action of report.next_actions || []) {
    lines.push(`- ${action}`);
  }
  lines.push('');
  lines.push('## Claims');
  lines.push('');
  lines.push('- Read-only report artifact.');
  lines.push('- Human UI Review is reported only if already recorded.');
  lines.push('- This Markdown file is not a product Web UI.');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function writeMarkdown(outPath, markdown) {
  const resolved = path.resolve(outPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, markdown, 'utf8');
  return resolved;
}

function usage() {
  return [
    'Usage:',
    '  node tools/council-session-report-markdown.cjs --report report.json [--out report.md]',
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

  const markdown = renderMarkdown(readReport(reportPath));
  if (outPath) {
    const written = writeMarkdown(outPath, markdown);
    process.stdout.write(`${JSON.stringify({ written }, null, 2)}\n`);
  } else {
    process.stdout.write(markdown);
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
  readReport,
  renderMarkdown,
  writeMarkdown,
};
