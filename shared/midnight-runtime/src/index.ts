import type { ConnectedAPI, Configuration, ConnectionStatus } from "@midnight-ntwrk/dapp-connector-api";
import { Transaction } from "@midnight-ntwrk/ledger-v8";
import type { CoinPublicKey, EncPublicKey } from "@midnight-ntwrk/ledger-v8";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import {
  levelPrivateStateProvider,
  type PrivateStoragePasswordProvider
} from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import type {
  AnyProvableCircuitId,
  MidnightProviders,
  PrivateStateId,
  UnboundTransaction,
  WalletProvider,
  MidnightProvider,
  PublicDataProvider,
  ProofProvider,
  PrivateStateProvider,
  ZKConfigProvider
} from "@midnight-ntwrk/midnight-js-types";
import type { FinalizedTransaction } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import {
  checkProofServer,
  type ProofServerStatus
} from "./proof-server";
import {
  DEFAULT_MIDNIGHT_NETWORK,
  DEFAULT_PROOF_SERVER_URL
} from "@driveproof/midnight-wallet";

export { checkProofServer, EXPECTED_PROOF_SERVER_VERSION } from "./proof-server";
export type { ProofServerStatus } from "./proof-server";

export type MidnightRuntimeConfiguration = Configuration & {
  proofServerUrl: string;
  proofServerVersion: string;
  walletProofServerUrl?: string;
};

export type MidnightRuntimeOptions = {
  /** The expected network is deliberately explicit so a runtime cannot silently drift. */
  networkId?: string;
  /** Public local proof-server target for this harness. */
  proofServerUrl?: string;
  expectedProofServerVersion?: string;
  proofServerTimeoutMs?: number;
  /** URL serving generated Compact keys/zkIR; supplied only when Ashiha's artifacts exist. */
  zkConfigBaseUrl: string;
  /** The app supplies this secret callback; it is never read from Vite config. */
  privateState: {
    accountId?: string;
    privateStoragePasswordProvider: PrivateStoragePasswordProvider;
  };
  fetch?: typeof fetch;
};

export type MidnightRuntime<
  CircuitId extends AnyProvableCircuitId = AnyProvableCircuitId,
  PSI extends PrivateStateId = string,
  PS = unknown
> = {
  /** Provider set consumed by Midnight.js contract helpers after generated artifacts are supplied. */
  providers: MidnightProviders<CircuitId, PSI, PS>;
  connectedApi: ConnectedAPI;
  configuration: MidnightRuntimeConfiguration;
  proofServer: Extract<ProofServerStatus, { status: "reachable" }>;
  wallet: {
    shieldedAddress: string;
    shieldedCoinPublicKey: string;
    shieldedEncryptionPublicKey: string;
  };
};

export type RuntimeErrorCode =
  | "wrong-network"
  | "proof-server-unavailable"
  | "proof-server-incompatible"
  | "wallet-disconnected";

export class MidnightRuntimeError extends Error {
  constructor(readonly code: RuntimeErrorCode, message: string) {
    super(message);
    this.name = "MidnightRuntimeError";
  }
}

export function validatePreprodConfiguration(
  expectedNetwork: string,
  connectionStatus: ConnectionStatus,
  configuration: Configuration
): void {
  if (expectedNetwork !== DEFAULT_MIDNIGHT_NETWORK) {
    throw new MidnightRuntimeError(
      "wrong-network",
      `This runtime harness is Preprod-only; refusing requested network ${expectedNetwork}.`
    );
  }

  if (connectionStatus.status !== "connected") {
    throw new MidnightRuntimeError(
      "wallet-disconnected",
      "Lace returned a disconnected status; refusing to construct Midnight providers."
    );
  }

  if (connectionStatus.networkId !== expectedNetwork || configuration.networkId !== expectedNetwork) {
    throw new MidnightRuntimeError(
      "wrong-network",
      `Refusing to construct Midnight providers: expected ${expectedNetwork}, status=${connectionStatus.networkId}, configuration=${configuration.networkId}.`
    );
  }
}

