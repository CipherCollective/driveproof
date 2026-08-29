/**
 * DriveProof Vehicle Attestor Simulator (hackathon prototype).
 *
 * Honest claim: DriveProof proves that telemetry issued by an authorized
 * attestor satisfies an insurer's policy without revealing the telemetry.
 * This simulator stands in for a production OEM telematics control unit (TCU),
 * secure vehicle computer, trusted OBD device, or other hardware-backed
 * telemetry provider — it does not prove physical GPS provenance.
 */
import 'dotenv/config';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { getPublicKey } from './signing.js';
import { createServer } from './server.js';

setNetworkId(process.env.NETWORK_ID || 'undeployed');

const PORT = parseInt(process.env.PORT || '4000', 10);
const PROVIDER_ID = parseInt(process.env.PROVIDER_ID || '1', 10);

const JUBJUB_ORDER = 6554484396890773809930967563523245729705921265872317281365359162392183254199n;

const providerSecretHex = process.env.PROVIDER_SECRET_KEY?.trim();
if (!providerSecretHex) {
  console.error(
    'FATAL: PROVIDER_SECRET_KEY is missing or empty. Copy .env.example to .env and set a persistent key — never regenerate on restart.',
  );
  process.exit(1);
}

const raw = BigInt('0x' + providerSecretHex);
const providerSk = raw % JUBJUB_ORDER;
console.log('Loaded provider secret key from environment');

const pk = getPublicKey(providerSk);
console.log(`Provider ID: ${PROVIDER_ID}`);
console.log(`Provider public key:`);
console.log(`  x: ${pk.x}`);
console.log(`  y: ${pk.y}`);
console.log(`Register this attestor on-chain with: registerAttestor(${PROVIDER_ID}, {x: ${pk.x}n, y: ${pk.y}n})`);

const server = createServer(providerSk, PROVIDER_ID, pk);
server.listen(PORT, () => {
  console.log(`Attestor simulator listening on port ${PORT}`);
});
