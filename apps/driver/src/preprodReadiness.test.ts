import { describe, expect, it } from "vitest";
import type { WalletConnectionState } from "@driveproof/midnight-wallet";
import {
  attestorReadiness,
  laceReadiness,
  networkReadiness,
  proofServerReadiness,
  safeAttestationReadiness,
  walletReadiness
} from "./preprodReadiness";

describe("Preprod readiness presentation", () => {
  it("maps the Lace detection check without implying a wallet connection", () => {
    expect(laceReadiness(true)).toMatchObject({ label: "DETECTED", tone: "good" });
    expect(laceReadiness(false)).toMatchObject({ label: "MISSING", tone: "bad" });
  });

  it("maps wallet and network state independently", () => {
    const connected = { status: "connected", network: "preprod", session: {} } as WalletConnectionState;
    expect(walletReadiness(connected)).toMatchObject({ label: "CONNECTED", tone: "good" });
    expect(networkReadiness(connected, "preprod")).toMatchObject({ label: "PREPROD", tone: "good" });
    expect(networkReadiness({ status: "wrong-network", network: "undeployed", expectedNetwork: "preprod" }, "preprod"))
      .toMatchObject({ label: "WRONG NETWORK", tone: "bad" });
    expect(networkReadiness({ status: "disconnected" }, "preprod"))
      .toMatchObject({ label: "NOT VALIDATED", tone: "neutral" });
  });

  it("shows proof-server version mismatches instead of a generic ready state", () => {
    expect(proofServerReadiness("checking")).toMatchObject({ label: "CHECKING", tone: "neutral" });
    expect(proofServerReadiness({ status: "reachable", url: "http://localhost:6300", version: "8.1.0" }))
      .toMatchObject({ label: "LOCAL 8.1.0", tone: "good" });
    expect(proofServerReadiness({
      status: "incompatible",
      url: "http://localhost:6300",
      version: "8.2.0",
      expectedVersion: "8.1.0",
      message: "incompatible"
    })).toMatchObject({
      label: "WRONG VERSION",
      detail: "expected 8.1.0 · actual 8.2.0",
      tone: "bad"
    });
  });

  it("maps attestor and safe-attestation checks to independent statuses", () => {
    expect(attestorReadiness("checking")).toMatchObject({ label: "CHECKING", tone: "neutral" });
    expect(attestorReadiness({ status: "ready", url: "http://localhost:4000", providerId: 1 }))
      .toMatchObject({ label: "READY", tone: "good" });
    expect(attestorReadiness({ status: "unavailable", url: "http://localhost:4000", message: "offline" }))
      .toMatchObject({ label: "UNAVAILABLE", tone: "bad" });
    expect(safeAttestationReadiness(true)).toMatchObject({ label: "LOADED", tone: "good" });
    expect(safeAttestationReadiness(false)).toMatchObject({ label: "NOT LOADED", tone: "neutral" });
  });
});
