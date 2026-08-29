import { type DriveProofPrivateState } from '../../witnesses.js';
import { pureCircuits, type Schnorr_SchnorrSignature } from '../../managed/driveproof/contract/index.js';
import { ecMulGenerator, type JubjubPoint } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import * as crypto from 'crypto';

const JUBJUB_ORDER = 6554484396890773809930967563523245729705921265872317281365359162392183254199n;
const TWO_248 = 452312848583266388373324160190187140051835877600158453279131187530910662656n;

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
  attestorId: bigint = 1n,
): DriveProofPrivateState {
  const msg: bigint[] = [speed];
  const signature = schnorrSign(attestorSk, msg);
  return {
    speed,
    attestationSignature: signature,
    attestorId,
  };
}
