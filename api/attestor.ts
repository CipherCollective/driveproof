import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAttestorTripSamples } from '../shared/fixtures/src/index.js';
import { createAttestorRuntimeFromEnv } from '../attestation/attestor-simulator/src/runtime.js';
import { createRequestHandler, type DemoTripResolver } from '../attestation/attestor-simulator/src/server.js';

const resolveDemoTripSamples: DemoTripResolver = (tripId) => {
  if (tripId === 'safe' || tripId === 'unsafe' || tripId === 'out-of-geofence') {
    return getAttestorTripSamples(tripId);
  }
  return undefined;
};

const runtime = createAttestorRuntimeFromEnv();
const handleRequest = createRequestHandler(
  runtime.providerSk,
  runtime.providerId,
  runtime.providerPk,
  resolveDemoTripSamples,
);

/** Vercel's Node function adapter for the existing attestor HTTP handler. */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await handleRequest(req, res);
}