export function createRuntimeConfiguration(
  configuration: Configuration,
  proofServer: Extract<ProofServerStatus, { status: "reachable" }>
): MidnightRuntimeConfiguration {
  return {
    ...configuration,
    proofServerUrl: proofServer.url,
    proofServerVersion: proofServer.version,
    walletProofServerUrl: configuration.proverServerUri
  };
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.replace(/^0x/, "");
  const bytes = normalized.match(/.{1,2}/g);
  return bytes ? new Uint8Array(bytes.map((byte) => Number.parseInt(byte, 16))) : new Uint8Array();
}

function createWalletProviders(
  connectedApi: ConnectedAPI,
  addresses: { shieldedCoinPublicKey: string; shieldedEncryptionPublicKey: string }
): { walletProvider: WalletProvider; midnightProvider: MidnightProvider } {
  const walletProvider: WalletProvider = {
    getCoinPublicKey(): CoinPublicKey {
      return addresses.shieldedCoinPublicKey;
    },
    getEncryptionPublicKey(): EncPublicKey {
      return addresses.shieldedEncryptionPublicKey;
    },
    async balanceTx(tx: UnboundTransaction): Promise<FinalizedTransaction> {
      const result = await connectedApi.balanceUnsealedTransaction(bytesToHex(tx.serialize()));
      return Transaction.deserialize(
        "signature",
        "proof",
        "binding",
        hexToBytes(result.tx)
      ) as FinalizedTransaction;
    }
  };

  const midnightProvider: MidnightProvider = {
    async submitTx(tx: FinalizedTransaction): Promise<string> {
      await connectedApi.submitTransaction(bytesToHex(tx.serialize()));
      return tx.identifiers()[0];
    }
  };

  return { walletProvider, midnightProvider };
}

/**
 * Constructs genuine Midnight.js providers around an already authorized Lace
 * ConnectedAPI. This function has no generated contract import and makes no
 * deploy/call/submit request; `submitTx` is only invoked by a future client.
 */
export async function createMidnightRuntime<
  CircuitId extends AnyProvableCircuitId = AnyProvableCircuitId,
  PSI extends PrivateStateId = string,
  PS = unknown
>(
  connectedApi: ConnectedAPI,
  options: MidnightRuntimeOptions
): Promise<MidnightRuntime<CircuitId, PSI, PS>> {
  const expectedNetwork = options.networkId ?? DEFAULT_MIDNIGHT_NETWORK;
  const configuration = await connectedApi.getConfiguration();
  const connectionStatus = await connectedApi.getConnectionStatus();
  validatePreprodConfiguration(expectedNetwork, connectionStatus, configuration);

  const proofServer = await checkProofServer({
    url: options.proofServerUrl ?? DEFAULT_PROOF_SERVER_URL,
    expectedVersion: options.expectedProofServerVersion,
    timeoutMs: options.proofServerTimeoutMs,
    fetchImpl: options.fetch
  });
  if (proofServer.status === "unavailable") {
    throw new MidnightRuntimeError("proof-server-unavailable", proofServer.message);
  }
  if (proofServer.status === "incompatible") {
    throw new MidnightRuntimeError("proof-server-incompatible", proofServer.message);
  }

  const addresses = await connectedApi.getShieldedAddresses();
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  const zkConfigProvider: ZKConfigProvider<CircuitId> = new FetchZkConfigProvider<CircuitId>(
    options.zkConfigBaseUrl,
    fetchImpl
  );
  const privateStateProvider: PrivateStateProvider<PSI, PS> = levelPrivateStateProvider<PSI, PS>({
    accountId: options.privateState.accountId ?? addresses.shieldedAddress,
    privateStoragePasswordProvider: options.privateState.privateStoragePasswordProvider
  });
  const publicDataProvider: PublicDataProvider = indexerPublicDataProvider(
    configuration.indexerUri,
    configuration.indexerWsUri
  );
  const proofProvider: ProofProvider = httpClientProofProvider(
    proofServer.url,
    zkConfigProvider
  );
  const { walletProvider, midnightProvider } = createWalletProviders(connectedApi, addresses);

  return {
    connectedApi,
    configuration: createRuntimeConfiguration(configuration, proofServer),
    proofServer,
    wallet: addresses,
    providers: {
      privateStateProvider,
      publicDataProvider,
      zkConfigProvider,
      proofProvider,
      walletProvider,
      midnightProvider
    }
  };
}
