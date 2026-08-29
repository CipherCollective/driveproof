import type { ConnectedAPI, Configuration, ConnectionStatus } from "@midnight-ntwrk/dapp-connector-api";
import { Transaction } from "@midnight-ntwrk/ledger-v8";
import type { CoinPublicKey, EncPublicKey } from "@midnight-ntwrk/ledger-v8";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
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
  onDiagnostic?: (diagnostic: MidnightRuntimeDiagnostic) => void;
};

export type MidnightRuntimeDiagnosticStage =
  | "PREPARING DEPLOYMENT"
  | "BUILDING UNBOUND TX"
  | "PROVING"
  | "AWAITING LACE BALANCE"
  | "BALANCE RETURNED"
  | "DESERIALIZING BALANCED TX"
  | "BALANCED"
  | "AWAITING LACE SUBMISSION"
  | "SUBMISSION RETURNED"
  | "TX SUBMITTED"
  | "WAITING FOR CONTRACT"
  | "DEPLOYED";

export type MidnightRuntimeDiagnostic = {
  stage: MidnightRuntimeDiagnosticStage;
  event: string;
  outcome: "start" | "resolved" | "rejected";
  metadata?: Record<string, string | number | boolean>;
  error?: string;
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

export function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;

  if (error !== null && typeof error === "object" && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message) return message;
  }

  try {
    const serialized = JSON.stringify(error);
    return serialized ?? String(error);
  } catch {
    return String(error);
  }
}

function publishDiagnostic(
  onDiagnostic: MidnightRuntimeOptions["onDiagnostic"],
  diagnostic: MidnightRuntimeDiagnostic
): void {
  const payload = {
    stage: diagnostic.stage,
    outcome: diagnostic.outcome,
    ...(diagnostic.metadata ?? {}),
    ...(diagnostic.error ? { error: diagnostic.error } : {})
  };

  if (diagnostic.outcome === "rejected") {
    console.error(`[DriveProofDeploy] ${diagnostic.event}`, payload);
  } else {
    console.log(`[DriveProofDeploy] ${diagnostic.event}`, payload);
  }

  onDiagnostic?.(diagnostic);
}

function responseMetadata(response: unknown): Record<string, string | number | boolean> {
  const metadata: Record<string, string | number | boolean> = {
    responseType: response === null ? "null" : typeof response,
    responseKeys: ""
  };

  if (response !== null && typeof response === "object") {
    metadata.responseKeys = Object.keys(response).join(",");
    if ("tx" in response && typeof response.tx === "string") {
      metadata.txStringLength = response.tx.length;
    }
  }

  return metadata;
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
  addresses: { shieldedCoinPublicKey: string; shieldedEncryptionPublicKey: string },
  onDiagnostic: MidnightRuntimeOptions["onDiagnostic"]
): { walletProvider: WalletProvider; midnightProvider: MidnightProvider } {
  const walletProvider: WalletProvider = {
    getCoinPublicKey(): CoinPublicKey {
      return addresses.shieldedCoinPublicKey;
    },
    getEncryptionPublicKey(): EncPublicKey {
      return addresses.shieldedEncryptionPublicKey;
    },
    async balanceTx(tx: UnboundTransaction): Promise<FinalizedTransaction> {
      let stage: MidnightRuntimeDiagnosticStage = "AWAITING LACE BALANCE";
      publishDiagnostic(onDiagnostic, {
        stage,
        event: "balanceTx:start",
        outcome: "start"
      });

      try {
        const serializedTx = bytesToHex(tx.serialize());
        publishDiagnostic(onDiagnostic, {
          stage,
          event: "balanceTx:wallet-request",
          outcome: "start",
          metadata: { txStringLength: serializedTx.length }
        });

        let result: { tx: string };
        try {
          result = await connectedApi.balanceUnsealedTransaction(serializedTx);
        } catch (error) {
          const message = normalizeErrorMessage(error);
          publishDiagnostic(onDiagnostic, {
            stage,
            event: "balanceTx:wallet-rejected",
            outcome: "rejected",
            metadata: { resolved: false },
            error: message
          });
          throw error;
        }

        publishDiagnostic(onDiagnostic, {
          stage: "BALANCE RETURNED",
          event: "balanceTx:wallet-response",
          outcome: "resolved",
          metadata: { ...responseMetadata(result), resolved: true }
        });

        stage = "DESERIALIZING BALANCED TX";
        publishDiagnostic(onDiagnostic, {
          stage,
          event: "balanceTx:deserialize:start",
          outcome: "start",
          metadata: { txStringLength: typeof result.tx === "string" ? result.tx.length : 0 }
        });

        let balancedTx: FinalizedTransaction;
        try {
          balancedTx = Transaction.deserialize(
            "signature",
            "proof",
            "binding",
            hexToBytes(result.tx)
          ) as FinalizedTransaction;
        } catch (error) {
          const message = normalizeErrorMessage(error);
          publishDiagnostic(onDiagnostic, {
            stage,
            event: "balanceTx:deserialize:rejected",
            outcome: "rejected",
            metadata: { resolved: false },
            error: message
          });
          throw error;
        }

        publishDiagnostic(onDiagnostic, {
          stage: "BALANCED",
          event: "balanceTx:deserialize:resolved",
          outcome: "resolved"
        });
        return balancedTx;
      } catch (error) {
        const message = normalizeErrorMessage(error);
        publishDiagnostic(onDiagnostic, {
          stage,
          event: "balanceTx:error",
          outcome: "rejected",
          metadata: { resolved: false },
          error: message
        });
        throw error;
      }
    }
  };

  const midnightProvider: MidnightProvider = {
    async submitTx(tx: FinalizedTransaction): Promise<string> {
      let stage: MidnightRuntimeDiagnosticStage = "AWAITING LACE SUBMISSION";
      publishDiagnostic(onDiagnostic, {
        stage,
        event: "submitTx:start",
        outcome: "start"
      });

      try {
        const serializedTx = bytesToHex(tx.serialize());
        publishDiagnostic(onDiagnostic, {
          stage,
          event: "submitTx:wallet-request",
          outcome: "start",
          metadata: { txStringLength: serializedTx.length }
        });

        let walletResponse: unknown;
        try {
          walletResponse = await connectedApi.submitTransaction(serializedTx);
        } catch (error) {
          const message = normalizeErrorMessage(error);
          publishDiagnostic(onDiagnostic, {
            stage,
            event: "submitTx:wallet-rejected",
            outcome: "rejected",
            metadata: { resolved: false },
            error: message
          });
          throw error;
        }

        stage = "SUBMISSION RETURNED";
        publishDiagnostic(onDiagnostic, {
          stage,
          event: "submitTx:wallet-response",
          outcome: "resolved",
          metadata: { ...responseMetadata(walletResponse), resolved: true }
        });

        publishDiagnostic(onDiagnostic, {
          stage,
          event: "submitTx:transaction-id:start",
          outcome: "start"
        });
        let transactionId: string;
        try {
          transactionId = tx.identifiers()[0];
        } catch (error) {
          const message = normalizeErrorMessage(error);
          publishDiagnostic(onDiagnostic, {
            stage,
            event: "submitTx:transaction-id:rejected",
            outcome: "rejected",
            metadata: { resolved: false },
            error: message
          });
          throw error;
        }
        publishDiagnostic(onDiagnostic, {
          stage: "TX SUBMITTED",
          event: "submitTx:transaction-id:resolved",
          outcome: "resolved",
          metadata: { transactionId: transactionId ?? "<undefined>" }
        });
        return transactionId;
      } catch (error) {
        const message = normalizeErrorMessage(error);
        publishDiagnostic(onDiagnostic, {
          stage,
          event: "submitTx:error",
          outcome: "rejected",
          metadata: { resolved: false },
          error: message
        });
        throw error;
      }
    }
  };

  return { walletProvider, midnightProvider };
}

