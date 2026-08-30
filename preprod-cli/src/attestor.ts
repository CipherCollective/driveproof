import { computeDriverBinding, generateDriverSecret } from "driveproof-contract";
import type { DriveProofPrivateState } from "driveproof-contract";

export type AttestorTripId = "safe" | "unsafe";

type AttestorResponse = {
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

type ProviderInfoResponse = {
  providerId: number;
};

function asBigInt(value: unknown, label: string): bigint {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error(`Attestor returned an invalid ${label}.`);
  }
  try {
    return BigInt(value);
  } catch {
    throw new Error(`Attestor returned an invalid ${label}.`);
  }
}

async function readJson<T>(response: Response, endpoint: string): Promise<T> {
  if (!response.ok) throw new Error(`Attestor ${endpoint} returned HTTP ${response.status}.`);
  try {
    return await response.json() as T;
  } catch {
    throw new Error(`Attestor ${endpoint} returned invalid JSON.`);
  }
}

export async function requestAttestorPrivateState(
  baseUrl: string,
  tripId: AttestorTripId,
  driverSecretKey: Uint8Array = generateDriverSecret()
): Promise<DriveProofPrivateState> {
  const url = new URL(baseUrl).toString().replace(/\/$/, "");
  const driverBinding = computeDriverBinding(driverSecretKey);
  const providerInfo = await readJson<ProviderInfoResponse>(
    await fetch(`${url}/provider-info`),
    "/provider-info"
  );
  const attestation = await readJson<AttestorResponse>(
    await fetch(`${url}/attest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripId,
        driverBinding: driverBinding.toString()
      })
    }),
    "/attest"
  );
  if (attestation.message.tripId !== tripId) {
    throw new Error("Attestor returned a different trip identifier.");
  }

  return {
    speed: asBigInt(attestation.message.speed, "speed"),
    attestationId: asBigInt(attestation.message.attestationId, "attestationId"),
    attestationSignature: {
      announcement: {
        x: asBigInt(attestation.signature.announcement.x, "announcement x"),
        y: asBigInt(attestation.signature.announcement.y, "announcement y")
      },
      response: asBigInt(attestation.signature.response, "signature response")
    },
    attestorId: BigInt(providerInfo.providerId),
    driverSecretKey
  };
}
