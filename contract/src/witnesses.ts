import { Ledger } from './managed/driveproof/contract/index.js';
import { WitnessContext } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';

export type SchnorrSignature = {
  announcement: { x: bigint; y: bigint };
  response: bigint;
};

export type DriveProofPrivateState = {
  speed: bigint;
  attestationId: bigint;
  attestationSignature: SchnorrSignature;
  attestorId: bigint;
  driverSecretKey: Uint8Array;
};

const TWO_248 = 452312848583266388373324160190187140051835877600158453279131187530910662656n;

export const witnesses = {
  getAttestedSpeedWitness: ({
    privateState,
  }: WitnessContext<Ledger, DriveProofPrivateState>): [
    DriveProofPrivateState,
    [{ speed: bigint; attestationId: bigint }, SchnorrSignature, bigint],
  ] => [
    privateState,
    [
      { speed: privateState.speed, attestationId: privateState.attestationId },
      privateState.attestationSignature,
      privateState.attestorId,
    ],
  ],

  getDriverSecret: ({
    privateState,
  }: WitnessContext<Ledger, DriveProofPrivateState>): [DriveProofPrivateState, Uint8Array] => {
    if (!privateState.driverSecretKey || privateState.driverSecretKey.length !== 32) {
      throw new Error('getDriverSecret: driverSecretKey is missing or wrong length');
    }
    return [privateState, privateState.driverSecretKey];
  },

  getSchnorrReduction: (
    { privateState }: WitnessContext<Ledger, DriveProofPrivateState>,
    challengeHash: bigint,
  ): [DriveProofPrivateState, [bigint, bigint]] => {
    const q = challengeHash / TWO_248;
    const r = challengeHash % TWO_248;
    return [privateState, [q, r]];
  },
};
