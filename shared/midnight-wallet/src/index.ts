import type {
  ConnectedAPI,
  Configuration,
  ConnectionStatus,
  HistoryEntry,
  InitialAPI
} from "@midnight-ntwrk/dapp-connector-api";

export const DEFAULT_MIDNIGHT_NETWORK = "preprod";
export const DEFAULT_PROOF_SERVER_URL = "http://localhost:6300";
export const SUPPORTED_CONNECTOR_API_RANGE = ">=4.0.1 <5.0.0";
export const WALLET_SYNC_UNAVAILABLE_MESSAGE =
  "Wallet sync must be checked in Lace UI; Connector API does not expose authoritative sync percentage.";

export type MidnightWalletConfig = {
  networkId: string;
  expectedProofServerUrl: string;
};

export type MidnightWalletSession = {
  connectorId: string;
  walletName: string;
  apiVersion: string;
  initialAPI: InitialAPI;
  wallet: ConnectedAPI;
  configuration: Configuration;
  connectionStatus: Extract<ConnectionStatus, { status: "connected" }>;
  networkId: string;
};

export type WalletConnectionState =
  | { status: "disconnected" }
  | { status: "connecting" }
  | ({ status: "connected"; network: string; walletName?: string; addressOrIdentifier?: string } & {
      session: MidnightWalletSession;
    })
  | { status: "wrong-network"; network: string; expectedNetwork: string; walletName?: string }
  | { status: "unavailable"; reason: string }
  | { status: "error"; message: string };

export type WalletDiagnosticResult<T> =
  | { status: "supported"; value: T }
  | { status: "unsupported"; message: "Method not implemented." }
  | { status: "error"; message: string };

export type MidnightWalletDiagnostics = {
  methodAvailability: {
    getConnectionStatus: string;
    getConfiguration: string;
    getDustBalance: string;
    getTxHistory: string;
  };
  connectionStatus: WalletDiagnosticResult<{
    status: "connected" | "disconnected";
    networkId?: string;
  }>;
  configuration: WalletDiagnosticResult<{
    networkId: string;
    indexerUri: string;
    substrateNodeUri: string;
    proverServerUri?: string;
  }>;
  dustBalance: WalletDiagnosticResult<{
    balance: string;
    cap: string;
  }>;
  txHistory: WalletDiagnosticResult<Array<{
    txHash: string;
    status: HistoryEntry["txStatus"]["status"];
  }>>;
  historyPage: number;
  historyPageSize: number;
  historyCorrelation: string;
  syncStatus: {
    available: false;
    message: typeof WALLET_SYNC_UNAVAILABLE_MESSAGE;
  };
};

export interface MidnightWalletBridge {
  detect(): Promise<boolean>;
  connect(): Promise<WalletConnectionState>;
  disconnect(): Promise<void>;
  getSession(): MidnightWalletSession | undefined;
}

type MidnightConnectorWindow = Window & {
  midnight?: Record<string, InitialAPI>;
};

type ConnectorCandidate = {
  id: string;
  api: InitialAPI;
};

export function readMidnightWalletConfig(
  env: Record<string, string | undefined> = import.meta.env
): MidnightWalletConfig {
  return {
    networkId: env.VITE_MIDNIGHT_NETWORK?.trim() || DEFAULT_MIDNIGHT_NETWORK,
    expectedProofServerUrl: env.VITE_MIDNIGHT_PROOF_SERVER?.trim() || DEFAULT_PROOF_SERVER_URL
  };
}

export function isSupportedConnectorApiVersion(apiVersion: string): boolean {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(apiVersion);
  if (!match) return false;

  const [, major, minor, patch] = match.map(Number);
  return major === 4 && (minor > 0 || (minor === 0 && patch >= 1));
}

export function classifyNetwork(expectedNetwork: string, observedNetwork: string): "connected" | "wrong-network" {
  return expectedNetwork === observedNetwork ? "connected" : "wrong-network";
}

