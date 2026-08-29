import { describe, expect, it } from "vitest";
import {
  DEFAULT_MIDNIGHT_NETWORK,
  DEFAULT_PROOF_SERVER_URL,
  classifyNetwork,
  isSupportedConnectorApiVersion,
  readMidnightWalletConfig
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
});
