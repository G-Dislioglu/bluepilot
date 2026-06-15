import assert from 'node:assert/strict';

import type { CockpitProjectionAdoptionContract } from '../src/cockpitProjectionAdoptionContract.js';
import { renderCockpitReadOnlyHtml } from '../src/cockpitReadOnlyHtml.js';

const model: CockpitProjectionAdoptionContract = {
  status: 'ready',
  cockpitModelAllowed: true,
  executableActionAllowed: false,
  audience: 'operator',
  contractTaskId: 'BPK-903',
  reasons: [],
  headline: 'Ready for operator inspection',
  panels: [
    { id: 'readiness.dispatch_decision', title: 'Dispatch decision', status: 'ready', lines: ['dispatch_allowed:true'] },
    { id: 'runtime.integration', title: 'Runtime integration', status: 'ready', lines: ['status:runtime_candidate'] },
  ],
  actions: [
    { id: 'open_runtime_dispatch', enabled: false, reason: 'contract_only' },
  ],
};

function testRendersCompleteReadOnlyHtml(): void {
  const html = renderCockpitReadOnlyHtml(model);

  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('<title>Bluepilot Cockpit Read-Only</title>'));
  assert.ok(html.includes('Ready for operator inspection'));
  assert.ok(html.includes('Actions disabled'));
  assert.ok(html.includes('disabled title="contract_only"'));
}

function testRendersReviewAndBlockedStates(): void {
  const reviewHtml = renderCockpitReadOnlyHtml({
    ...model,
    status: 'review',
    headline: 'Operator review required',
    reasons: ['runtime_integration.readiness_review_required'],
    panels: [{ ...model.panels[0], status: 'review' }],
  });
  const blockedHtml = renderCockpitReadOnlyHtml({
    ...model,
    status: 'blocked',
    headline: 'Blocked before execution',
    reasons: ['dispatch_frontend.evidence_required_empty'],
    panels: [{ ...model.panels[0], status: 'blocked' }],
  });

  assert.ok(reviewHtml.includes('badge-review'));
  assert.ok(reviewHtml.includes('runtime_integration.readiness_review_required'));
  assert.ok(blockedHtml.includes('badge-blocked'));
  assert.ok(blockedHtml.includes('dispatch_frontend.evidence_required_empty'));
}

function testEscapesModelText(): void {
  const html = renderCockpitReadOnlyHtml({
    ...model,
    headline: '<script>alert("x")</script>',
    panels: [{ ...model.panels[0], lines: ['unsafe <b>line</b>'] }],
  });

  assert.ok(!html.includes('<script>alert'));
  assert.ok(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'));
  assert.ok(html.includes('unsafe &lt;b&gt;line&lt;/b&gt;'));
}

function testDoesNotMutateInputs(): void {
  const before = JSON.stringify(model);
  renderCockpitReadOnlyHtml(model);
  assert.equal(JSON.stringify(model), before);
}

testRendersCompleteReadOnlyHtml();
testRendersReviewAndBlockedStates();
testEscapesModelText();
testDoesNotMutateInputs();

console.log('cockpitReadOnlyHtml tests passed');
