import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';

export type WritePermitOperation = 'create' | 'update';

export interface WritePermitContentHashInput {
  repo: string;
  branch: string;
  path: string;
  op: WritePermitOperation;
  baseSha: string;
  content: string | Uint8Array;
}

export const WRITE_PERMIT_CONTENT_HASH_VECTOR = {
  repo: 'G-Dislioglu/bluepilot-sandbox',
  branch: 'main',
  path: 'probe/hash-vector.txt',
  op: 'create' as const,
  baseSha: '',
  content: 'hello\n',
  expectedHash: 'sha256:4cf2991e34c573d82852a5293d9fae147c0bec2249fa9c71cae75b8ef7728576',
  canonicalPreview:
    '00000029:G-Dislioglu/bluepilot-sandbox00000004:main00000021:probe/hash-vector.txt00000006:create00000000:00000006:hello\\n',
};

function textBytes(value: string): Buffer {
  return Buffer.from(value, 'utf8');
}

function contentBytes(value: string | Uint8Array): Buffer {
  return typeof value === 'string' ? textBytes(value) : Buffer.from(value);
}

function withLengthPrefix(bytes: Buffer): Buffer {
  const prefix = textBytes(`${String(bytes.byteLength).padStart(8, '0')}:`);
  return Buffer.concat([prefix, bytes]);
}

export function canonicalWritePermitContentBytes(input: WritePermitContentHashInput): Buffer {
  if (input.op !== 'create' && input.op !== 'update') {
    throw new Error('invalid_write_permit_operation');
  }

  const coordinateParts = [input.repo, input.branch, input.path, input.op, input.baseSha].map((field) =>
    withLengthPrefix(textBytes(field)),
  );
  return Buffer.concat([...coordinateParts, withLengthPrefix(contentBytes(input.content))]);
}

export function computeWritePermitContentHash(input: WritePermitContentHashInput): string {
  const canonicalBytes = canonicalWritePermitContentBytes(input);
  return `sha256:${createHash('sha256').update(canonicalBytes).digest('hex')}`;
}
