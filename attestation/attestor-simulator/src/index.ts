/**
 * DriveProof Vehicle Attestor Simulator (hackathon prototype).
 *
 * Honest claim: DriveProof proves that telemetry issued by an authorized
 * attestor satisfies an insurer's policy without revealing the telemetry.
 * This simulator stands in for a production OEM telematics control unit (TCU),
 * secure vehicle computer, trusted OBD device, or other hardware-backed
 * telemetry provider  it does not prove physical GPS provenance.
 */
import 'dotenv/config';
import { createAttestorRuntimeFromEnv } from './runtime.js';
import { createServer } from './server.js';
import { resolveDemoTripSamples } from './trips.js';

const PORT = parseInt(process.env.PORT || '4000', 10);
let runtime;
try {
  runtime = createAttestorRuntimeFromEnv();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Attestor configuration failed';
  console.error(`FATAL: ${message} Copy .env.example to .env and set a persistent key  never regenerate on restart.`);
  process.exit(1);
}

console.log(`Provider ID: ${runtime.providerId}`);
console.log(`Provider public key:`);
console.log(`  x: ${runtime.providerPk.x}`);
console.log(`  y: ${runtime.providerPk.y}`);
console.log(`Register this attestor on-chain with: registerAttestor(${runtime.providerId}, {x: ${runtime.providerPk.x}n, y: ${runtime.providerPk.y}n})`);

const server = createServer(runtime.providerSk, runtime.providerId, runtime.providerPk, resolveDemoTripSamples);
server.listen(PORT, () => {
  console.log(`Attestor simulator listening on port ${PORT}`);
});
