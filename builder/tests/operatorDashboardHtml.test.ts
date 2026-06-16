import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOperatorDashboardModel } from '../src/eightPointIntegrationReadiness.js';
import { renderOperatorDashboardHtml } from '../src/operatorDashboardHtml.js';

test('operator dashboard renders read-only HTML for all panels', () => {
  const html = renderOperatorDashboardHtml(buildOperatorDashboardModel(new Date('2026-06-15T14:00:00.000Z')));

  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('<title>Bluepilot Operator Dashboard Readonly</title>'));
  assert.ok(html.includes('BPK Execution Ledger'));
  assert.ok(html.includes('GOAT Desktop Bridge'));
  assert.ok(html.includes('Maya-Core Gate Enforcement'));
  assert.ok(html.includes('Maya/Kaya Authority Status'));
  assert.ok(html.includes('Provider and Runtime Flows'));
  assert.ok(html.includes('Merge and Release Readiness'));
  assert.ok(html.includes('Activation Controls'));
  assert.ok(html.includes('/probe/activation-lock-preflight'));
  assert.ok(html.includes('keine Writes'));
});

test('operator dashboard renders activation controls without submit actions', () => {
  const html = renderOperatorDashboardHtml(buildOperatorDashboardModel(new Date('2026-06-15T14:00:00.000Z')));

  assert.ok(html.includes('Provider Preflight'));
  assert.ok(html.includes('Maya Authority Verify'));
  assert.ok(html.includes('/probe/maya-core-autonomy-verification-preflight'));
  assert.ok(html.includes('Maya Live Verify'));
  assert.ok(html.includes('/probe/maya-core-autonomy-live-verification-run'));
  assert.ok(html.includes('&quot;executeLiveVerification&quot;: false'));
  assert.ok(html.includes('Runtime Preflight'));
  assert.ok(html.includes('Write Preflight'));
  assert.ok(html.includes('Activation Lock'));
  assert.ok(html.includes('data-copy-target="activation-lock-payload"'));
  assert.ok(html.includes('&quot;target&quot;: &quot;runtime_dry_run&quot;'));
  assert.ok(!html.includes('<form'));
  assert.ok(!html.includes('type="submit"'));
  assert.ok(!html.includes('fetch('));
});

test('operator dashboard escapes panel text', () => {
  const model = buildOperatorDashboardModel(new Date('2026-06-15T14:00:00.000Z'));
  model.panels[0].title = '<script>alert("x")</script>';
  const html = renderOperatorDashboardHtml(model);

  assert.ok(!html.includes('<script>alert'));
  assert.ok(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'));
});
