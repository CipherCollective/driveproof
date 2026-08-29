import { describe, expect, it } from "vitest";
import {
  MidnightRuntimeError,
  createRuntimeConfiguration,
  normalizeErrorMessage,
  validatePreprodConfiguration
} from "./index";
import { checkProofServer, parseProofServerVersion } from "./proof-server";

function response(body: string, ok = true, status = 200): Response {
  return { ok, status, text: async () => body } as Response;
}

describe("Midnight runtime configuration", () => {
  it("normalizes string and structured non-Error failures", () => {
    expect(normalizeErrorMessage("wallet rejected")).toBe("wallet rejected");
    expect(normalizeErrorMessage({ message: "wallet rejected" })).toBe("wallet rejected");
    expect(normalizeErrorMessage({ code: "WALLET_REJECTED" })).toBe('{"code":"WALLET_REJECTED"}');
  });

  it("fails closed when Lace reports the wrong network", () => {
    expect(() => validatePreprodConfiguration(
      "preprod",
      { status: "connected", networkId: "preview" },
      {
        networkId: "preview",
        indexerUri: "https://indexer.preview.midnight.network/api/v4/graphql",
        indexerWsUri: "wss://indexer.preview.midnight.network/api/v4/graphql/ws",
        substrateNodeUri: "wss://rpc.preview.midnight.network"
      }
    )).toThrowError(MidnightRuntimeError);
  });

  it("surfaces proof-server unavailability", async () => {
    const result = await checkProofServer({
      url: "http://localhost:6300",
      fetchImpl: async () => { throw new Error("connect ECONNREFUSED"); }
    });

    expect(result).toMatchObject({ status: "unavailable", url: "http://localhost:6300" });
    expect(result.status === "unavailable" && result.message).toContain("unavailable");
  });

  it("surfaces an incompatible proof-server version", async () => {
    const result = await checkProofServer({
      url: "http://localhost:6300/",
      fetchImpl: async () => response('{"version":"8.0.3"}')
    });

    expect(result).toMatchObject({
      status: "incompatible",
      url: "http://localhost:6300",
      version: "8.0.3",
      expectedVersion: "8.1.0"
    });
  });

  it("recognizes the expected proof-server version and builds runtime configuration", async () => {
    expect(parseProofServerVersion("proof-server 8.1.0")).toBe("8.1.0");
    const proofServer = await checkProofServer({
      url: "http://localhost:6300",
      fetchImpl: async () => response("8.1.0")
    });
    expect(proofServer).toEqual({ status: "reachable", url: "http://localhost:6300", version: "8.1.0" });

    if (proofServer.status !== "reachable") throw new Error("test setup did not produce reachable proof server");
    expect(createRuntimeConfiguration({
      networkId: "preprod",
      indexerUri: "https://indexer.preprod.midnight.network/api/v4/graphql",
      indexerWsUri: "wss://indexer.preprod.midnight.network/api/v4/graphql/ws",
      substrateNodeUri: "wss://rpc.preprod.midnight.network",
      proverServerUri: "https://lace-proof-pub.preprod.midnight.network"
    }, proofServer)).toMatchObject({
      networkId: "preprod",
      proofServerUrl: "http://localhost:6300",
      proofServerVersion: "8.1.0",
      walletProofServerUrl: "https://lace-proof-pub.preprod.midnight.network"
    });
  });
});
