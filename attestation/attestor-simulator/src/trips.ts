/** Server-owned demo trip fixtures — speed is never taken from the client. */
export type DemoTripId = 'safe' | 'unsafe';

export const DEMO_TRIP_SPEEDS: Record<DemoTripId, number> = {
  safe: 67,
  unsafe: 112,
};

export function resolveDemoTripSpeed(tripId: string): number | undefined {
  if (tripId === 'safe' || tripId === 'unsafe') {
    return DEMO_TRIP_SPEEDS[tripId];
  }
  return undefined;
}
