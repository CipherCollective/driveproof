import { describe, expect, it } from "vitest";
import {
  DEFAULT_MIDNIGHT_NETWORK,
  DEFAULT_PROOF_SERVER_URL,
  classifyNetwork,
  isSupportedConnectorApiVersion,
  readMidnightWalletConfig,
  readMidnightWalletDiagnostics,
  WALLET_SYNC_UNAVAILABLE_MESSAGE
} from "./index";

describe("Midnight wallet configuration", () => {
  it("uses the safe Preprod/local proof-server defaults", () => {
    expect(readMidnightWalletConfig({})).toEqual({
      networkId: DEFAULT_MIDNIGHT_NETWORK,
      expectedProofServerUrl: DEFAULT_PROOF_SERVER_URL
    });
  });

  it("reads only the public wrapper configuration", () => {
    expect(readMidnightWalletConfig({
      VITE_MIDNIGHT_NETWORK: " preprod ",
      VITE_MIDNIGHT_PROOF_SERVER: " http://localhost:6300 "
    })).toEqual({
      networkId: "preprod",
      expectedProofServerUrl: "http://localhost:6300"
    });
  });
});

describe("Midnight wallet state logic", () => {
  it("accepts connector API v4 and rejects incompatible versions", () => {
    expect(isSupportedConnectorApiVersion("4.0.1")).toBe(true);
    expect(isSupportedConnectorApiVersion("4.9.0")).toBe(true);
    expect(isSupportedConnectorApiVersion("4.0.0")).toBe(false);
    expect(isSupportedConnectorApiVersion("4.0.1-beta.1")).toBe(false);
    expect(isSupportedConnectorApiVersion("3.1.0")).toBe(false);
    expect(isSupportedConnectorApiVersion("4.0")).toBe(false);
  });

  it("requires the observed wallet network to match the requested network", () => {
    expect(classifyNetwork("preprod", "preprod")).toBe("connected");
    expect(classifyNetwork("preprod", "preview")).toBe("wrong-network");
  });

  it("maps read-only Connector API state without exposing extra wallet data", async () => {
    const wallet = {
      getConnectionStatus: async () => ({ status: "connected" as const, networkId: "preprod" }),
      getDustBalance: async () => ({ balance: 123n, cap: 456n }),
      getTxHistory: async () => [
        { txHash: "0xpending", txStatus: { status: "pending" as const } },
        { txHash: "0xfinalized", txStatus: { status: "finalized" as const, executionStatus: {} } }
      ],
      getConfiguration: async () => ({
        networkId: "preprod",
        indexerUri: "https://indexer.preprod.example",
        indexerWsUri: "wss://indexer.preprod.example",
        substrateNodeUri: "wss://rpc.preprod.example",
        proverServerUri: "http://localhost:6300"
      })
    } as unknown as Parameters<typeof readMidnightWalletDiagnostics>[0];

    await expect(readMidnightWalletDiagnostics(wallet)).resolves.toEqual({
      methodAvailability: {
        getConnectionStatus: "function",
        getConfiguration: "function",
        getDustBalance: "function",
        getTxHistory: "function"
      },
      connectionStatus: { status: "supported", value: { status: "connected", networkId: "preprod" } },
      dustBalance: { status: "supported", value: { balance: "123", cap: "456" } },
      txHistory: {
        status: "supported",
        value: [
          { txHash: "0xpending", status: "pending" },
          { txHash: "0xfinalized", status: "finalized" }
        ]
      },
      historyPage: 0,
      historyPageSize: 10,
      historyCorrelation: "Recent history is not automatically attributed to a deployment attempt; compare transaction hashes manually.",
      configuration: {
        status: "supported",
        value: {
          networkId: "preprod",
          indexerUri: "https://indexer.preprod.example",
          substrateNodeUri: "wss://rpc.preprod.example",
          proverServerUri: "http://localhost:6300"
        }
      },
      syncStatus: { available: false, message: WALLET_SYNC_UNAVAILABLE_MESSAGE }
    });
  });

  it("keeps unsupported and failing diagnostic methods independent", async () => {
    const wallet = {
      getConnectionStatus: async () => { throw new Error("Method not implemented."); },
      getConfiguration: async () => ({
        networkId: "preprod",
        indexerUri: "https://indexer.preprod.example",
        indexerWsUri: "wss://indexer.preprod.example",
        substrateNodeUri: "wss://rpc.preprod.example"
      }),
      getDustBalance: async () => { throw new Error("Method not implemented."); },
      getTxHistory: async () => { throw new Error("history unavailable"); }
    } as unknown as Parameters<typeof readMidnightWalletDiagnostics>[0];

    await expect(readMidnightWalletDiagnostics(wallet)).resolves.toMatchObject({
      connectionStatus: { status: "unsupported", message: "Method not implemented." },
      configuration: { status: "supported" },
      dustBalance: { status: "unsupported", message: "Method not implemented." },
      txHistory: { status: "error", message: "history unavailable" }
    });
  });
});