const METHOD_NOT_IMPLEMENTED_MESSAGE = "Method not implemented.";

function diagnosticErrorMessage(error: unknown): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error !== null && typeof error === "object") {
    const record = error as Record<string, unknown>;
    for (const key of ["message", "tag", "code", "name"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return "Unknown wallet diagnostic error";
}

function isMethodNotImplemented(message: string): boolean {
  return message.trim().replace(/[.]$/, "").toLowerCase() === "method not implemented";
}

async function readDiagnosticMethod<T>(invoke: (() => Promise<T>) | undefined): Promise<WalletDiagnosticResult<T>> {
  if (!invoke) return { status: "unsupported", message: METHOD_NOT_IMPLEMENTED_MESSAGE };

  try {
    return { status: "supported", value: await invoke() };
  } catch (error) {
    const message = diagnosticErrorMessage(error);
    return isMethodNotImplemented(message)
      ? { status: "unsupported", message: METHOD_NOT_IMPLEMENTED_MESSAGE }
      : { status: "error", message };
  }
}

/**
 * Reads only non-secret wallet state exposed by the Connector API. This does
 * not construct, balance, sign, or submit a transaction.
 */
export async function readMidnightWalletDiagnostics(
  wallet: ConnectedAPI,
  pageNumber = 0,
  pageSize = 10
): Promise<MidnightWalletDiagnostics> {
  const methodAvailability = {
    getConnectionStatus: typeof wallet.getConnectionStatus,
    getConfiguration: typeof wallet.getConfiguration,
    getDustBalance: typeof wallet.getDustBalance,
    getTxHistory: typeof wallet.getTxHistory
  };
  const connectionStatus = await readDiagnosticMethod(
    typeof wallet.getConnectionStatus === "function" ? () => wallet.getConnectionStatus() : undefined
  );
  const configuration = await readDiagnosticMethod(
    typeof wallet.getConfiguration === "function" ? () => wallet.getConfiguration() : undefined
  );
  const dustBalance = await readDiagnosticMethod(
    typeof wallet.getDustBalance === "function" ? () => wallet.getDustBalance() : undefined
  );
  const history = await readDiagnosticMethod(
    typeof wallet.getTxHistory === "function" ? () => wallet.getTxHistory(pageNumber, pageSize) : undefined
  );

  const mappedConnectionStatus: WalletDiagnosticResult<{
    status: "connected" | "disconnected";
    networkId?: string;
  }> = connectionStatus.status === "supported"
    ? {
        status: "supported",
        value: connectionStatus.value.status === "connected"
          ? { status: "connected", networkId: connectionStatus.value.networkId }
          : { status: "disconnected" }
      }
    : connectionStatus;
  const mappedConfiguration: WalletDiagnosticResult<{
    networkId: string;
    indexerUri: string;
    substrateNodeUri: string;
    proverServerUri?: string;
  }> = configuration.status === "supported"
    ? {
        status: "supported",
        value: {
          networkId: configuration.value.networkId,
          indexerUri: configuration.value.indexerUri,
          substrateNodeUri: configuration.value.substrateNodeUri,
          ...(configuration.value.proverServerUri ? { proverServerUri: configuration.value.proverServerUri } : {})
        }
      }
    : configuration;
  const mappedDustBalance: WalletDiagnosticResult<{ balance: string; cap: string }> = dustBalance.status === "supported"
    ? {
        status: "supported",
        value: {
          balance: dustBalance.value.balance.toString(),
          cap: dustBalance.value.cap.toString()
        }
      }
    : dustBalance;
  const mappedHistory: WalletDiagnosticResult<Array<{
    txHash: string;
    status: HistoryEntry["txStatus"]["status"];
  }>> = history.status === "supported"
    ? {
        status: "supported",
        value: history.value.map(({ txHash, txStatus }) => ({ txHash, status: txStatus.status }))
      }
    : history;

  return {
    methodAvailability,
    connectionStatus: mappedConnectionStatus,
    configuration: mappedConfiguration,
    dustBalance: mappedDustBalance,
    txHistory: mappedHistory,
    historyPage: pageNumber,
    historyPageSize: pageSize,
    historyCorrelation: "Recent history is not automatically attributed to a deployment attempt; compare transaction hashes manually.",
    syncStatus: {
      available: false,
      message: WALLET_SYNC_UNAVAILABLE_MESSAGE
    }
  };
}

function getInitialAPIs(): ConnectorCandidate[] {
  if (typeof window === "undefined") return [];

  const midnight = (window as MidnightConnectorWindow).midnight;
  if (!midnight) return [];

  return Object.entries(midnight).flatMap(([id, api]) => {
    if (
      !api ||
      typeof api.name !== "string" ||
      typeof api.icon !== "string" ||
      typeof api.apiVersion !== "string" ||
      typeof api.connect !== "function" ||
      !isSupportedConnectorApiVersion(api.apiVersion)
    ) {
      return [];
    }
    return [{ id, api }];
  });
}

function selectLaceConnector(candidates: ConnectorCandidate[]): ConnectorCandidate | undefined {
  return candidates.find(({ id, api }) => {
    const label = `${id} ${api.name} ${api.rdns ?? ""}`.toLowerCase();
    return label.includes("lace");
  }) ?? candidates[0];
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class LaceMidnightWalletBridge implements MidnightWalletBridge {
  private readonly config: MidnightWalletConfig;
  private session: MidnightWalletSession | undefined;

  constructor(config: MidnightWalletConfig = readMidnightWalletConfig()) {
    this.config = config;
  }

  async detect(): Promise<boolean> {
    return getInitialAPIs().length > 0;
  }

  async connect(): Promise<WalletConnectionState> {
    const candidates = getInitialAPIs();
    if (candidates.length === 0) {
      return {
        status: "unavailable",
        reason: `No compatible Midnight wallet connector found. Expected API ${SUPPORTED_CONNECTOR_API_RANGE}.`
      };
    }

    const selected = selectLaceConnector(candidates);
    if (!selected) {
      return { status: "unavailable", reason: "No compatible Midnight wallet connector found." };
    }

    try {
      const wallet = await selected.api.connect(this.config.networkId);
      const [configuration, connectionStatus] = await Promise.all([
        wallet.getConfiguration(),
        wallet.getConnectionStatus()
      ]);

      if (connectionStatus.status !== "connected") {
        this.session = undefined;
        return { status: "error", message: "Lace did not report a connected wallet status." };
      }

      const statusNetwork = connectionStatus.networkId;
      const configurationNetwork = configuration.networkId;
      if (
        classifyNetwork(this.config.networkId, statusNetwork) === "wrong-network" ||
        classifyNetwork(this.config.networkId, configurationNetwork) === "wrong-network"
      ) {
        this.session = undefined;
        return {
          status: "wrong-network",
          network: statusNetwork,
          expectedNetwork: this.config.networkId,
          walletName: selected.api.name
        };
      }

      this.session = {
        connectorId: selected.id,
        walletName: selected.api.name,
        apiVersion: selected.api.apiVersion,
        initialAPI: selected.api,
        wallet,
        configuration,
        connectionStatus,
        networkId: statusNetwork
      };

      return {
        status: "connected",
        network: statusNetwork,
        walletName: selected.api.name,
        session: this.session
      };
    } catch (error) {
      this.session = undefined;
      return { status: "error", message: describeError(error) };
    }
  }

  async disconnect(): Promise<void> {
    // The connector API does not expose a disconnect/revoke method. Clearing
    // this local handle prevents the app from reusing a stale session while
    // leaving Lace's own extension authorization untouched.
    this.session = undefined;
  }

  getSession(): MidnightWalletSession | undefined {
    return this.session;
  }
}

export function createLaceMidnightWalletBridge(
  config: MidnightWalletConfig = readMidnightWalletConfig()
): MidnightWalletBridge {
  return new LaceMidnightWalletBridge(config);
}
