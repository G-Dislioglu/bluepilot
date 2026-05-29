#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const VERSION = '0.1.0';

function readJson(filePath, expectedTool) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) throw new Error(`File not found: ${filePath}`);
  const value = JSON.parse(fs.readFileSync(resolved, 'utf8').replace(/^\uFEFF/, ''));
  if (expectedTool && value.tool !== expectedTool) {
    throw new Error(`Expected ${expectedTool}, got ${value.tool || 'unknown'}.`);
  }
  return value;
}

function yesNo(value) {
  return value ? 'yes' : 'no';
}

function itemList(items) {
  if (!items || items.length === 0) return ['- none'];
  return items.map((item) => `- ${item}`);
}

function renderHandoff(report, candidate) {
  const lines = [];
  lines.push('# Bluepilot Operator Handoff');
  lines.push('');
  lines.push(`Session: ${candidate.session_id || 'unknown'}`);
  lines.push(`Closeout candidate: ${candidate.candidate_status}`);
  lines.push(`Auto close: ${yesNo(candidate.can_auto_close)}`);
  lines.push('');
  lines.push('## What Is Ready');
  lines.push('');
  lines.push(`- Tasks total: ${candidate.task_summary.total}`);
  lines.push(`- Technical evidence ready: ${(report.evidence && report.evidence.technical_ready) || 0}`);
  lines.push(`- Missing evidence: ${(report.evidence && report.evidence.missing_evidence) || 0}`);
  lines.push('');
  lines.push('## Blocking Reasons');
  lines.push('');
  lines.push(...itemList(candidate.blocking_reasons));
  lines.push('');
  lines.push('## Review Still Needed');
  lines.push('');
  lines.push(...itemList(candidate.review_reasons));
  lines.push('');
  lines.push('## Next Actions');
  lines.push('');
  lines.push(...itemList(candidate.next_actions));
  lines.push('');
  lines.push('## Task Snapshot');
  lines.push('');
  lines.push('| Task | Status | Evidence | Technical Ready | Human UI Review |');
  lines.push('|---|---|---:|---|---|');
  for (const task of (report.tasks && report.tasks.items) || []) {
    lines.push(`| ${task.task_id} | ${task.status || '-'} | ${task.evidence_count || 0} | ${yesNo(task.technical_ready)} | ${yesNo(task.human_ui_review)} |`);
  }
  lines.push('');
  lines.push('## Guardrails');
  lines.push('');
  lines.push('- This handoff does not close the Council Session.');
  lines.push('- Human decision is required before closeout.');
  lines.push('- Human UI Review is not inferred.');
  lines.push('- No Agent or Builder action was started by this artifact.');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function writeHandoff(outPath, markdown) {
  const resolved = path.resolve(outPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, markdown, 'utf8');
  return resolved;
}

function usage() {
  return [
    'Usage:',
    '  node tools/operator-handoff.cjs --report council-session-report.json --candidate closeout-candidate.json [--out operator-handoff.md]',
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
  const candidatePath = getArg(argv, '--candidate');
  const outPath = getArg(argv, '--out');
  if (!reportPath) throw new Error('Missing required --report path.');
  if (!candidatePath) throw new Error('Missing required --candidate path.');
  if (argv.includes('--out') && !outPath) throw new Error('Missing value after --out.');
  const markdown = renderHandoff(
    readJson(reportPath, 'council-session-report'),
    readJson(candidatePath, 'council-closeout-candidate'),
  );
  if (outPath) {
    process.stdout.write(`${JSON.stringify({ written: writeHandoff(outPath, markdown) }, null, 2)}\n`);
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
  readJson,
  renderHandoff,
  writeHandoff,
};
