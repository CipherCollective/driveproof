import { describe, it, expect } from 'vitest';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { ecAdd, ecMul, ecMulGenerator } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { DriveProof } from 'driveproof-contract';
import { generateKeyPair, sign, signSpeed } from '../src/signing.js';

const { pureCircuits } = DriveProof;

setNetworkId('undeployed');

const JUBJUB_ORDER = 6554484396890773809930967563523245729705921265872317281365359162392183254199n;
const TWO_248 = 452312848583266388373324160190187140051835877600158453279131187530910662656n;

describe('Attestor Schnorr signing', () => {
  it('signSpeed produces signatures verifiable against contract pureCircuits', () => {
    const { sk, pk } = generateKeyPair();
    const msg = [67n];
    const sig = signSpeed(sk, 67);

    const cFull = pureCircuits.schnorrChallenge(sig.announcement.x, sig.announcement.y, pk.x, pk.y, msg);
    const c = cFull % TWO_248;

    const lhs = ecMulGenerator(sig.response);
    const rhs = ecAdd(sig.announcement, ecMul(pk, c));

    expect(lhs.x).toEqual(rhs.x);
    expect(lhs.y).toEqual(rhs.y);
  });

  it('produces different signatures for different speeds', () => {
    const { sk } = generateKeyPair();
    const sig67 = signSpeed(sk, 67);
    const sig112 = signSpeed(sk, 112);
    expect(sig67.response).not.toEqual(sig112.response);
  });

  it('signature response stays within Jubjub scalar field', () => {
    const { sk } = generateKeyPair();
    for (let i = 0; i < 5; i++) {
      const sig = sign(sk, [BigInt(67 + i)]);
      expect(sig.response).toBeGreaterThanOrEqual(0n);
      expect(sig.response).toBeLessThan(JUBJUB_ORDER);
    }
  });
});
