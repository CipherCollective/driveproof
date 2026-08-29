import { Ledger } from './managed/driveproof/contract/index.js';
import { WitnessContext } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';

export type SchnorrSignature = {
  announcement: { x: bigint; y: bigint };
  response: bigint;
};

export type DriveProofPrivateState = {
  speed: bigint;
  attestationSignature: SchnorrSignature;
  attestorId: bigint;
};

const TWO_248 = 452312848583266388373324160190187140051835877600158453279131187530910662656n;

export const witnesses = {
  getAttestedSpeedWitness: ({
    privateState,
  }: WitnessContext<Ledger, DriveProofPrivateState>): [
    DriveProofPrivateState,
    [{ speed: bigint }, SchnorrSignature, bigint],
  ] => [
    privateState,
    [
      { speed: privateState.speed },
      privateState.attestationSignature,
      privateState.attestorId,
    ],
  ],

  getSchnorrReduction: (
    { privateState }: WitnessContext<Ledger, DriveProofPrivateState>,
    challengeHash: bigint,
  ): [DriveProofPrivateState, [bigint, bigint]] => {
    const q = challengeHash / TWO_248;
    const r = challengeHash % TWO_248;
    return [privateState, [q, r]];
  },
};
