import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import test from 'node:test';

import {
  WRITE_PERMIT_CONTENT_HASH_VECTOR,
  canonicalWritePermitContentBytes,
  computeWritePermitContentHash,
} from '../src/writePermitContentHash.js';

test('matches the shared write-permit contentHash vector', () => {
  const hash = computeWritePermitContentHash(WRITE_PERMIT_CONTENT_HASH_VECTOR);

  assert.equal(hash, WRITE_PERMIT_CONTENT_HASH_VECTOR.expectedHash);
  assert.equal(
    canonicalWritePermitContentBytes(WRITE_PERMIT_CONTENT_HASH_VECTOR).toString('utf8'),
    '00000029:G-Dislioglu/bluepilot-sandbox00000004:main00000021:probe/hash-vector.txt00000006:create00000000:00000006:hello\n',
  );
});

test('binds repo coordinates and operation into the hash', () => {
  const base = computeWritePermitContentHash(WRITE_PERMIT_CONTENT_HASH_VECTOR);

  assert.notEqual(
    computeWritePermitContentHash({ ...WRITE_PERMIT_CONTENT_HASH_VECTOR, path: 'probe/other.txt' }),
    base,
  );
  assert.notEqual(
    computeWritePermitContentHash({ ...WRITE_PERMIT_CONTENT_HASH_VECTOR, op: 'update', baseSha: 'a'.repeat(40) }),
    base,
  );
});

test('preserves exact content bytes without line-ending normalization', () => {
  const lf = computeWritePermitContentHash(WRITE_PERMIT_CONTENT_HASH_VECTOR);
  const crlf = computeWritePermitContentHash({ ...WRITE_PERMIT_CONTENT_HASH_VECTOR, content: 'hello\r\n' });
  const rawBytes = computeWritePermitContentHash({
    ...WRITE_PERMIT_CONTENT_HASH_VECTOR,
    content: Buffer.from([0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x0a]),
  });

  assert.equal(rawBytes, lf);
  assert.notEqual(crlf, lf);
});
