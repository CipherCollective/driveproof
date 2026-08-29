import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { describe, it, expect } from 'vitest';
import { DriveProofSimulator, DEFAULT_SPEED_LIMIT, DEFAULT_POLICY_ID } from './driveproof.simulator.js';
import { createSignedSpeedState, generateDriverSecret } from './utils/test-data.js';

setNetworkId('undeployed');

describe('DriveProof Phase 1 — single signed speed value', () => {
  it('proves compliance for signed speed 67 under an 80 km/h limit', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT);
    simulator.setSignedSpeedState(67n);

    simulator.proveCompliance();

    expect(simulator.getLedger().complianceCount).toEqual(1n);
  });

  it('fails policy check for authentic signed speed 112 (not signature verification)', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT);
    simulator.setSignedSpeedState(112n);

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
  });

  it('fails signature verification when signed 112 is tampered to 71 (not policy check)', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT);

    const signed112 = createSignedSpeedState(
      112n,
      simulator.attestorSk,
      simulator.driverSecretKey,
      simulator.attestorId,
    );
    simulator.circuitContext = {
      ...simulator.circuitContext,
      currentPrivateState: {
        ...signed112,
        speed: 71n,
      },
    };

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

describe('DriveProof Phase 2 — subject binding', () => {
  it('subject B cannot prove subject A possession-bound attestation', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT);
    const subjectA = simulator.driverSecretKey;
    const subjectB = generateDriverSecret();

    const attestationForA = createSignedSpeedState(
      67n,
      simulator.attestorSk,
      subjectA,
      simulator.attestorId,
    );

    simulator.circuitContext = {
      ...simulator.circuitContext,
      currentPrivateState: {
        ...attestationForA,
        driverSecretKey: subjectB,
      },
    };

    let thrown: Error | undefined;
    try {
      simulator.proveCompliance();
    } catch (err) {
      thrown = err as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown!.message).toContain('Invalid attestation signature');
    expect(simulator.getLedger().complianceCount).toEqual(0n);
  });

  it('subject A can prove their own possession-bound attestation', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT);
    simulator.setSignedSpeedState(67n, simulator.driverSecretKey);

    simulator.proveCompliance();

    expect(simulator.getLedger().complianceCount).toEqual(1n);
  });
});

describe('DriveProof Phase 3 — replay nullifier', () => {
  it('first use of an attestation against a policy succeeds', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT);
    const attestationId = 42424242n;
    simulator.setSignedSpeedState(67n, simulator.driverSecretKey, attestationId);

    simulator.proveCompliance(DEFAULT_POLICY_ID);

    expect(simulator.getLedger().complianceCount).toEqual(1n);
  });

  it('exact replay of the same attestation against the same policy fails at nullifier check', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT);
    const attestationId = 42424242n;
    simulator.setSignedSpeedState(67n, simulator.driverSecretKey, attestationId);

    simulator.proveCompliance(DEFAULT_POLICY_ID);

    let thrown: Error | undefined;
    try {
      simulator.proveCompliance(DEFAULT_POLICY_ID);
    } catch (err) {
      thrown = err as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown!.message).toContain('Attestation already used for this policy');
    expect(thrown!.message).not.toContain('Invalid attestation signature');
    expect(thrown!.message).not.toContain('Speed exceeds policy limit');
    expect(simulator.getLedger().complianceCount).toEqual(1n);
  });

  it('same attestation can be used against a different policyId', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT);
    const attestationId = 99999999n;
    simulator.setSignedSpeedState(67n, simulator.driverSecretKey, attestationId);

    simulator.proveCompliance(1n);
    simulator.proveCompliance(2n);

    expect(simulator.getLedger().complianceCount).toEqual(2n);
  });
});
