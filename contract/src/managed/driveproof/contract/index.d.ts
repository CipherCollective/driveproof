import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type DriverSecret = Uint8Array;

export type Schnorr_SchnorrSignature = { announcement: __compactRuntime.JubjubPoint;
                                         response: bigint
                                       };

export type Witnesses<PS> = {
  getSchnorrReduction(context: __compactRuntime.WitnessContext<Ledger, PS>,
                      challengeHash_0: bigint): [PS, [bigint, bigint]];
  getAttestedTripWitness(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, [{ attestationId: bigint,
                                                                                        salt: bigint,
                                                                                        gridX: bigint[],
                                                                                        gridY: bigint[],
                                                                                        speed: bigint[],
                                                                                        braking: bigint[],
                                                                                        timeBucket: bigint[]
                                                                                      },
                                                                                      Schnorr_SchnorrSignature,
                                                                                      bigint]];
  getDriverSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, DriverSecret];
}

export type ImpureCircuits<PS> = {
  proveCompliance(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  proveCompliance(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  deriveDriverBinding(secret_0: DriverSecret): bigint;
  deriveNullifier(attestationId_0: bigint): bigint;
  foldTripSample(prev_0: bigint,
                 gridX_0: bigint,
                 gridY_0: bigint,
                 speed_0: bigint,
                 braking_0: bigint,
                 timeBucket_0: bigint): bigint;
  deriveTripCommitment(attestationId_0: bigint,
                       driverBinding_0: bigint,
                       salt_0: bigint,
                       gridX_0: bigint[],
                       gridY_0: bigint[],
                       speed_0: bigint[],
                       braking_0: bigint[],
                       timeBucket_0: bigint[]): bigint;
  harshBrakingFlag(braking_0: bigint): bigint;
  countHarshBraking(braking_0: bigint[]): bigint;
  schnorrChallenge(ann_x_0: bigint,
                   ann_y_0: bigint,
                   pk_x_0: bigint,
                   pk_y_0: bigint,
                   msg_0: bigint[]): bigint;
}

export type Circuits<PS> = {
  deriveDriverBinding(context: __compactRuntime.CircuitContext<PS>,
                      secret_0: DriverSecret): __compactRuntime.CircuitResults<PS, bigint>;
  deriveNullifier(context: __compactRuntime.CircuitContext<PS>,
                  attestationId_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  foldTripSample(context: __compactRuntime.CircuitContext<PS>,
                 prev_0: bigint,
                 gridX_0: bigint,
                 gridY_0: bigint,
                 speed_0: bigint,
                 braking_0: bigint,
                 timeBucket_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  deriveTripCommitment(context: __compactRuntime.CircuitContext<PS>,
                       attestationId_0: bigint,
                       driverBinding_0: bigint,
                       salt_0: bigint,
                       gridX_0: bigint[],
                       gridY_0: bigint[],
                       speed_0: bigint[],
                       braking_0: bigint[],
                       timeBucket_0: bigint[]): __compactRuntime.CircuitResults<PS, bigint>;
  harshBrakingFlag(context: __compactRuntime.CircuitContext<PS>,
                   braking_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  countHarshBraking(context: __compactRuntime.CircuitContext<PS>,
                    braking_0: bigint[]): __compactRuntime.CircuitResults<PS, bigint>;
  proveCompliance(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  schnorrChallenge(context: __compactRuntime.CircuitContext<PS>,
                   ann_x_0: bigint,
                   ann_y_0: bigint,
                   pk_x_0: bigint,
                   pk_y_0: bigint,
                   msg_0: bigint[]): __compactRuntime.CircuitResults<PS, bigint>;
}

export type Ledger = {
  attestors: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): __compactRuntime.JubjubPoint;
    [Symbol.iterator](): Iterator<[bigint, __compactRuntime.JubjubPoint]>
  };
  readonly speedLimit: bigint;
  readonly brakingLimit: bigint;
  readonly geofenceMinX: bigint;
  readonly geofenceMinY: bigint;
  readonly geofenceMaxX: bigint;
  readonly geofenceMaxY: bigint;
  readonly complianceCount: bigint;
  usedNullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: bigint): boolean;
    [Symbol.iterator](): Iterator<bigint>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               limit_0: bigint,
               brakeLimit_0: bigint,
               minX_0: bigint,
               minY_0: bigint,
               maxX_0: bigint,
               maxY_0: bigint,
               attestorId_0: bigint,
               attestorPk_0: __compactRuntime.JubjubPoint): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
