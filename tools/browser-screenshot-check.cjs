#!/usr/bin/env node

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  discoverBrowser,
  filePathToUrl,
} = require('./browser-automation-smoke.cjs');

const VERSION = '0.1.0';
const MIN_SCREENSHOT_BYTES = 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function makeCheck(name, passed, detail) {
  return { name, passed: Boolean(passed), detail };
}

function buildScreenshotArgs(url, outPath, userDataDir) {
  return [
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,900',
    `--user-data-dir=${userDataDir}`,
    `--screenshot=${outPath}`,
    url,
  ];
}

function validatePng(filePath, minBytes = MIN_SCREENSHOT_BYTES) {
  const checks = [];
  const resolved = path.resolve(filePath);
  const exists = fs.existsSync(resolved);
  checks.push(makeCheck('screenshot_exists', exists, 'Screenshot file exists.'));

  if (!exists) {
    checks.push(makeCheck('png_signature', false, 'Screenshot PNG signature is present.'));
    checks.push(makeCheck('minimum_size', false, `Screenshot is at least ${minBytes} bytes.`));
    return { passed: false, bytes: 0, checks };
  }

  const buffer = fs.readFileSync(resolved);
  const signatureOk = buffer.length >= PNG_SIGNATURE.length && PNG_SIGNATURE.equals(buffer.subarray(0, PNG_SIGNATURE.length));
  checks.push(makeCheck('png_signature', signatureOk, 'Screenshot PNG signature is present.'));
  checks.push(makeCheck('minimum_size', buffer.length >= minBytes, `Screenshot is at least ${minBytes} bytes.`));

  return {
    passed: checks.every((check) => check.passed),
    bytes: buffer.length,
    checks,
  };
}

function runScreenshotCheck(options) {
  const htmlPath = path.resolve(options.htmlPath);
  const outPath = path.resolve(options.outPath);
  const browserPath = discoverBrowser(options.browserPath);
  const url = filePathToUrl(htmlPath);

  if (!fs.existsSync(htmlPath)) {
    return {
      tool: 'browser-screenshot-check',
      version: VERSION,
      passed: false,
      reason: 'missing_html',
      browser: null,
      url,
      screenshot_path: outPath,
      screenshot_bytes: 0,
      checks: [],
      browser_automation: false,
      screenshot_check: false,
      human_ui_review: false,
    };
  }

  if (!browserPath) {
    return {
      tool: 'browser-screenshot-check',
      version: VERSION,
      passed: false,
      reason: 'no_browser',
      browser: null,
      url,
      screenshot_path: outPath,
      screenshot_bytes: 0,
      checks: [],
      browser_automation: false,
      screenshot_check: false,
      human_ui_review: false,
    };
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  if (fs.existsSync(outPath)) fs.rmSync(outPath, { force: true });

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-screenshot-check-'));
  try {
    const result = spawnSync(browserPath, buildScreenshotArgs(url, outPath, userDataDir), {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 20,
      timeout: options.timeoutMs || 15000,
    });

    if (result.error) {
      return {
        tool: 'browser-screenshot-check',
        version: VERSION,
        passed: false,
        reason: 'browser_launch_failed',
        error: result.error.message,
        browser: browserPath,
        url,
        screenshot_path: outPath,
        screenshot_bytes: 0,
        checks: [],
        browser_automation: true,
        screenshot_check: false,
        human_ui_review: false,
      };
    }

    const validation = validatePng(outPath, options.minBytes || MIN_SCREENSHOT_BYTES);
    const exitCheck = makeCheck('browser_exit_zero', result.status === 0, 'Browser exited with status 0.');
    const checks = [exitCheck, ...validation.checks];
    const passed = checks.every((check) => check.passed);

    return {
      tool: 'browser-screenshot-check',
      version: VERSION,
      passed,
      reason: passed ? null : 'screenshot_check_failed',
      browser: browserPath,
      url,
      exit_status: result.status,
      screenshot_path: outPath,
      screenshot_bytes: validation.bytes,
      checks,
      browser_automation: true,
      screenshot_check: passed,
      human_ui_review: false,
    };
  } finally {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

function usage() {
  return [
    'Usage:',
    '  node tools/browser-screenshot-check.cjs --html preview.html --out preview.png [--browser browser.exe]',
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

  const htmlPath = getArg(argv, '--html');
  const outPath = getArg(argv, '--out');
  const browserPath = getArg(argv, '--browser');
  if (!htmlPath) throw new Error('Missing required --html path.');
  if (!outPath) throw new Error('Missing required --out path.');
  if (argv.includes('--browser') && !browserPath) throw new Error('Missing path after --browser.');

  const result = runScreenshotCheck({ htmlPath, outPath, browserPath });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.passed) return 0;
  if (result.reason === 'no_browser') return 2;
  return 1;
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
  MIN_SCREENSHOT_BYTES,
  PNG_SIGNATURE,
  buildScreenshotArgs,
  runScreenshotCheck,
  validatePng,
};
