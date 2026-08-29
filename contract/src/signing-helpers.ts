import { pureCircuits, type Schnorr_SchnorrSignature } from './managed/driveproof/contract/index.js';
import { ecMulGenerator, type JubjubPoint } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import type { DriveProofPrivateState } from './witnesses.js';
import * as crypto from 'crypto';

const JUBJUB_ORDER = 6554484396890773809930967563523245729705921265872317281365359162392183254199n;
const TWO_248 = 452312848583266388373324160190187140051835877600158453279131187530910662656n;
const FIELD_MODULUS = 52435875175126190479447740508185965837690552500527637822603658699938581184513n;

export const DEFAULT_POLICY_ID = 1n;
export const DEFAULT_SPEED_LIMIT = 80n;

function randomScalar(): bigint {
  const bytes = crypto.randomBytes(32);
  const val = BigInt('0x' + bytes.toString('hex'));
  return val % JUBJUB_ORDER;
}

export function generateAttestorKeyPair(): { sk: bigint; pk: JubjubPoint } {
  const sk = randomScalar();
  const pk = ecMulGenerator(sk);
  return { sk, pk };
}

export function generateDriverSecret(): Uint8Array {
  return new Uint8Array(crypto.randomBytes(32));
}

export function generateAttestationId(): bigint {
  const bytes = crypto.randomBytes(32);
  const val = BigInt('0x' + bytes.toString('hex'));
  return val % FIELD_MODULUS;
}

export function computeDriverBinding(driverSecret: Uint8Array): bigint {
  return pureCircuits.deriveDriverBinding(driverSecret);
}

export function computeNullifier(attestationId: bigint, policyId: bigint = DEFAULT_POLICY_ID): bigint {
  return pureCircuits.deriveNullifier(attestationId, policyId);
}

export function schnorrSign(sk: bigint, msg: bigint[]): Schnorr_SchnorrSignature {
  const pk = ecMulGenerator(sk);
  const k = randomScalar();
  const R = ecMulGenerator(k);
  const cFull = pureCircuits.schnorrChallenge(R.x, R.y, pk.x, pk.y, msg);
  const c = cFull % TWO_248;
  const s = (((k + c * sk) % JUBJUB_ORDER) + JUBJUB_ORDER) % JUBJUB_ORDER;
  return { announcement: R, response: s };
}

export function createSignedSpeedState(
  speed: bigint,
  attestorSk: bigint,
  driverSecret: Uint8Array,
  attestorId: bigint = 1n,
  attestationId: bigint = generateAttestationId(),
): DriveProofPrivateState {
  const driverBinding = computeDriverBinding(driverSecret);
  const msg: bigint[] = [speed, driverBinding, attestationId];
  const signature = schnorrSign(attestorSk, msg);
  return {
    speed,
    attestationId,
    attestationSignature: signature,
    attestorId,
    driverSecretKey: driverSecret,
  };
}
