import { POLICY_ID } from "@driveproof/fixtures";
import type {
  DemoFixture,
  DriveProofClient,
  DriveProofConnectionState,
  ProofRejectionReason,
  ProofResult,
  PublicProofReceipt,
  TripAttestation
} from "@driveproof/types";
import {
  createLaceMidnightWalletBridge,
  readMidnightWalletConfig,
  type MidnightWalletBridge,
  type MidnightWalletConfig,
  type WalletConnectionState
} from "@driveproof/midnight-wallet";
import type { MidnightRuntime, MidnightRuntimeOptions } from "@driveproof/midnight-runtime";
import type { FinalizedTxData } from "@midnight-ntwrk/midnight-js-types";
import type { DriveProofPrivateState } from "driveproof-contract";

const PRIVATE_STATE_ID = "driveproofPrivateState" as const;
const ZK_CONFIG_BASE_PATH = "/contract/compiled/driveproof";
const EXPECTED_PROOF_SERVER_VERSION = "8.1.0";
const EXPECTED_NETWORK_ID = "preprod";
const SPEED_LIMIT = 80n;
const ATTESTOR_ID = 1n;
const ATTESTOR_PUBLIC_KEY = {
  x: 24963340820686704563874210959139693074205807300853579178326830224576306549782n,
  y: 13555256131498264457493147271978939536039390820876751212247441513267437911171n
} as const;

type DriveProofContract = import("driveproof-contract").DriveProof.Contract<DriveProofPrivateState>;
type DriveProofCircuitId = import("@midnight-ntwrk/midnight-js-protocol/compact-js").Contract.ProvableCircuitId<DriveProofContract>;
type DriveProofRuntime = MidnightRuntime<DriveProofCircuitId, typeof PRIVATE_STATE_ID, DriveProofPrivateState>;

type CompiledDriveProof = Awaited<ReturnType<typeof loadCompiledDriveProof>>;
type AttestorRequest = typeof import("@driveproof/attestor-client").requestAttestorPrivateState;
type RuntimeFactory = (
  connectedApi: import("@driveproof/midnight-wallet").MidnightWalletSession["wallet"],
  options: MidnightRuntimeOptions
) => Promise<DriveProofRuntime>;
type DeployContractFunction = typeof import("@midnight-ntwrk/midnight-js-contracts").deployContract;
type FindDeployedContractFunction = typeof import("@midnight-ntwrk/midnight-js-contracts").findDeployedContract;

/** Injectable seams used by unit tests; production defaults load the proven runtime modules. */
export type MidnightDriveProofClientAdapters = {
  requestAttestorPrivateState?: AttestorRequest;
  loadCompiledDriveProof?: () => Promise<CompiledDriveProof>;
  createRuntime?: RuntimeFactory;
  deployContract?: DeployContractFunction;
  findDeployedContract?: FindDeployedContractFunction;
};

export type MidnightDriveProofClientOptions = {
  networkId?: string;
  proofServerUrl?: string;
  expectedProofServerVersion?: string;
  attestorUrl?: string;
  zkConfigBaseUrl?: string;
  walletBridge?: MidnightWalletBridge;
  privateStoragePasswordProvider?: () => string;
  fetch?: typeof fetch;
  adapters?: MidnightDriveProofClientAdapters;
};

