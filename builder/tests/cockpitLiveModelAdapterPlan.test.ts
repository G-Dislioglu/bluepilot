import assert from 'node:assert/strict';

import { planCockpitLiveModelAdapter } from '../src/cockpitLiveModelAdapterPlan.js';
import type { CockpitLiveModelSourceDecision } from '../src/cockpitLiveModelSourceDecision.js';
import type { CockpitProjectionAdoptionContract } from '../src/cockpitProjectionAdoptionContract.js';
import type { LiveAicosNetworkConnectorResult } from '../src/liveAicosNetworkConnector.js';

const baseModel: CockpitProjectionAdoptionContract = {
  status: 'ready',
  cockpitModelAllowed: true,
  executableActionAllowed: false,
  audience: 'operator',
  contractTaskId: 'BPK-cockpit-live',
  reasons: [],
  headline: 'Ready for operator inspection',
  panels: [{
    id: 'runtime.integration',
    title: 'Runtime integration',
    status: 'ready',
    lines: ['status:runtime_candidate'],
  }],
  actions: [{
    id: 'open_runtime_dispatch',
    enabled: false,
    reason: 'disabled',
  }],
};

const decision: CockpitLiveModelSourceDecision = {
  status: 'ready',
  mode: 'live_aicos_read_only',
  liveModelSourceAllowed: true,
  readOnlyRouteRequired: true,
  executableActionAllowed: false,
  contractTaskId: 'BPK-cockpit-live',
  sourceRef: 'aicos://cards/operator-safe',
  acceptedCards: 1,
  quarantinedCards: 0,
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

const network: LiveAicosNetworkConnectorResult = {
  status: 'accepted',
  sourceRef: 'aicos://cards/operator-safe',
  capturedAt: '2026-06-13T13:00:00.000Z',
  reasons: [],
  summary: { acceptedCards: 1, quarantinedCards: 0 },
  intake: {
    acceptedCards: [{
      cardId: 'sol-dev-009',
      title: 'Operator safe source',
      status: 'active',
      policy: 'allow',
      evidenceRef: 'aicos://cards/sol-dev-009',
    }],
    quarantined: [],
    summary: { acceptedCount: 1, quarantinedCount: 0, duplicateCount: 0 },
  },
  network: {
    endpointRef: 'aicos://cards/operator-safe',
    endpointUrl: 'https://aicos.example.test/cards',
    fetchedAt: '2026-06-13T13:01:00.000Z',
    httpStatus: 200,
  },
};

function testReadyAdapterPlanBuildsReadOnlyModel(): void {
  const plan = planCockpitLiveModelAdapter({
    decision,
    baseModel,
    network,
    adapterRef: 'adapter:cockpit-live-aicos-read-only',
  });

  assert.equal(plan.status, 'ready');
  assert.equal(plan.adapterAllowed, true);
  assert.equal(plan.routeWiringAllowed, false);
  assert.equal(plan.plannedModel?.actions[0].enabled, false);
  assert.ok(plan.plannedModel?.panels.some((panel) => panel.id === 'live_aicos.cards'));
}

function testMissingAdapterRefRequiresReview(): void {
  const plan = planCockpitLiveModelAdapter({ decision, baseModel, network });

  assert.equal(plan.status, 'review_required');
  assert.equal(plan.adapterAllowed, false);
  assert.ok(plan.reviewItems.includes('cockpit_live_adapter.adapter_ref_required'));
}

function testBlockedDecisionBlocksAdapter(): void {
  const plan = planCockpitLiveModelAdapter({
    decision: {
      ...decision,
      status: 'blocked',
      liveModelSourceAllowed: false,
      blockers: ['cockpit_live_source.network_result_required'],
    },
    baseModel,
    network,
    adapterRef: 'adapter:cockpit-live-aicos-read-only',
  });

  assert.equal(plan.status, 'blocked');
  assert.ok(plan.blockers.includes('cockpit_live_adapter.decision_blocked:cockpit_live_source.network_result_required'));
}

testReadyAdapterPlanBuildsReadOnlyModel();
testMissingAdapterRefRequiresReview();
testBlockedDecisionBlocksAdapter();

console.log('cockpitLiveModelAdapterPlan tests passed');
