import type { DriveProofPrivateState } from "driveproof-contract";

export type AttestorTripId = "safe" | "unsafe";

export type AttestorHealthStatus =
  | { status: "ready"; url: string; providerId?: number }
  | { status: "unavailable"; url: string; message: string };

type AttestorResponse = {
  signature: {
    announcement: { x: string; y: string };
    response: string;
  };
  message: {
    tripId: string;
    speed: string;
  };
};

type ProviderInfoResponse = {
  providerId: number;
  publicKey: { x: string; y: string };
};

export class AttestorClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttestorClientError";
  }
}

function asBigInt(value: unknown, label: string): bigint {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new AttestorClientError(`Attestor returned an invalid ${label}.`);
  }

  try {
    return BigInt(value);
  } catch {
    throw new AttestorClientError(`Attestor returned an invalid ${label}.`);
  }
}

async function readJson<T>(response: Response, endpoint: string): Promise<T> {
  if (!response.ok) {
    throw new AttestorClientError(`Attestor ${endpoint} returned HTTP ${response.status}.`);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new AttestorClientError(`Attestor ${endpoint} returned invalid JSON.`);
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  try {
    return new URL(baseUrl).toString().replace(/\/$/, "");
  } catch {
    throw new AttestorClientError(`Attestor URL is invalid: ${baseUrl}`);
  }
}

/**
 * Read-only liveness check for the local attestor. It does not request an
 * attestation, sign data, or expose provider key material.
 */
export async function checkAttestorHealth(
  baseUrl: string,
  fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis)
): Promise<AttestorHealthStatus> {
  let url: string;
  try {
    url = normalizeBaseUrl(baseUrl);
  } catch (error) {
    return {
      status: "unavailable",
      url: baseUrl,
      message: error instanceof Error ? error.message : String(error)
    };
  }

  try {
    const response = await fetchImpl(`${url}/health`);
    if (!response.ok) {
      return { status: "unavailable", url, message: `Attestor /health returned HTTP ${response.status}.` };
    }

    const body = (await response.json()) as { status?: unknown; providerId?: unknown };
    if (body.status !== "ok") {
      return { status: "unavailable", url, message: "Attestor /health returned an invalid status." };
    }

    return {
      status: "ready",
      url,
      ...(typeof body.providerId === "number" ? { providerId: body.providerId } : {})
    };
  } catch (error) {
    return {
      status: "unavailable",
      url,
      message: `Attestor is unavailable at ${url}: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Requests issuer-owned telemetry and converts it into the generated contract
 * private-state shape. The browser supplies only a demo trip identifier; it
 * never supplies or overrides the signed speed.
 */
export async function requestAttestorPrivateState(
  baseUrl: string,
  tripId: AttestorTripId,
  fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis)
): Promise<DriveProofPrivateState> {
  const url = normalizeBaseUrl(baseUrl);
  const providerInfo = await readJson<ProviderInfoResponse>(
    await fetchImpl(`${url}/provider-info`),
    "/provider-info"
  );
  const attestation = await readJson<AttestorResponse>(
    await fetchImpl(`${url}/attest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId })
    }),
    "/attest"
  );

  if (attestation.message.tripId !== tripId) {
    throw new AttestorClientError("Attestor returned a different trip identifier.");
  }

  return {
    speed: asBigInt(attestation.message.speed, "speed"),
    attestationSignature: {
      announcement: {
        x: asBigInt(attestation.signature.announcement.x, "announcement x"),
        y: asBigInt(attestation.signature.announcement.y, "announcement y")
      },
      response: asBigInt(attestation.signature.response, "signature response")
    },
    attestorId: BigInt(providerInfo.providerId)
  };
}
