import type { DemoFixture, TelemetrySample, TripAttestation } from "@driveproof/types";

export const POLICY_ID = "AUTO-SAFE-01";
export const VEHICLE_ID = "IND-01-DP";
export const ATTESTOR_ID = "attestor-demo-01";

const route = [
  [8, 84],
  [30, 84],
  [52, 84],
  [74, 74],
  [96, 62],
  [118, 62],
  [140, 76],
  [162, 96],
  [184, 96],
  [206, 82],
  [228, 62],
  [250, 62],
  [272, 74],
  [294, 94],
  [316, 94],
  [338, 78]
] as const;

const safeSpeeds = [42, 48, 53, 56, 61, 63, 67, 65, 60, 58, 55, 59, 62, 64, 61, 57];
const unsafeSpeeds = [42, 48, 53, 56, 61, 63, 112, 65, 60, 58, 55, 59, 62, 64, 61, 57];
const safeBraking = [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const unsafeBraking = [0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];

/** Demo policy rectangle that contains the safe route but excludes the out-of-geofence fixture. */
export const DEFAULT_POLICY_GEOFENCE = {
  minGridX: 0,
  minGridY: 50,
  maxGridX: 350,
  maxGridY: 100
} as const;

export type AttestorTripId = "safe" | "unsafe" | "out-of-geofence";

function buildSamples(fixture: DemoFixture): TelemetrySample[] {
  const speeds = fixture === "unsafe" || fixture === "tampered" ? unsafeSpeeds : safeSpeeds;
  const braking = fixture === "unsafe" || fixture === "tampered" ? unsafeBraking : safeBraking;

  return route.map(([gridX, gridY], index) => ({
    gridX,
    gridY,
    speed: speeds[index],
    braking: braking[index],
    timeBucket: index + 1
  }));
}

export function createDemoAttestation(fixture: DemoFixture, sequence = 1): TripAttestation {
  return {
    attestorId: ATTESTOR_ID,
    attestationId: `mock-attestation-${fixture}-${String(sequence).padStart(3, "0")}`,
    samples: buildSamples(fixture),
    signature: `mock-signature-${fixture}-v1`,
    fixture
  };
}

export function getFixtureSamples(fixture: DemoFixture): TelemetrySample[] {
  return buildSamples(fixture);
}

export function getAttestorTripSamples(tripId: AttestorTripId): TelemetrySample[] {
  if (tripId === "out-of-geofence") {
    return getFixtureSamples("safe").map((sample, index) =>
      index === 7 ? { ...sample, gridX: 400 } : sample
    );
  }
  return getFixtureSamples(tripId);
}

export function maxSpeed(samples: TelemetrySample[]): number {
  return Math.max(...samples.map((sample) => sample.speed));
}

export function harshBrakingCount(samples: TelemetrySample[]): number {
  return samples.filter((sample) => sample.braking > 0).length;
}

export function fixtureLabel(fixture: DemoFixture): string {
  return fixture === "safe" ? "SAFE TRIP" : fixture === "unsafe" ? "UNSAFE TRIP" : "TAMPERED WITNESS";
}
