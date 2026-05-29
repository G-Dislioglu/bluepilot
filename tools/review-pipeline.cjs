#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { parseUnifiedDiff } = require('./difflens.cjs');
const { createManifest, renderPreviewHtml } = require('./browser-preview.cjs');
const { smokePreviewHtml } = require('./browser-preview-smoke.cjs');
const { runBrowserSmoke } = require('./browser-automation-smoke.cjs');
const { runScreenshotCheck } = require('./browser-screenshot-check.cjs');

const VERSION = '0.1.0';

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readDiffInput(options) {
  if (options.diffText != null) return String(options.diffText);
  if (options.diffPath) return fs.readFileSync(path.resolve(options.diffPath), 'utf8');
  const range = options.range || 'HEAD~1..HEAD';
  return execFileSync('git', ['diff', range], {
    cwd: options.repoRoot || process.cwd(),
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 50,
  });
}

function summarizeStep(name, result) {
  return {
    name,
    passed: Boolean(result && result.passed !== false),
    reason: result && result.reason ? result.reason : null,
  };
}

function runReviewPipeline(options) {
  const outDir = path.resolve(options.outDir);
  fs.mkdirSync(outDir, { recursive: true });

  const paths = {
    diff: path.join(outDir, 'diff-output.patch'),
    difflens: path.join(outDir, 'difflens-evidence.json'),
    preview: path.join(outDir, 'preview.html'),
    manifest: path.join(outDir, 'preview.manifest.json'),
    domSmoke: path.join(outDir, 'dom-smoke.json'),
    browserSmoke: path.join(outDir, 'browser-smoke.json'),
    screenshot: path.join(outDir, 'preview.png'),
    screenshotCheck: path.join(outDir, 'screenshot-check.json'),
    summary: path.join(outDir, 'pipeline-summary.json'),
  };

  const diffText = readDiffInput(options);
  fs.writeFileSync(paths.diff, diffText, 'utf8');

  const difflens = parseUnifiedDiff(diffText);
  writeJson(paths.difflens, difflens);

  const html = renderPreviewHtml(difflens);
  fs.writeFileSync(paths.preview, html, 'utf8');

  const manifest = createManifest(difflens, {
    htmlPath: paths.preview,
    source: options.diffPath ? path.resolve(options.diffPath) : options.range || 'diffText',
  });
  writeJson(paths.manifest, manifest);

  const domSmoke = smokePreviewHtml(html, manifest);
  writeJson(paths.domSmoke, domSmoke);

  const browserSmoke = runBrowserSmoke({
    htmlPath: paths.preview,
    manifestPath: paths.manifest,
    browserPath: options.browserPath,
    timeoutMs: options.timeoutMs,
  });
  writeJson(paths.browserSmoke, browserSmoke);

  const screenshotCheck = runScreenshotCheck({
    htmlPath: paths.preview,
    outPath: paths.screenshot,
    browserPath: options.browserPath,
    timeoutMs: options.timeoutMs,
  });
  writeJson(paths.screenshotCheck, screenshotCheck);

  const steps = [
    summarizeStep('difflens', { passed: difflens.tool === 'difflens' }),
    summarizeStep('html_preview', { passed: fs.existsSync(paths.preview) }),
    summarizeStep('dom_smoke', domSmoke),
    summarizeStep('browser_smoke', browserSmoke),
    summarizeStep('screenshot_check', screenshotCheck),
  ];

  const summary = {
    tool: 'review-pipeline',
    version: VERSION,
    passed: steps.every((step) => step.passed),
    out_dir: outDir,
    artifacts: paths,
    steps,
    summary: difflens.summary,
    risk_flags: difflens.risk_flags,
    human_gate_required: Boolean(difflens.human_gate_required),
    visual_review_required: Boolean(difflens.visual_review_required),
    browser_automation: Boolean(browserSmoke.browser_automation),
    screenshot_check: Boolean(screenshotCheck.screenshot_check),
    human_ui_review: false,
  };
  writeJson(paths.summary, summary);

  return summary;
}

function usage() {
  return [
    'Usage:',
    '  node tools/review-pipeline.cjs --range HEAD~5..HEAD --out <dir>',
    '  node tools/review-pipeline.cjs --diff patch.diff --out <dir>',
    '',
    'Options:',
    '  --browser <path>  Use a specific browser executable.',
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

  const outDir = getArg(argv, '--out');
  const range = getArg(argv, '--range');
  const diffPath = getArg(argv, '--diff');
  const browserPath = getArg(argv, '--browser');

  if (!outDir) throw new Error('Missing required --out path.');
  if (range && diffPath) throw new Error('Choose either --range or --diff, not both.');
  if (argv.includes('--range') && !range) throw new Error('Missing value after --range.');
  if (argv.includes('--diff') && !diffPath) throw new Error('Missing path after --diff.');
  if (argv.includes('--browser') && !browserPath) throw new Error('Missing path after --browser.');

  const result = runReviewPipeline({
    outDir,
    range,
    diffPath,
    browserPath,
    repoRoot: process.cwd(),
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.passed ? 0 : 1;
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
  readDiffInput,
  runReviewPipeline,
};
