import { Ledger } from './managed/driveproof/contract/index.js';
import { WitnessContext } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';

export type SchnorrSignature = {
  announcement: { x: bigint; y: bigint };
  response: bigint;
};

export type TelemetrySample = {
  gridX: bigint;
  gridY: bigint;
  speed: bigint;
  braking: bigint;
  timeBucket: bigint;
};

export type DriveProofPrivateState = {
  attestationId: bigint;
  salt: bigint;
  samples: TelemetrySample[];
  attestationSignature: SchnorrSignature;
  attestorId: bigint;
  driverSecretKey: Uint8Array;
};

const SAMPLE_COUNT = 16;
const TWO_248 = 452312848583266388373324160190187140051835877600158453279131187530910662656n;

function assertSampleCount(samples: TelemetrySample[]): void {
  if (samples.length !== SAMPLE_COUNT) {
    throw new Error(`Expected ${SAMPLE_COUNT} telemetry samples, received ${samples.length}`);
  }
}

function samplesToVectors(samples: TelemetrySample[]) {
  assertSampleCount(samples);
  return {
    attestationId: 0n,
    salt: 0n,
    gridX: samples.map((sample) => sample.gridX),
    gridY: samples.map((sample) => sample.gridY),
    speed: samples.map((sample) => sample.speed),
    braking: samples.map((sample) => sample.braking),
    timeBucket: samples.map((sample) => sample.timeBucket),
  };
}

export const witnesses = {
  getAttestedTripWitness: ({
    privateState,
  }: WitnessContext<Ledger, DriveProofPrivateState>): [
    DriveProofPrivateState,
    [
      {
        attestationId: bigint;
        salt: bigint;
        gridX: bigint[];
        gridY: bigint[];
        speed: bigint[];
        braking: bigint[];
        timeBucket: bigint[];
      },
      SchnorrSignature,
      bigint,
    ],
  ] => {
    const vectors = samplesToVectors(privateState.samples);
    return [
      privateState,
      [
        {
          ...vectors,
          attestationId: privateState.attestationId,
          salt: privateState.salt,
        },
        privateState.attestationSignature,
        privateState.attestorId,
      ],
    ];
  },

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
