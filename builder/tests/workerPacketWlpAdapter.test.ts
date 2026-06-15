import assert from 'node:assert/strict';

import { adaptWorkerPacketToWlpContract, type WorkerPacket } from '../src/workerPacketWlpAdapter.js';

const basePacket: WorkerPacket = {
  taskId: 'BPK-900',
  taskName: 'Adapter Smoke',
  goal: 'Convert a worker packet into a WLP contract draft.',
  worker: 'deepseek',
  summary: 'Worker proposed a focused builder helper change.',
  governanceArtifactPaths: [
    'contracts/BPK-900.json',
    'review-packets/BPK-900.md',
    'docs/SESSION-LOG.md',
    'STATE.md',
  ],
  envelope: {
    worker: 'deepseek',
    summary: 'Add helper.',
    edits: [
      {
        path: 'builder/src/exampleHelper.ts',
        mode: 'create',
        content: 'export const value = 1;\n',
      },
    ],
    claims: [
      {
        text: 'Adds a builder helper.',
        evidence_refs: [
          { type: 'edit_path', ref: 'builder/src/exampleHelper.ts' },
        ],
      },
    ],
  },
  requiredCommands: ['npm test', 'npm run typecheck'],
  baselineRef: 'abc1234',
};

function expectErrors(packet: WorkerPacket, expected: string[]): void {
  const result = adaptWorkerPacketToWlpContract(packet, new Date('2026-06-13T10:00:00.000Z'));
  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error('expected adapter failure');
  }
  for (const error of expected) {
    assert.ok(result.errors.some((actual) => actual.includes(error)), `missing error ${error}; got ${result.errors.join(', ')}`);
  }
}

function testValidWorkerPacketCreatesWlpDraft(): void {
  const result = adaptWorkerPacketToWlpContract(basePacket, new Date('2026-06-13T10:00:00.000Z'));

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error('adapter failed');
  }

  assert.equal(result.contract.task_id, 'BPK-900');
  assert.equal(result.contract.created, '2026-06-13');
  assert.equal(result.contract.task_type, 'code_task');
  assert.deepEqual(result.contract.evidence_required, ['test_result']);
  assert.deepEqual(result.contract.reuse_target, ['session_log', 'review_packet', 'next_task_pre_lock']);
  assert.deepEqual(result.contract.allowed_files, [
    'contracts/BPK-900.json',
    'review-packets/BPK-900.md',
    'docs/SESSION-LOG.md',
    'STATE.md',
    'builder/src/exampleHelper.ts',
  ]);
  assert.ok(result.contract.forbidden_files.includes('.env*'));
  assert.ok(result.contract.forbidden_files.includes('.github/workflows/**'));
  assert.deepEqual(result.contract.claims, ['Adds a builder helper.']);
  assert.equal(result.contract.worker_packet.worker, 'deepseek');
  assert.deepEqual(result.contract.worker_packet.edit_paths, ['builder/src/exampleHelper.ts']);
  assert.equal(result.contract.worker_packet.task_class, 'class_1');
  assert.equal(result.contract.baseline_ref, 'abc1234');
  assert.deepEqual(result.warnings, []);
}

function testDocTaskEvidenceMapping(): void {
  const { requiredCommands: _requiredCommands, ...packetWithoutRequiredCommands } = basePacket;
  const result = adaptWorkerPacketToWlpContract({
    ...packetWithoutRequiredCommands,
    taskType: 'doc_task',
    envelope: {
      ...basePacket.envelope,
      edits: [
        {
          path: 'docs/example.md',
          mode: 'create',
          content: 'Example content.\n',
        },
      ],
      claims: undefined,
    },
  }, new Date('2026-06-13T10:00:00.000Z'));

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error('adapter failed');
  }

  assert.deepEqual(result.contract.evidence_required, ['content_check']);
  assert.deepEqual(result.contract.required_commands, [
    'node tools/verify-task-lock.cjs BPK-900 --verify',
    'git diff --check',
  ]);
  assert.deepEqual(result.contract.claims, []);
  assert.deepEqual(result.warnings, ['worker_packet.claims_empty']);
}

function testMalformedPacketFailsClosed(): void {
  expectErrors({
    ...basePacket,
    taskId: 'bad task',
    goal: '',
    envelope: {
      ...basePacket.envelope,
      edits: [],
    },
  }, [
    'worker_packet.invalid_task_id',
    'worker_packet.goal_required',
    'worker_packet.edits_required',
  ]);
}

function testDuplicateEditPathsFailClosed(): void {
  expectErrors({
    ...basePacket,
    envelope: {
      ...basePacket.envelope,
      edits: [
        {
          path: 'builder/src/exampleHelper.ts',
          mode: 'create',
          content: 'export const value = 1;\n',
        },
        {
          path: './builder/src/exampleHelper.ts',
          mode: 'overwrite',
          content: 'export const value = 2;\n',
        },
      ],
    },
  }, ['worker_packet.duplicate_edit_path:builder/src/exampleHelper.ts']);
}

function testInvalidPathsFailClosed(): void {
  expectErrors({
    ...basePacket,
    governanceArtifactPaths: ['contracts/BPK-900.json', '../outside.md'],
    envelope: {
      ...basePacket.envelope,
      edits: [
        {
          path: 'C:/absolute.ts',
          mode: 'create',
          content: 'export const value = 1;\n',
        },
      ],
    },
  }, [
    'edit_path:invalid_path:C:/absolute.ts',
    'governance_artifact:invalid_path:../outside.md',
  ]);
}

function testProtectedPathFailsClosed(): void {
  expectErrors({
    ...basePacket,
    envelope: {
      ...basePacket.envelope,
      edits: [
        {
          path: '.github/workflows/release.yml',
          mode: 'create',
          content: 'name: release\n',
        },
      ],
    },
  }, ['worker_packet.protected_path:.github/workflows/release.yml']);
}

function testUiTaskRequiresPersona(): void {
  expectErrors({
    ...basePacket,
    taskType: 'ui_task',
    targetPersona: null,
  }, ['worker_packet.ui_task_target_persona_required']);
}

testValidWorkerPacketCreatesWlpDraft();
testDocTaskEvidenceMapping();
testMalformedPacketFailsClosed();
testDuplicateEditPathsFailClosed();
testInvalidPathsFailClosed();
testProtectedPathFailsClosed();
testUiTaskRequiresPersona();

console.log('workerPacketWlpAdapter tests passed');
