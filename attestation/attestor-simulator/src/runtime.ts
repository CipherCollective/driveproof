import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { JubjubPoint } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { getPublicKey } from './signing.js';

const JUBJUB_ORDER = 6554484396890773809930967563523245729705921265872317281365359162392183254199n;

export type AttestorRuntime = {
  providerId: number;
  providerSk: bigint;
  providerPk: JubjubPoint;
};

/**
 * Resolve the process-owned attestor identity without exposing the secret to
 * the HTTP layer. Vercel and the local Node server use this same boundary.
 */
export function createAttestorRuntimeFromEnv(env: NodeJS.ProcessEnv = process.env): AttestorRuntime {
  setNetworkId(env.NETWORK_ID || 'undeployed');

  const providerId = parseInt(env.PROVIDER_ID || '1', 10);
  const providerSecretHex = env.PROVIDER_SECRET_KEY?.trim();
  if (!providerSecretHex) {
    throw new Error('PROVIDER_SECRET_KEY is missing or empty.');
  }

  const raw = BigInt(`0x${providerSecretHex}`);
  const providerSk = raw % JUBJUB_ORDER;
  return {
    providerId,
    providerSk,
    providerPk: getPublicKey(providerSk),
  };
}
