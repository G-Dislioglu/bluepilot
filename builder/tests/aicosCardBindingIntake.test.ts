import assert from 'node:assert/strict';

import {
  intakeAicosCardSnapshots,
  type AicosCardSnapshot,
} from '../src/aicosCardBindingIntake.js';

const validCard: AicosCardSnapshot = {
  cardId: 'sol-dev-006',
  title: ' Builder WLP discipline ',
  status: 'active',
  policy: 'allow',
  appliesToPaths: ['./builder/src/example.ts'],
  evidenceRef: 'aicos://cards/sol-dev-006',
  reason: 'Applies to WLP-safe builder edits.',
};

function testAcceptsAndNormalizesValidCard(): void {
  const result = intakeAicosCardSnapshots([validCard]);

  assert.deepEqual(result.summary, {
    acceptedCount: 1,
    quarantinedCount: 0,
    duplicateCount: 0,
  });
  assert.deepEqual(result.acceptedCards, [{
    cardId: 'sol-dev-006',
    title: 'Builder WLP discipline',
    status: 'active',
    policy: 'allow',
    appliesToPaths: ['builder/src/example.ts'],
    evidenceRef: 'aicos://cards/sol-dev-006',
    reason: 'Applies to WLP-safe builder edits.',
  }]);
}

function testInvalidFieldsAreQuarantined(): void {
  const result = intakeAicosCardSnapshots([{
    cardId: 'bad card',
    title: '',
    status: 'unknown' as AicosCardSnapshot['status'],
    policy: 'maybe' as AicosCardSnapshot['policy'],
    evidenceRef: '',
  }]);

  assert.equal(result.acceptedCards.length, 0);
  assert.equal(result.quarantined.length, 1);
  assert.ok(result.quarantined[0].reasons.includes('aicos_card_intake.invalid_card_id:bad card'));
  assert.ok(result.quarantined[0].reasons.includes('aicos_card_intake.title_required:bad card'));
  assert.ok(result.quarantined[0].reasons.includes('aicos_card_intake.invalid_status:unknown'));
  assert.ok(result.quarantined[0].reasons.includes('aicos_card_intake.invalid_policy:maybe'));
  assert.ok(result.quarantined[0].reasons.includes('aicos_card_intake.evidence_ref_required:bad card'));
}

function testUnsafePathIsQuarantined(): void {
  const result = intakeAicosCardSnapshots([{
    ...validCard,
    appliesToPaths: ['../secret.txt'],
  }]);

  assert.equal(result.acceptedCards.length, 0);
  assert.ok(result.quarantined[0].reasons.includes('aicos_card_intake.invalid_path:../secret.txt'));
}

function testDuplicateCardIsQuarantined(): void {
  const result = intakeAicosCardSnapshots([
    validCard,
    { ...validCard, title: 'Duplicate title' },
  ]);

  assert.equal(result.acceptedCards.length, 1);
  assert.equal(result.quarantined.length, 1);
  assert.equal(result.summary.duplicateCount, 1);
  assert.ok(result.quarantined[0].reasons.includes('aicos_card_intake.duplicate_card:sol-dev-006'));
}

function testDoesNotMutateInputs(): void {
  const input = [validCard];
  const before = JSON.stringify(input);
  intakeAicosCardSnapshots(input);
  assert.equal(JSON.stringify(input), before);
}

testAcceptsAndNormalizesValidCard();
testInvalidFieldsAreQuarantined();
testUnsafePathIsQuarantined();
testDuplicateCardIsQuarantined();
testDoesNotMutateInputs();

console.log('aicosCardBindingIntake tests passed');
