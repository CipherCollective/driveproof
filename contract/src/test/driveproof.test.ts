import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { describe, it, expect } from 'vitest';
import { DriveProofSimulator, DEFAULT_SPEED_LIMIT } from './driveproof.simulator.js';
import { createSignedSpeedState, generateDriverSecret } from './utils/test-data.js';

setNetworkId('undeployed');

describe('DriveProof acceptance — subject binding + replay nullifier', () => {
  it('proves compliance for a fresh safe attestation', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT);
    simulator.setSignedSpeedState(67n);

    simulator.proveCompliance();

    expect(simulator.getLedger().complianceCount).toEqual(1n);
  });

  it('rejects replay of the same attestation on this contract', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT);
    const attestationId = 42424242n;
    simulator.setSignedSpeedState(67n, simulator.driverSecretKey, attestationId);

    simulator.proveCompliance();

    let thrown: Error | undefined;
    try {
      simulator.proveCompliance();
    } catch (err) {
      thrown = err as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown!.message).toContain('Attestation already used');
    expect(simulator.getLedger().complianceCount).toEqual(1n);
  });

  it('rejects wrong driver binding (integrity, not replay)', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT);
    const subjectA = simulator.driverSecretKey;
    const subjectB = generateDriverSecret();

    const attestationForA = createSignedSpeedState(
      67n,
      simulator.attestorSk,
      subjectA,
      simulator.attestorId,
    );

    simulator.setPrivateState({
      ...attestationForA,
      driverSecretKey: subjectB,
    });

    let thrown: Error | undefined;
    try {
      simulator.proveCompliance();
    } catch (err) {
      thrown = err as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown!.message).toContain('Invalid attestation signature');
    expect(simulator.getLedger().complianceCount).toEqual(0n);
    expect(simulator.nullifierUsed(attestationForA.attestationId)).toBe(false);
  });

  it('rejects unsafe speed with policy failure and does not consume nullifier', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT);
    const attestationId = 77777777n;
    simulator.setSignedSpeedState(112n, simulator.driverSecretKey, attestationId);

    let thrown: Error | undefined;
    try {
      simulator.proveCompliance();
    } catch (err) {
      thrown = err as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown!.message).toContain('Speed exceeds policy limit');
    expect(thrown!.message).not.toContain('Invalid attestation signature');
    expect(thrown!.message).not.toContain('Attestation already used');
    expect(simulator.getLedger().complianceCount).toEqual(0n);
    expect(simulator.nullifierUsed(attestationId)).toBe(false);
  });

  it('rejects tampered witness with integrity failure and does not consume nullifier', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT);
    const attestationId = 88888888n;

    const signed112 = createSignedSpeedState(
      112n,
      simulator.attestorSk,
      simulator.driverSecretKey,
      simulator.attestorId,
      attestationId,
    );
    simulator.setPrivateState({
      ...signed112,
      speed: 71n,
    });

    let thrown: Error | undefined;
    try {
      simulator.proveCompliance();
    } catch (err) {
      thrown = err as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown!.message).toContain('Invalid attestation signature');
    expect(thrown!.message).not.toContain('Speed exceeds policy limit');
    expect(thrown!.message).not.toContain('Attestation already used');
    expect(simulator.getLedger().complianceCount).toEqual(0n);
    expect(simulator.nullifierUsed(attestationId)).toBe(false);
  });

  it('allows a fresh safe proof after failed unsafe and tampered attempts', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT);
    const attestationId = 99999999n;
    simulator.setSignedSpeedState(67n, simulator.driverSecretKey, attestationId);

    const unsafe = createSignedSpeedState(
      112n,
      simulator.attestorSk,
      simulator.driverSecretKey,
      simulator.attestorId,
      11111111n,
    );
    simulator.setPrivateState(unsafe);
    try {
      simulator.proveCompliance();
    } catch {
      // expected policy rejection
    }

    const tampered = createSignedSpeedState(
      112n,
      simulator.attestorSk,
      simulator.driverSecretKey,
      simulator.attestorId,
      22222222n,
    );
    simulator.setPrivateState({ ...tampered, speed: 71n });
    try {
      simulator.proveCompliance();
    } catch {
      // expected integrity rejection
    }

    simulator.setSignedSpeedState(67n, simulator.driverSecretKey, attestationId);
    simulator.proveCompliance();

    expect(simulator.getLedger().complianceCount).toEqual(1n);
    expect(simulator.nullifierUsed(attestationId)).toBe(true);
    expect(simulator.nullifierUsed(11111111n)).toBe(false);
    expect(simulator.nullifierUsed(22222222n)).toBe(false);
  });

  it('registers attestor in constructor and looks up public key', () => {
    const simulator = new DriveProofSimulator();
    const ledger = simulator.getLedger();

    expect(ledger.attestors.member(1n)).toBeTruthy();
    const pk = ledger.attestors.lookup(1n);
    expect(pk.x).toEqual(simulator.attestorPk.x);
    expect(pk.y).toEqual(simulator.attestorPk.y);
  });
});
