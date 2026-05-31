import assert from 'node:assert/strict';

import { addAssumption, assembleArchitectInstruction } from '../src/architectPhase1.js';
import { hardenInstruction } from '../src/specHardening.js';

async function withWarnSilenced<T>(callback: () => Promise<T>): Promise<T> {
  const originalWarn = console.warn;
  console.warn = () => undefined;
  try {
    return await callback();
  } finally {
    console.warn = originalWarn;
  }
}

{
  const longInstruction = 'continue freely '.repeat(4000);
  const hardening = hardenInstruction(longInstruction);

  assert.equal(hardening.ok, true);
  assert.equal(hardening.stats.blockCount, 0);
  assert.ok(hardening.findings.some((finding) => finding.code === 'INSTRUCTION_TOO_LONG' && finding.severity === 'warn'));
}

{
  const dangerousInstruction = ['```ts', 'DROP TABLE users;', '```'].join('\n');
  const hardening = hardenInstruction(dangerousInstruction);

  assert.equal(hardening.ok, false);
  assert.ok(hardening.findings.some((finding) => finding.code === 'FORBIDDEN_PATTERN' && finding.severity === 'block'));
}

{
  const longInstruction = 'Builder soll weiterarbeiten und nicht wegen Umfang abbrechen. '.repeat(260);
  const result = await withWarnSilenced(() => assembleArchitectInstruction(longInstruction, {}));

  assert.equal(result.ok, true);
  assert.equal(result.blockReason, undefined);
  assert.ok(result.finalInstruction.length > 12_000);
  assert.ok(result.warnings.some((warning) => warning.includes('User instruction exceeds the Phase-1 soft limit')));
}

{
  const longMultiParagraphAssumption = [
    'Diese Annahme ist absichtlich lang und soll als Arbeitsmaterial erhalten bleiben.',
    '',
    'Sie darf nicht wegen Laenge oder Absatzstruktur verworfen werden. '.repeat(30),
  ].join('\n');
  const result = await withWarnSilenced(() => addAssumption(longMultiParagraphAssumption, 'architect-phase1-test'));

  assert.equal(result.ok, true);
  assert.ok(result.entry.text.length > 1000);
  assert.equal(result.entry.reuseAllowed, true);
}

console.log('architectPhase1 tests passed');
