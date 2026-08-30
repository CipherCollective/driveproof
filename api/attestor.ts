import type { IncomingMessage, ServerResponse } from 'node:http';
import { createAttestorRuntimeFromEnv } from '../attestation/attestor-simulator/src/runtime.js';
import { createRequestHandler } from '../attestation/attestor-simulator/src/server.js';

const runtime = createAttestorRuntimeFromEnv();
const handleRequest = createRequestHandler(runtime.providerSk, runtime.providerId, runtime.providerPk);

/** Vercel's Node function adapter for the existing attestor HTTP handler. */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await handleRequest(req, res);
}
