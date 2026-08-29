import {
  type CircuitContext,
  createConstructorContext,
  createCircuitContext,
  sampleContractAddress,
  type JubjubPoint,
} from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { Contract, type Ledger, ledger } from '../managed/driveproof/contract/index.js';
import { type DriveProofPrivateState, witnesses } from '../witnesses.js';
import { createSignedSpeedState, generateAttestorKeyPair } from './utils/test-data.js';

const toHexPadded = (str: string, len = 64) => Buffer.from(str, 'ascii').toString('hex').padStart(len, '0');

const createTestDeployer = (str: string) => ({
  is_left: true,
  left: { bytes: toHexPadded(str), hex: toHexPadded(str) },
  right: { bytes: toHexPadded('') },
});

/** Default policy speed limit for Phase 1 tests (km/h). */
export const DEFAULT_SPEED_LIMIT = 80n;

export class DriveProofSimulator {
  readonly contract: Contract<DriveProofPrivateState>;
  circuitContext: CircuitContext<DriveProofPrivateState>;
  readonly attestorSk: bigint;
  readonly attestorPk: JubjubPoint;
  readonly attestorId: bigint = 1n;
  readonly speedLimit: bigint;

  constructor(speedLimit: bigint = DEFAULT_SPEED_LIMIT, witnessOverrides: Partial<typeof witnesses> = {}) {
    this.speedLimit = speedLimit;
    this.contract = new Contract<DriveProofPrivateState>({ ...witnesses, ...witnessOverrides });

    const keyPair = generateAttestorKeyPair();
    this.attestorSk = keyPair.sk;
    this.attestorPk = keyPair.pk;

    const initialPrivateState = createSignedSpeedState(67n, this.attestorSk, this.attestorId);
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

  setSignedSpeedState(speed: bigint): void {
    this.circuitContext = {
      ...this.circuitContext,
      currentPrivateState: createSignedSpeedState(speed, this.attestorSk, this.attestorId),
    };
  }

  proveCompliance(): Ledger {
    this.circuitContext = this.contract.impureCircuits.proveCompliance(this.circuitContext).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }
}
