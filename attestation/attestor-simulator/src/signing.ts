import { ecMulGenerator, type JubjubPoint } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { DriveProof } from 'driveproof-contract';
import * as crypto from 'crypto';

const { pureCircuits } = DriveProof;

const JUBJUB_ORDER = 6554484396890773809930967563523245729705921265872317281365359162392183254199n;
const TWO_248 = 452312848583266388373324160190187140051835877600158453279131187530910662656n;
const FIELD_MODULUS = 52435875175126190479447740508185965837690552500527637822603658699938581184513n;

export type SchnorrSignature = {
  announcement: JubjubPoint;
  response: bigint;
};

function randomScalar(): bigint {
  const bytes = crypto.randomBytes(32);
  const val = BigInt('0x' + bytes.toString('hex'));
  return val % JUBJUB_ORDER;
}

export function generateKeyPair(): { sk: bigint; pk: JubjubPoint } {
  const sk = randomScalar();
  const pk = ecMulGenerator(sk);
  return { sk, pk };
}

export function getPublicKey(sk: bigint): JubjubPoint {
  return ecMulGenerator(((sk % JUBJUB_ORDER) + JUBJUB_ORDER) % JUBJUB_ORDER);
}

export function generateAttestationId(): bigint {
  const bytes = crypto.randomBytes(32);
  const val = BigInt('0x' + bytes.toString('hex'));
  return val % FIELD_MODULUS;
}

export function sign(sk: bigint, msg: bigint[]): SchnorrSignature {
  sk = ((sk % JUBJUB_ORDER) + JUBJUB_ORDER) % JUBJUB_ORDER;
  const pk = ecMulGenerator(sk);
  const k = randomScalar();
  const R = ecMulGenerator(k);
  const cFull = pureCircuits.schnorrChallenge(R.x, R.y, pk.x, pk.y, msg);
  const c = cFull % TWO_248;
  const s = ((k + c * sk) % JUBJUB_ORDER + JUBJUB_ORDER) % JUBJUB_ORDER;
  return { announcement: R, response: s };
}

/** Signs [speed, driverBinding, attestationId]. */
export function signTripAttestation(
  sk: bigint,
  speed: number,
  driverBinding: bigint,
  attestationId: bigint,
): SchnorrSignature {
  return sign(sk, [BigInt(speed), driverBinding, attestationId]);
}

export function computeDriverBinding(driverSecret: Uint8Array): bigint {
  return pureCircuits.deriveDriverBinding(driverSecret);
}
