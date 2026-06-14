import type { IncomingMessage, ServerResponse } from 'node:http';

const SANDBOX_WRITE_PATH = '/probe/sandbox-write';

export async function handleSandboxWriteRequest(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://bluepilot-builder.local');

  if (url.pathname !== SANDBOX_WRITE_PATH) {
    return false;
  }

  writeJson(response, 410, {
    error: 'sandbox_write_retired',
    detail: 'Permitless sandbox writes are retired. Use a policy-issued one-shot permit through the SmartPush permit path.',
    futurePath: 'smartPush_writePermit',
  });
  return true;
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(payload)}\n`);
}
