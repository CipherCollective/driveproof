import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { describe, it, expect } from 'vitest';
import { DriveProofSimulator, DEFAULT_SPEED_LIMIT } from './driveproof.simulator.js';
import { createSignedSpeedState } from './utils/test-data.js';

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
    expect(simulator.getLedger().complianceCount).toEqual(0n);
  });

  it('fails signature verification when signed 112 is tampered to 71 (not policy check)', () => {
    const simulator = new DriveProofSimulator(DEFAULT_SPEED_LIMIT);

    const signed112 = createSignedSpeedState(112n, simulator.attestorSk, simulator.attestorId);
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
