import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { describe, it, expect } from 'vitest';
import { createDriveProofClient } from './driveproof-client.js';
import { DEFAULT_POLICY_ID } from 'driveproof-contract';

setNetworkId('undeployed');

describe('DriveProofClient (simulator)', () => {
  const policyId = DEFAULT_POLICY_ID.toString();

  it('issues and proves a safe demo trip', async () => {
    const client = await createDriveProofClient({ mode: 'simulator' });
    const attestation = await client.issueDemoTrip('safe');

    expect(attestation.speed).toEqual(67n);
    expect(attestation.tamperedWitnessSpeed).toBeUndefined();

    const proof = await client.proveCompliance(attestation, policyId);
    expect(proof.status).toBe('verified');
    if (proof.status === 'verified') {
      const status = await client.getProofStatus(proof.transactionId);
      expect(status.status).toBe('verified');
    }
  });

  it('rejects unsafe trip with policy reason', async () => {
    const client = await createDriveProofClient({ mode: 'simulator' });
    const attestation = await client.issueDemoTrip('unsafe');

    const proof = await client.proveCompliance(attestation, policyId);
    expect(proof).toEqual({ status: 'rejected', reason: 'policy' });
  });

  it('rejects tampered trip with integrity reason', async () => {
    const client = await createDriveProofClient({ mode: 'simulator' });
    const attestation = await client.issueDemoTrip('tampered');

    expect(attestation.speed).toEqual(112n);
    expect(attestation.tamperedWitnessSpeed).toEqual(71n);

    const proof = await client.proveCompliance(attestation, policyId);
    expect(proof).toEqual({ status: 'rejected', reason: 'integrity' });
  });

  it('rejects replay with replay reason', async () => {
    const client = await createDriveProofClient({ mode: 'simulator' });
    const attestation = await client.issueDemoTrip('safe');

    const first = await client.proveCompliance(attestation, policyId);
    expect(first.status).toBe('verified');

    const replay = await client.proveCompliance(attestation, policyId);
    expect(replay).toEqual({ status: 'rejected', reason: 'replay' });
  });
});
