import { describe, it, expect } from 'vitest';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { ecAdd, ecMul, ecMulGenerator } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { getFixtureSamples } from '@driveproof/fixtures';
import { DriveProof, computeDriverBinding, computeTripCommitment, generateDriverSecret } from 'driveproof-contract';
import { generateKeyPair, sign, signTripSamples } from '../src/signing.js';

const { pureCircuits } = DriveProof;

setNetworkId('undeployed');

const JUBJUB_ORDER = 6554484396890773809930967563523245729705921265872317281365359162392183254199n;
const TWO_248 = 452312848583266388373324160190187140051835877600158453279131187530910662656n;

describe('Attestor Schnorr signing', () => {
  it('signTripSamples produces signatures verifiable against contract pureCircuits', () => {
    const { sk, pk } = generateKeyPair();
    const driverSecret = generateDriverSecret();
    const driverBinding = computeDriverBinding(driverSecret);
    const attestationId = 12345n;
    const samples = getFixtureSamples('safe');
    const { signature, salt, tripCommitment } = signTripSamples(sk, samples, driverBinding, attestationId);
    const msg = [tripCommitment];

    const cFull = pureCircuits.schnorrChallenge(signature.announcement.x, signature.announcement.y, pk.x, pk.y, msg);
    const c = cFull % TWO_248;

    const lhs = ecMulGenerator(signature.response);
    const rhs = ecAdd(signature.announcement, ecMul(pk, c));

    expect(lhs.x).toEqual(rhs.x);
    expect(lhs.y).toEqual(rhs.y);
    expect(tripCommitment).toEqual(
      computeTripCommitment(
        attestationId,
        driverBinding,
        salt,
        samples.map((sample) => ({
          gridX: BigInt(sample.gridX),
          gridY: BigInt(sample.gridY),
          speed: BigInt(sample.speed),
          braking: BigInt(sample.braking),
          timeBucket: BigInt(sample.timeBucket),
        })),
      ),
    );
  });

  it('produces different signatures for different driver bindings', () => {
    const { sk } = generateKeyPair();
    const bindingA = computeDriverBinding(generateDriverSecret());
    const bindingB = computeDriverBinding(generateDriverSecret());
    const attestationId = 99n;
    const samples = getFixtureSamples('safe');
    const sigA = signTripSamples(sk, samples, bindingA, attestationId);
    const sigB = signTripSamples(sk, samples, bindingB, attestationId);
    expect(sigA.signature.response).not.toEqual(sigB.signature.response);
  });

  it('signature response stays within Jubjub scalar field', () => {
    const { sk } = generateKeyPair();
    const driverBinding = computeDriverBinding(generateDriverSecret());
    for (let i = 0; i < 5; i++) {
      const sig = sign(sk, [BigInt(i + 1)]);
      expect(sig.response).toBeGreaterThanOrEqual(0n);
      expect(sig.response).toBeLessThan(JUBJUB_ORDER);
    }
  });
});