function normalizeError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  if (error !== null && typeof error === "object") {
    const record = error as Record<string, unknown>;
    for (const key of ["message", "tag", "code", "name"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return "The Midnight client returned an unknown error.";
}

function collectErrorMessages(value: unknown, messages: string[], visited: Set<object>, depth = 0): void {
  if (depth > 5 || value === null || value === undefined) return;
  if (typeof value === "string") {
    if (value.trim()) messages.push(value);
    return;
  }
  if (typeof value !== "object" || visited.has(value)) return;

  visited.add(value);
  const record = value as Record<string, unknown>;
  if (typeof record.message === "string" && record.message.trim()) messages.push(record.message);
  collectErrorMessages(record.cause, messages, visited, depth + 1);
  collectErrorMessages(record.error, messages, visited, depth + 1);
}

/** Classifies only assertions the current v2 contract intentionally exposes. */
export function classifyMidnightProofRejection(error: unknown): ProofRejectionReason | undefined {
  const messages: string[] = [];
  collectErrorMessages(error, messages, new Set<object>());

  if (messages.some((message) => message.includes("Speed exceeds policy limit"))) return "policy";
  if (messages.some((message) => message.includes("Invalid attestation signature"))) return "integrity";
  if (messages.some((message) => message.includes("Attestation already used"))) return "replay";
  return undefined;
}

function createRandomBytes(length: number): Uint8Array {
  if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== "function") {
    throw new Error("Browser cryptographic randomness is unavailable.");
  }
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

function createStoragePassword(): string {
  return `DriveProof!${Array.from(createRandomBytes(32), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function defaultZkConfigBaseUrl(): string {
  if (typeof window === "undefined") return ZK_CONFIG_BASE_PATH;
  return `${window.location.origin}${ZK_CONFIG_BASE_PATH}`;
}

function toConnectionState(connection: WalletConnectionState): DriveProofConnectionState {
  switch (connection.status) {
    case "connected":
      return {
        status: "connected",
        network: connection.network,
        ...(connection.walletName ? { walletName: connection.walletName } : {})
      };
    case "wrong-network":
      return {
        status: "wrong-network",
        network: connection.network,
        expectedNetwork: connection.expectedNetwork,
        ...(connection.walletName ? { walletName: connection.walletName } : {})
      };
    case "unavailable":
      return { status: "unavailable", reason: connection.reason };
    case "error":
      return { status: "error", message: connection.message };
    case "connecting":
      return { status: "connecting" };
    default:
      return { status: "disconnected" };
  }
}

function publicTransaction(data: FinalizedTxData): Pick<FinalizedTxData, "txId" | "blockHeight" | "status"> {
  return {
    txId: data.txId,
    blockHeight: data.blockHeight,
    status: data.status
  };
}

async function loadCompiledDriveProof(): Promise<{
  compiledContract: import("@midnight-ntwrk/midnight-js-protocol/compact-js").CompiledContract.CompiledContract<DriveProofContract, DriveProofPrivateState>;
  contractModule: typeof import("driveproof-contract");
}> {
  const [{ CompiledContract }, contractModule] = await Promise.all([
    import("@midnight-ntwrk/midnight-js-protocol/compact-js"),
    import("driveproof-contract")
  ]);

  if (typeof window === "undefined") {
    throw new Error("MidnightDriveProofClient requires a browser origin to load generated ZK assets.");
  }

  const compiledContract = CompiledContract.make<DriveProofContract, DriveProofPrivateState>(
    "DriveProof",
    contractModule.DriveProof.Contract
  ).pipe(
    CompiledContract.withWitnesses(contractModule.witnesses),
    // Keep this identical to the proven browser harness. The generated
    // contract resolves its managed assets from the application origin.
    CompiledContract.withCompiledFileAssets(window.location.origin)
  );

  return { compiledContract, contractModule };
}

const requestAttestorPrivateStateDefault: AttestorRequest = async (...args) => {
  const { requestAttestorPrivateState } = await import("@driveproof/attestor-client");
  return requestAttestorPrivateState(...args);
};

const createMidnightRuntimeDefault: RuntimeFactory = async (connectedApi, options) => {
  const { createMidnightRuntime } = await import("@driveproof/midnight-runtime");
  return createMidnightRuntime<DriveProofCircuitId, typeof PRIVATE_STATE_ID, DriveProofPrivateState>(connectedApi, options);
};

/**
 * Real v2 product adapter. It owns no provider secret and never places the
 * driver secret, signature, or generated private state in a public receipt.
 */
export class MidnightDriveProofClient implements DriveProofClient {
  readonly mode = "midnight" as const;
  readonly displayName = "REAL · MIDNIGHT PREPROD";

  private readonly walletConfig: MidnightWalletConfig;
  private readonly networkId: string;
  private readonly proofServerUrl: string;
  private readonly expectedProofServerVersion: string;
  private readonly attestorUrl: string;
  private readonly zkConfigBaseUrl: string;
  private readonly fetchImpl: typeof fetch | undefined;
  private readonly walletBridge: MidnightWalletBridge;
  private readonly privateStoragePasswordProvider: () => string;
  private readonly adapters: MidnightDriveProofClientAdapters;
  private readonly privateStates = new WeakMap<TripAttestation, DriveProofPrivateState>();
  private readonly proofResults = new Map<string, ProofResult>();
  private driverSecretKey: Uint8Array | undefined;
  private connectionState: DriveProofConnectionState = { status: "disconnected" };
  private compiled: CompiledDriveProof | undefined;
  private runtime: DriveProofRuntime | undefined;
  private contractAddress: string | undefined;
  private latestReceipt: PublicProofReceipt | undefined;

  constructor(options: MidnightDriveProofClientOptions = {}) {
    this.walletConfig = readMidnightWalletConfig();
    this.networkId = options.networkId ?? this.walletConfig.networkId;
    this.proofServerUrl = options.proofServerUrl ?? this.walletConfig.expectedProofServerUrl;
    this.expectedProofServerVersion = options.expectedProofServerVersion ?? EXPECTED_PROOF_SERVER_VERSION;
    this.attestorUrl = options.attestorUrl
      ?? import.meta.env.VITE_MIDNIGHT_ATTESTOR_URL?.trim()
      ?? "http://localhost:4000";
    this.zkConfigBaseUrl = options.zkConfigBaseUrl ?? defaultZkConfigBaseUrl();
    this.fetchImpl = options.fetch;
    this.adapters = options.adapters ?? {};
    this.walletBridge = options.walletBridge ?? createLaceMidnightWalletBridge({
      networkId: this.networkId,
      expectedProofServerUrl: this.proofServerUrl
    });

    let generatedPassword: string | undefined;
    this.privateStoragePasswordProvider = options.privateStoragePasswordProvider ?? (() => {
      generatedPassword ??= createStoragePassword();
      return generatedPassword;
    });
  }

  getConnectionState(): DriveProofConnectionState {
    return this.connectionState;
  }

  async detect(): Promise<boolean> {
    return this.walletBridge.detect();
  }

  async connect(): Promise<DriveProofConnectionState> {
    if (this.connectionState.status === "connected") return this.connectionState;

    if (this.networkId !== EXPECTED_NETWORK_ID) {
      const nextState: DriveProofConnectionState = {
        status: "error",
        message: `The DriveProof client only supports Midnight ${EXPECTED_NETWORK_ID}.`
      };
      this.connectionState = nextState;
      return nextState;
    }

    this.connectionState = { status: "connecting" };
    try {
      const nextState = toConnectionState(await this.walletBridge.connect());
      this.connectionState = nextState;
      if (nextState.status !== "connected") {
        this.runtime = undefined;
      }
      return nextState;
    } catch (error) {
      const nextState: DriveProofConnectionState = { status: "error", message: normalizeError(error) };
      this.connectionState = nextState;
      return nextState;
    }
  }

  async disconnect(): Promise<void> {
    await this.walletBridge.disconnect();
    this.connectionState = { status: "disconnected" };
    this.runtime = undefined;
  }

  async issueDemoTrip(fixture: DemoFixture): Promise<TripAttestation> {
    this.requireConnected();

    const tripId = fixture === "safe" ? "safe" : "unsafe";
    const driverSecretKey = this.getDriverSecretKey();
    const requestAttestorPrivateState = this.adapters.requestAttestorPrivateState ?? requestAttestorPrivateStateDefault;
    const privateState = await requestAttestorPrivateState(this.attestorUrl, tripId, {
      driverSecretKey,
      ...(this.fetchImpl ? { fetchImpl: this.fetchImpl } : {})
    });

    const expectedSpeed = fixture === "safe" ? 67n : 112n;
    if (privateState.speed !== expectedSpeed) {
      throw new Error(`Attestor returned ${privateState.speed.toString()} for the ${fixture} fixture; expected ${expectedSpeed.toString()}.`);
    }
    if (privateState.attestorId !== ATTESTOR_ID) {
      throw new Error(`The attestor returned provider ${privateState.attestorId.toString()}; expected provider ${ATTESTOR_ID.toString()}.`);
    }

    const displayAttestation: TripAttestation = {
      // v2 proves a single issuer-signed speed. Do not manufacture the
      // product fixture's 16-sample visualization for the real adapter.
      samples: [],
      attestorId: privateState.attestorId.toString(),
      attestationId: privateState.attestationId.toString(),
      fixture,
      // The real signature remains in the client-owned private state map.
      signature: "issuer-signed"
    };
    this.privateStates.set(displayAttestation, privateState);
    return displayAttestation;
  }

  async proveCompliance(attestation: TripAttestation, policyId: string): Promise<ProofResult> {
    if (policyId !== POLICY_ID) {
      throw new Error(`Unsupported DriveProof policy ${policyId}; the current contract is bound to ${POLICY_ID}.`);
    }

    const issuedState = this.privateStates.get(attestation);
    if (!issuedState) {
      throw new Error("This attestation was not issued by the current Midnight client session.");
    }

    // The tampered fixture deliberately changes only the local witness speed;
    // its issuer signature and attestation ID remain the original unsafe ones.
    const privateState = attestation.fixture === "tampered"
      ? { ...issuedState, speed: 71n }
      : issuedState;

    try {
      const { runtime, compiled } = await this.ensureRuntime();
      const contracts = this.adapters.deployContract && this.adapters.findDeployedContract
        ? undefined
        : await import("@midnight-ntwrk/midnight-js-contracts");
      const deployContract = this.adapters.deployContract ?? contracts?.deployContract;
      const findDeployedContract = this.adapters.findDeployedContract ?? contracts?.findDeployedContract;
      if (!deployContract || !findDeployedContract) throw new Error("Midnight contract operations are unavailable.");

      if (!this.contractAddress) {
        const deployed = await deployContract(runtime.providers, {
          compiledContract: compiled.compiledContract,
          args: [SPEED_LIMIT, ATTESTOR_ID, ATTESTOR_PUBLIC_KEY],
          privateStateId: PRIVATE_STATE_ID,
          initialPrivateState: privateState
        });
        this.contractAddress = deployed.deployTxData.public.contractAddress;
      }

      const joined = await findDeployedContract(runtime.providers, {
        compiledContract: compiled.compiledContract,
        contractAddress: this.contractAddress,
        privateStateId: PRIVATE_STATE_ID
      });
      await runtime.providers.privateStateProvider.set(PRIVATE_STATE_ID, privateState);
      const proof = await joined.callTx.proveCompliance();
      const state = await runtime.providers.publicDataProvider.queryContractState(this.contractAddress);
      if (!state) throw new Error("The DriveProof ledger state was not returned by the indexer after proving.");

      const publicProof = publicTransaction(proof.public);
      const receipt: PublicProofReceipt = {
        status: "verified",
        network: this.networkId,
        transactionId: publicProof.txId,
        blockHeight: publicProof.blockHeight,
        contractAddress: this.contractAddress,
        complianceStatus: "satisfied",
        // Product metadata only. This value is never passed to the v2 circuit.
        policyId,
        attestorId: ATTESTOR_ID.toString()
      };
      const result: ProofResult = { status: "verified", receipt };
      this.latestReceipt = receipt;
      this.proofResults.set(receipt.transactionId, result);
      return result;
    } catch (error) {
      const reason = classifyMidnightProofRejection(error);
      if (reason) return { status: "rejected", reason };
      throw error;
    }
  }

  async getProofStatus(transactionId: string): Promise<ProofResult> {
    return this.proofResults.get(transactionId) ?? { status: "rejected", reason: "unknown" };
  }

  getLatestReceipt(): PublicProofReceipt | undefined {
    return this.latestReceipt;
  }

  private getDriverSecretKey(): Uint8Array {
    this.driverSecretKey ??= createRandomBytes(32);
    return this.driverSecretKey;
  }

  private requireConnected(): void {
    if (this.connectionState.status !== "connected") {
      throw new Error("Connect Lace and confirm Midnight Preprod before requesting an attested trip.");
    }
  }

  private async ensureRuntime(): Promise<{ runtime: DriveProofRuntime; compiled: CompiledDriveProof }> {
    this.requireConnected();
    const session = this.walletBridge.getSession();
    if (!session) {
      this.connectionState = { status: "disconnected" };
      throw new Error("The Lace session is no longer available. Reconnect Lace before proving.");
    }

    this.compiled ??= await (this.adapters.loadCompiledDriveProof ?? loadCompiledDriveProof)();
    if (!this.runtime) {
      const createRuntime = this.adapters.createRuntime ?? createMidnightRuntimeDefault;
      this.runtime = await createRuntime(
        session.wallet,
        {
          networkId: this.networkId,
          proofServerUrl: this.proofServerUrl,
          expectedProofServerVersion: this.expectedProofServerVersion,
          zkConfigBaseUrl: this.zkConfigBaseUrl,
          privateState: {
            privateStoragePasswordProvider: this.privateStoragePasswordProvider
          },
          ...(this.fetchImpl ? { fetch: this.fetchImpl } : {})
        }
      );
    }

    return { runtime: this.runtime, compiled: this.compiled };
  }
}
