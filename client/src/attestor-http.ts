import type { TripAttestation } from './types.js';

export type AttestorProviderInfo = {
  providerId: number;
  publicKey: { x: string; y: string };
};

export type AttestorAttestationResponse = {
  signature: {
    announcement: { x: string; y: string };
    response: string;
  };
  message: {
    tripId: string;
    speed: string;
    driverBinding: string;
    attestationId: string;
  };
};

const DEMO_TRIP_SPEEDS = {
  safe: 67n,
  unsafe: 112n,
} as const;

export const TAMPERED_WITNESS_SPEED = 71n;

export function resolveFixtureTripId(fixture: 'safe' | 'unsafe' | 'tampered'): 'safe' | 'unsafe' {
  return fixture === 'safe' ? 'safe' : 'unsafe';
}

export function resolveFixtureSpeed(fixture: 'safe' | 'unsafe' | 'tampered'): bigint {
  return fixture === 'safe' ? DEMO_TRIP_SPEEDS.safe : DEMO_TRIP_SPEEDS.unsafe;
}

export async function fetchProviderInfo(attestorUrl: string): Promise<AttestorProviderInfo> {
  const res = await fetch(new URL('/provider-info', attestorUrl));
  if (!res.ok) {
    throw new Error(`Attestor provider-info failed (${res.status})`);
  }
  return (await res.json()) as AttestorProviderInfo;
}

export async function fetchTripAttestation(
  attestorUrl: string,
  tripId: 'safe' | 'unsafe',
  driverBinding: bigint,
): Promise<TripAttestation> {
  const res = await fetch(new URL('/attest', attestorUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tripId,
      driverBinding: driverBinding.toString(),
    }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Attestor /attest failed (${res.status})`);
  }

  const payload = (await res.json()) as AttestorAttestationResponse;
  const provider = await fetchProviderInfo(attestorUrl);

  return {
    tripId: payload.message.tripId,
    speed: BigInt(payload.message.speed),
    driverBinding: BigInt(payload.message.driverBinding),
    attestationId: BigInt(payload.message.attestationId),
    attestorId: BigInt(provider.providerId),
    signature: {
      announcement: {
        x: BigInt(payload.signature.announcement.x),
        y: BigInt(payload.signature.announcement.y),
      },
      response: BigInt(payload.signature.response),
    },
  };
}
