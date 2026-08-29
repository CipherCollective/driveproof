import { describe, it, expect } from 'vitest';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { ecAdd, ecMul, ecMulGenerator } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { DriveProof } from 'driveproof-contract';
import * as crypto from 'crypto';
import { generateKeyPair, sign, signTripAttestation, computeDriverBinding } from '../src/signing.js';

const { pureCircuits } = DriveProof;

setNetworkId('undeployed');

const JUBJUB_ORDER = 6554484396890773809930967563523245729705921265872317281365359162392183254199n;
const TWO_248 = 452312848583266388373324160190187140051835877600158453279131187530910662656n;

describe('Attestor Schnorr signing', () => {
  it('signTripAttestation produces signatures verifiable against contract pureCircuits', () => {
    const { sk, pk } = generateKeyPair();
    const driverSecret = new Uint8Array(crypto.randomBytes(32));
    const driverBinding = computeDriverBinding(driverSecret);
    const msg = [67n, driverBinding];
    const sig = signTripAttestation(sk, 67, driverBinding);

    const cFull = pureCircuits.schnorrChallenge(sig.announcement.x, sig.announcement.y, pk.x, pk.y, msg);
    const c = cFull % TWO_248;

    const lhs = ecMulGenerator(sig.response);
    const rhs = ecAdd(sig.announcement, ecMul(pk, c));

    expect(lhs.x).toEqual(rhs.x);
    expect(lhs.y).toEqual(rhs.y);
  });

  it('produces different signatures for different driver bindings', () => {
    const { sk } = generateKeyPair();
    const bindingA = computeDriverBinding(new Uint8Array(crypto.randomBytes(32)));
    const bindingB = computeDriverBinding(new Uint8Array(crypto.randomBytes(32)));
    const sigA = signTripAttestation(sk, 67, bindingA);
    const sigB = signTripAttestation(sk, 67, bindingB);
    expect(sigA.response).not.toEqual(sigB.response);
  });

  it('signature response stays within Jubjub scalar field', () => {
    const { sk } = generateKeyPair();
    const binding = computeDriverBinding(new Uint8Array(crypto.randomBytes(32)));
    for (let i = 0; i < 5; i++) {
      const sig = sign(sk, [BigInt(67 + i), binding]);
      expect(sig.response).toBeGreaterThanOrEqual(0n);
      expect(sig.response).toBeLessThan(JUBJUB_ORDER);
    }
  });
});
