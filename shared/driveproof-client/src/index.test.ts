import { describe, expect, it } from "vitest";
import { MockDriveProofClient } from "./index";

describe("MockDriveProofClient", () => {
  it("verifies safe telemetry in mock mode", async () => {
    const client = new MockDriveProofClient();
    const attestation = await client.issueDemoTrip("safe");

    await expect(client.proveCompliance(attestation, "AUTO-SAFE-01")).resolves.toMatchObject({
      status: "verified"
    });
  });

  it("rejects unsafe and tampered fixtures without exposing a diagnosis contract", async () => {
    const client = new MockDriveProofClient();
    const unsafe = await client.issueDemoTrip("unsafe");
    const tampered = await client.issueDemoTrip("tampered");

    await expect(client.proveCompliance(unsafe, "AUTO-SAFE-01")).resolves.toEqual({
      status: "rejected",
      reason: "policy"
    });
    await expect(client.proveCompliance(tampered, "AUTO-SAFE-01")).resolves.toEqual({
      status: "rejected",
      reason: "unknown"
    });
  });

  it("rejects the same attestation and policy on the second submission", async () => {
    const client = new MockDriveProofClient();
    const attestation = await client.issueDemoTrip("safe");

    await client.proveCompliance(attestation, "AUTO-SAFE-01");
    await expect(client.proveCompliance(attestation, "AUTO-SAFE-01")).resolves.toEqual({
      status: "rejected",
      reason: "replay"
    });
  });
});