function createDiagnosticProofProvider(
  proofProvider: ProofProvider,
  onDiagnostic: MidnightRuntimeOptions["onDiagnostic"]
): ProofProvider {
  return {
    async proveTx(unprovenTx, proveTxConfig) {
      publishDiagnostic(onDiagnostic, {
        stage: "PROVING",
        event: "proveTx:start",
        outcome: "start"
      });

      try {
        const result = await proofProvider.proveTx(unprovenTx, proveTxConfig);
        publishDiagnostic(onDiagnostic, {
          stage: "PROVING",
          event: "proveTx:resolved",
          outcome: "resolved"
        });
        return result;
      } catch (error) {
        const message = normalizeErrorMessage(error);
        publishDiagnostic(onDiagnostic, {
          stage: "PROVING",
          event: "proveTx:rejected",
          outcome: "rejected",
          metadata: { resolved: false },
          error: message
        });
        throw error;
      }
    }
  };
}

function createDiagnosticPublicDataProvider(
  publicDataProvider: PublicDataProvider,
  onDiagnostic: MidnightRuntimeOptions["onDiagnostic"]
): PublicDataProvider {
  return {
    ...publicDataProvider,
    async watchForTxData(transactionId) {
      publishDiagnostic(onDiagnostic, {
        stage: "WAITING FOR CONTRACT",
        event: "contract:indexer-confirmation:start",
        outcome: "start",
        metadata: { transactionId }
      });

      try {
        const result = await publicDataProvider.watchForTxData(transactionId);
        publishDiagnostic(onDiagnostic, {
          stage: "WAITING FOR CONTRACT",
          event: "contract:indexer-confirmation:resolved",
          outcome: "resolved",
          metadata: {
            transactionId,
            status: result.status,
            blockHeight: result.blockHeight
          }
        });
        return result;
      } catch (error) {
        const message = normalizeErrorMessage(error);
        publishDiagnostic(onDiagnostic, {
          stage: "WAITING FOR CONTRACT",
          event: "contract:indexer-confirmation:rejected",
          outcome: "rejected",
          metadata: { transactionId, resolved: false },
          error: message
        });
        throw error;
      }
    }
  };
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
  // Configure Midnight only after Lace has confirmed the expected network.
  setNetworkId("preprod");

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
  const publicDataProvider = createDiagnosticPublicDataProvider(indexerPublicDataProvider(
    configuration.indexerUri,
    configuration.indexerWsUri
  ), options.onDiagnostic);
  const proofProvider = createDiagnosticProofProvider(httpClientProofProvider(
    proofServer.url,
    zkConfigProvider
  ), options.onDiagnostic);
  const { walletProvider, midnightProvider } = createWalletProviders(connectedApi, addresses, options.onDiagnostic);

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
