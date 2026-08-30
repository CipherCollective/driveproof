import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { describe, it, expect } from 'vitest';
import { getFixtureSamples, getAttestorTripSamples } from '@driveproof/fixtures';
import { DriveProofSimulator, DEFAULT_SPEED_LIMIT, DEFAULT_BRAKING_LIMIT } from './driveproof.simulator.js';
import { createSignedTripState, generateDriverSecret } from './utils/test-data.js';

setNetworkId('undeployed');

describe('DriveProof acceptance — 16-sample trip commitment', () => {
  it('proves compliance for a fresh safe attestation', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT, DEFAULT_BRAKING_LIMIT);
    simulator.setSignedTripState('safe');

    simulator.proveCompliance();

    expect(simulator.getLedger().complianceCount).toEqual(1n);
  });

  it('rejects replay of the same attestation on this contract', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT, DEFAULT_BRAKING_LIMIT);
    const attestationId = 42424242n;
    simulator.setSignedTripState('safe', simulator.driverSecretKey, attestationId);

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
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT, DEFAULT_BRAKING_LIMIT);
    const subjectA = simulator.driverSecretKey;
    const subjectB = generateDriverSecret();

    const attestationForA = createSignedTripState(
      getFixtureSamples('safe'),
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
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT, DEFAULT_BRAKING_LIMIT);
    const attestationId = 77777777n;
    simulator.setSignedTripState('unsafe', simulator.driverSecretKey, attestationId);

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

  it('rejects excessive harsh braking without consuming nullifier', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT, DEFAULT_BRAKING_LIMIT);
    const attestationId = 55555555n;
    const samples = getFixtureSamples('safe').map((sample, index) =>
      index < 3 ? { ...sample, braking: 1 } : sample,
    );
    simulator.setPrivateState(
      createSignedTripState(
        samples,
        simulator.attestorSk,
        simulator.driverSecretKey,
        simulator.attestorId,
        attestationId,
      ),
    );

    let thrown: Error | undefined;
    try {
      simulator.proveCompliance();
    } catch (err) {
      thrown = err as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown!.message).toContain('Harsh braking exceeds policy limit');
    expect(simulator.getLedger().complianceCount).toEqual(0n);
    expect(simulator.nullifierUsed(attestationId)).toBe(false);
  });

  it('rejects out-of-geofence samples without consuming nullifier', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT, DEFAULT_BRAKING_LIMIT);
    const attestationId = 66666666n;
    simulator.setSignedTripState('out-of-geofence', simulator.driverSecretKey, attestationId);

    let thrown: Error | undefined;
    try {
      simulator.proveCompliance();
    } catch (err) {
      thrown = err as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown!.message).toContain('Sample outside policy geofence');
    expect(thrown!.message).not.toContain('Invalid attestation signature');
    expect(simulator.getLedger().complianceCount).toEqual(0n);
    expect(simulator.nullifierUsed(attestationId)).toBe(false);
  });

  it('rejects tampered witness with integrity failure and does not consume nullifier', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT, DEFAULT_BRAKING_LIMIT);
    const attestationId = 88888888n;

    const signedUnsafe = createSignedTripState(
      getFixtureSamples('unsafe'),
      simulator.attestorSk,
      simulator.driverSecretKey,
      simulator.attestorId,
      attestationId,
    );
    const tamperedSamples = signedUnsafe.samples.map((sample, index) =>
      index === 6 ? { ...sample, speed: 71n } : sample,
    );
    simulator.setPrivateState({
      ...signedUnsafe,
      samples: tamperedSamples,
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

  it('rejects coordinate tampering after signing as an integrity failure', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT, DEFAULT_BRAKING_LIMIT);
    const attestationId = 88888889n;
    const signedSafe = createSignedTripState(
      getFixtureSamples('safe'),
      simulator.attestorSk,
      simulator.driverSecretKey,
      simulator.attestorId,
      attestationId,
    );
    const tamperedSamples = signedSafe.samples.map((sample, index) =>
      index === 6 ? { ...sample, gridX: sample.gridX + 1n } : sample,
    );
    simulator.setPrivateState({
      ...signedSafe,
      samples: tamperedSamples,
    });

    let thrown: Error | undefined;
    try {
      simulator.proveCompliance();
    } catch (err) {
      thrown = err as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown!.message).toContain('Invalid attestation signature');
    expect(thrown!.message).not.toContain('Sample outside policy geofence');
    expect(simulator.getLedger().complianceCount).toEqual(0n);
    expect(simulator.nullifierUsed(attestationId)).toBe(false);
  });

  it('allows a fresh safe proof after failed unsafe and tampered attempts', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT, DEFAULT_BRAKING_LIMIT);
    const attestationId = 99999999n;
    simulator.setSignedTripState('safe', simulator.driverSecretKey, attestationId);

    const unsafe = createSignedTripState(
      getFixtureSamples('unsafe'),
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

    const tampered = createSignedTripState(
      getFixtureSamples('unsafe'),
      simulator.attestorSk,
      simulator.driverSecretKey,
      simulator.attestorId,
      22222222n,
    );
    const tamperedSamples = tampered.samples.map((sample, index) =>
      index === 6 ? { ...sample, speed: 71n } : sample,
    );
    simulator.setPrivateState({ ...tampered, samples: tamperedSamples });
    try {
      simulator.proveCompliance();
    } catch {
      // expected integrity rejection
    }

    simulator.setSignedTripState('safe', simulator.driverSecretKey, attestationId);
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
