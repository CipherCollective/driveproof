import { getAttestorTripSamples } from '@driveproof/fixtures';
import type { TelemetrySampleInput } from 'driveproof-contract';

/** Server-owned demo trip fixtures — telemetry is never taken from the client. */
export type DemoTripId = 'safe' | 'unsafe' | 'out-of-geofence';

export function resolveDemoTripSamples(tripId: string): TelemetrySampleInput[] | undefined {
  if (tripId === 'safe' || tripId === 'unsafe' || tripId === 'out-of-geofence') {
    return getAttestorTripSamples(tripId);
  }
  return undefined;
}
