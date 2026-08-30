import { describe, expect, it, vi } from "vitest";
import { POLICY_ID } from "@driveproof/fixtures";
import type { MidnightWalletBridge, MidnightWalletSession } from "@driveproof/midnight-wallet";
import type { MidnightRuntime } from "@driveproof/midnight-runtime";
import type { FinalizedTxData } from "@midnight-ntwrk/midnight-js-types";
import type { DriveProofPrivateState } from "driveproof-contract";
import {
  MidnightDriveProofClient,
  classifyMidnightProofRejection,
  type MidnightDriveProofClientAdapters
} from "./index";

const privateState: DriveProofPrivateState = {
  speed: 67n,
  attestationId: 42n,
  attestationSignature: {
    announcement: { x: 1n, y: 2n },
    response: 3n
  },
  attestorId: 1n,
  driverSecretKey: new Uint8Array([1, 2, 3])
};

function connectedWalletBridge(): MidnightWalletBridge {
  const session = {} as MidnightWalletSession;
  return {
    detect: async () => true,
    connect: async () => ({
      status: "connected",
      network: "preprod",
      walletName: "Lace",
      session
    }),
    disconnect: async () => undefined,
    getSession: () => session
  };
}

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

function configuredClient(
  proofError?: unknown
): { client: MidnightDriveProofClient; prove: ReturnType<typeof vi.fn> } {
  const prove = vi.fn(async () => {
    if (proofError !== undefined) throw proofError;
    return { public: finalizedTxData };
  });
  const runtime = {
    providers: {
      privateStateProvider: { set: vi.fn() },
      publicDataProvider: { queryContractState: vi.fn(async () => ({ data: {} })) }
    }
  } as unknown as MidnightRuntime;
  const adapters = {
    requestAttestorPrivateState: async () => privateState,
    loadCompiledDriveProof: async () => ({
      compiledContract: {},
      contractModule: {}
    }),
    createRuntime: async () => runtime,
    deployContract: async () => ({
      deployTxData: { public: { ...finalizedTxData, contractAddress: "contract_test_001" } },
      callTx: { proveCompliance: prove }
    }),
    findDeployedContract: async () => ({ callTx: { proveCompliance: prove } })
  } as unknown as MidnightDriveProofClientAdapters;

  return {
    client: new MidnightDriveProofClient({
      walletBridge: connectedWalletBridge(),
      adapters
    }),
    prove
  };
}

const finalizedTxData = {
  txId: "proof_tx_001",
  blockHeight: 2318673,
  status: "SucceedEntirely"
} as unknown as FinalizedTxData;

describe("MidnightDriveProofClient", () => {
  it("is explicitly Midnight mode and keeps one browser subject across attestor requests", async () => {
    const requests: Array<Record<string, unknown>> = [];
    let attestationNumber = 0;
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/provider-info")) {
        return jsonResponse({ providerId: 1, publicKey: { x: "1", y: "2" } });
      }

      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      requests.push(body);
      attestationNumber += 1;
      return jsonResponse({
        signature: { announcement: { x: "1", y: "2" }, response: "3" },
        message: {
          tripId: body.tripId,
          speed: body.tripId === "safe" ? "67" : "112",
          driverBinding: body.driverBinding,
          attestationId: String(attestationNumber)
        }
      });
    }) as unknown as typeof fetch;
    const client = new MidnightDriveProofClient({
      walletBridge: connectedWalletBridge(),
      fetch: fetchImpl
    });

    expect(client.mode).toBe("midnight");
    expect(client.displayName).toBe("REAL · MIDNIGHT PREPROD");
    await expect(client.connect()).resolves.toMatchObject({ status: "connected", network: "preprod" });

    const safe = await client.issueDemoTrip("safe");
    const unsafe = await client.issueDemoTrip("unsafe");

    expect(safe.samples).toHaveLength(0);
    expect(unsafe.samples).toHaveLength(0);
    expect(requests).toHaveLength(2);
    expect(requests[0]).toMatchObject({ tripId: "safe" });
    expect(requests[1]).toMatchObject({ tripId: "unsafe" });
    expect(requests[0].driverBinding).toBe(requests[1].driverBinding);
    expect(typeof requests[0].driverBinding).toBe("string");
    expect(requests[0]).not.toHaveProperty("speed");
    expect(requests[0]).not.toHaveProperty("driverSecretKey");
  });

  it("fails closed when configured away from Midnight Preprod", async () => {
    const connect = vi.fn(connectedWalletBridge().connect);
    const client = new MidnightDriveProofClient({
      networkId: "mainnet",
      walletBridge: { ...connectedWalletBridge(), connect }
    });

    await expect(client.connect()).resolves.toEqual({
      status: "error",
      message: "The DriveProof client only supports Midnight preprod."
    });
    expect(connect).not.toHaveBeenCalled();
  });

  it("invokes the current circuit without passing policyId and maps public receipt metadata", async () => {
    const { client, prove } = configuredClient();
    await client.connect();
    const attestation = await client.issueDemoTrip("safe");

    await expect(client.proveCompliance(attestation, POLICY_ID)).resolves.toEqual({
      status: "verified",
      receipt: {
        status: "verified",
        network: "preprod",
        transactionId: "proof_tx_001",
        blockHeight: 2318673,
        contractAddress: "contract_test_001",
        complianceStatus: "satisfied",
        policyId: POLICY_ID,
        attestorId: "1"
      }
    });
    expect(prove).toHaveBeenCalledWith();
  });

  it.each([
    ["Speed exceeds policy limit", "policy"],
    ["Invalid attestation signature", "integrity"],
    ["Attestation already used", "replay"]
  ] as const)("maps the known %s assertion to %s", async (message, reason) => {
    const { client } = configuredClient(new Error(message));
    await client.connect();
    const attestation = await client.issueDemoTrip("safe");

    await expect(client.proveCompliance(attestation, POLICY_ID)).resolves.toEqual({ status: "rejected", reason });
  });

  it("recognizes known assertions when nested and leaves unknown runtime failures genuine", async () => {
    expect(classifyMidnightProofRejection({ cause: new Error("Attestation already used") })).toBe("replay");

    const unknown = new Error("proof server disconnected");
    const { client } = configuredClient(unknown);
    await client.connect();
    const attestation = await client.issueDemoTrip("safe");

    await expect(client.proveCompliance(attestation, POLICY_ID)).rejects.toBe(unknown);
    expect(client.getLatestReceipt()).toBeUndefined();
  });
});
