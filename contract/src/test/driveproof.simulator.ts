import {
  type CircuitContext,
  createConstructorContext,
  createCircuitContext,
  sampleContractAddress,
  type JubjubPoint,
} from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { Contract, type Ledger, ledger, pureCircuits } from '../managed/driveproof/contract/index.js';
import { type DriveProofPrivateState, witnesses } from '../witnesses.js';
import {
  createSignedSpeedState,
  generateAttestorKeyPair,
  generateDriverSecret,
  DEFAULT_POLICY_ID,
  DEFAULT_SPEED_LIMIT,
} from './utils/test-data.js';

const toHexPadded = (str: string, len = 64) => Buffer.from(str, 'ascii').toString('hex').padStart(len, '0');

const createTestDeployer = (str: string) => ({
  is_left: true,
  left: { bytes: toHexPadded(str), hex: toHexPadded(str) },
  right: { bytes: toHexPadded('') },
});

export class DriveProofSimulator {
  readonly contract: Contract<DriveProofPrivateState>;
  circuitContext: CircuitContext<DriveProofPrivateState>;
  readonly attestorSk: bigint;
  readonly attestorPk: JubjubPoint;
  readonly attestorId: bigint = 1n;
  readonly speedLimit: bigint;
  readonly driverSecretKey: Uint8Array;

  constructor(speedLimit: bigint = DEFAULT_SPEED_LIMIT, witnessOverrides: Partial<typeof witnesses> = {}) {
    this.speedLimit = speedLimit;
    this.contract = new Contract<DriveProofPrivateState>({ ...witnesses, ...witnessOverrides });
    this.driverSecretKey = generateDriverSecret();

    const keyPair = generateAttestorKeyPair();
    this.attestorSk = keyPair.sk;
    this.attestorPk = keyPair.pk;

    const initialPrivateState = createSignedSpeedState(
      67n,
      this.attestorSk,
      this.driverSecretKey,
      this.attestorId,
    );
    const deployer = createTestDeployer('deployer');

    const { currentPrivateState, currentContractState, currentZswapLocalState } = this.contract.initialState(
      createConstructorContext(initialPrivateState, deployer.left.hex),
      speedLimit,
      this.attestorId,
      this.attestorPk,
    );
    this.circuitContext = createCircuitContext(
      sampleContractAddress(),
      currentZswapLocalState,
      currentContractState,
      currentPrivateState,
    );
  }

  getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  getPrivateState(): DriveProofPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  setPrivateState(state: DriveProofPrivateState): void {
    this.circuitContext = {
      ...this.circuitContext,
      currentPrivateState: state,
    };
  }

  setSignedSpeedState(
    speed: bigint,
    driverSecret: Uint8Array = this.driverSecretKey,
    attestationId?: bigint,
  ): void {
    this.setPrivateState(
      createSignedSpeedState(speed, this.attestorSk, driverSecret, this.attestorId, attestationId),
    );
  }

  proveCompliance(policyId: bigint = DEFAULT_POLICY_ID): Ledger {
    this.circuitContext = this.contract.impureCircuits.proveCompliance(
      this.circuitContext,
      policyId,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  nullifierUsed(attestationId: bigint, policyId: bigint = DEFAULT_POLICY_ID): boolean {
    const nullifier = pureCircuits.deriveNullifier(attestationId, policyId);
    return this.getLedger().usedNullifiers.member(nullifier);
  }
}

export { DEFAULT_POLICY_ID, DEFAULT_SPEED_LIMIT };
