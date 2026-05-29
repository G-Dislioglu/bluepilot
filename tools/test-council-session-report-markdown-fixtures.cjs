#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { renderMarkdown, readReport, writeMarkdown } = require('./council-session-report-markdown.cjs');

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-session-report-md-'));
}

function sampleReport() {
  return {
    tool: 'council-session-report',
    generated_at: '2026-05-29T00:00:00.000Z',
    session: { session_id: 'cs-md-fixture', status: 'active' },
    tasks: {
      items: [
        {
          task_id: 'BP-A',
          status: 'done',
          evidence_count: 1,
          technical_ready: true,
          human_ui_review: false,
          missing_gates: [],
        },
        {
          task_id: 'BP-B',
          status: 'queued',
          evidence_count: 0,
          technical_ready: false,
          human_ui_review: false,
          missing_gates: ['pipeline_evidence'],
        },
      ],
    },
    evidence: {
      tasks: 2,
      technical_ready: 1,
      missing_evidence: 1,
      human_ui_review_done: 0,
    },
    gates: {
      all_tasks_terminal: false,
      all_tasks_have_evidence: false,
    },
    next_actions: ['complete_or_close_open_tasks'],
  };
}

function run() {
  const root = tempRoot();
  try {
    const reportPath = path.join(root, 'report.json');
    fs.writeFileSync(reportPath, `${JSON.stringify(sampleReport(), null, 2)}\n`, 'utf8');
    const loaded = readReport(reportPath);
    assert.strictEqual(loaded.session.session_id, 'cs-md-fixture');

    const markdown = renderMarkdown(loaded);
    assert.ok(markdown.includes('# Council Session Report'));
    assert.ok(markdown.includes('| BP-A | done | 1 | yes | no | - |'));
    assert.ok(markdown.includes('complete_or_close_open_tasks'));
    assert.ok(markdown.includes('This Markdown file is not a product Web UI.'));

    const outPath = path.join(root, 'report.md');
    const written = writeMarkdown(outPath, markdown);
    assert.strictEqual(written, path.resolve(outPath));
    assert.ok(fs.readFileSync(outPath, 'utf8').includes('cs-md-fixture'));

    const cliOut = require('child_process').execFileSync(process.execPath, [
      'tools/council-session-report-markdown.cjs',
      '--report',
      reportPath,
    ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
    assert.ok(cliOut.includes('Council Session Report'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

run();
process.stdout.write('council session report markdown fixtures: PASS\n');
