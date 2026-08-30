import { getFixtureSamples, maxSpeed, harshBrakingCount } from '@driveproof/fixtures';
import type { TelemetrySampleInput } from 'driveproof-contract';

/** Server-owned demo trip fixtures — telemetry is never taken from the client. */
export type DemoTripId = 'safe' | 'unsafe';

export function resolveDemoTripSamples(tripId: string): TelemetrySampleInput[] | undefined {
  if (tripId === 'safe' || tripId === 'unsafe') {
    return getFixtureSamples(tripId);
  }
  return undefined;
}

export function describeDemoTrip(tripId: DemoTripId) {
  const samples = getFixtureSamples(tripId);
  return {
    samples,
    maxSpeed: maxSpeed(samples),
    harshBrakingCount: harshBrakingCount(samples),
  };
}
