import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PreprodTransactionDebugPage } from "./PreprodTransactionDebugPage";

const mocks = vi.hoisted(() => ({
  detect: vi.fn(),
  connect: vi.fn(),
  checkProofServer: vi.fn(),
  checkAttestorHealth: vi.fn(),
  requestAttestorPrivateState: vi.fn(),
  createSessionDriverSecret: vi.fn(),
  createMidnightRuntime: vi.fn(),
  deployContract: vi.fn(),
  findDeployedContract: vi.fn(),
  privateStateSet: vi.fn(),
  queryContractState: vi.fn(),
  proveCompliance: vi.fn(),
  attestation: {
    speed: 67n,
    attestationId: 7001n,
    attestationSignature: { announcement: { x: 1n, y: 2n }, response: 3n },
    attestorId: 1n,
    driverSecretKey: new Uint8Array(32).fill(7)
  },
  safeProof: {
    txId: "safe-proof-tx",
    txHash: "safe-proof-hash",
    blockHash: "safe-proof-block",
    blockHeight: 101,
    status: "SucceedEntirely"
  },
  deployment: {
    txId: "deployment-tx",
    txHash: "deployment-hash",
    blockHash: "deployment-block",
    blockHeight: 100,
    status: "SucceedEntirely",
    contractAddress: "contract-address"
  }
}));

vi.mock("@driveproof/attestor-client", () => ({
  checkAttestorHealth: mocks.checkAttestorHealth,
  createSessionDriverSecret: mocks.createSessionDriverSecret,
  requestAttestorPrivateState: mocks.requestAttestorPrivateState
}));

vi.mock("@driveproof/midnight-wallet", () => ({
  createLaceMidnightWalletBridge: vi.fn(() => ({
    detect: mocks.detect,
    connect: mocks.connect
  })),
  readMidnightWalletDiagnostics: vi.fn(),
  readMidnightWalletConfig: vi.fn(() => ({
    networkId: "preprod",
    expectedProofServerUrl: "http://localhost:6300"
  }))
}));

vi.mock("@driveproof/midnight-runtime", () => ({
  createMidnightRuntime: mocks.createMidnightRuntime,
  describeError: (error: unknown) => ({
    message: error instanceof Error ? error.message : String(error)
  }),
  normalizeErrorMessage: (error: unknown) => error instanceof Error ? error.message : String(error)
}));

vi.mock("@driveproof/midnight-runtime/proof-server", () => ({
  checkProofServer: mocks.checkProofServer
}));

vi.mock("@midnight-ntwrk/midnight-js-protocol/compact-js", () => {
  const compiled = {};
  return {
    CompiledContract: {
      make: vi.fn(() => ({ pipe: vi.fn(() => compiled) })),
      withWitnesses: vi.fn(() => undefined),
      withCompiledFileAssets: vi.fn(() => undefined)
    }
  };
});

vi.mock("@midnight-ntwrk/midnight-js-contracts", () => ({
  deployContract: mocks.deployContract,
  findDeployedContract: mocks.findDeployedContract
}));

vi.mock("driveproof-contract", () => ({
  DriveProof: { ledger: (data: unknown) => data },
  witnesses: {}
}));

const config = {
  networkId: "preprod",
  expectedProofServerUrl: "http://localhost:6300"
};

function resetHarnessMocks() {
  vi.clearAllMocks();
  mocks.detect.mockResolvedValue(true);
  mocks.connect.mockResolvedValue({
    status: "connected",
    network: "preprod",
    session: { wallet: {} }
  });
  mocks.checkProofServer.mockResolvedValue({
    status: "reachable",
    url: "http://localhost:6300",
    version: "8.1.0"
  });
  mocks.checkAttestorHealth.mockResolvedValue({
    status: "ready",
    url: "http://localhost:4000",
    providerId: 1
  });
  mocks.createSessionDriverSecret.mockReturnValue(mocks.attestation.driverSecretKey);
  mocks.requestAttestorPrivateState.mockResolvedValue(mocks.attestation);
  mocks.privateStateSet.mockResolvedValue(undefined);
  mocks.queryContractState.mockResolvedValue({ data: { complianceCount: 1n } });
  mocks.createMidnightRuntime.mockResolvedValue({
    providers: {
      privateStateProvider: { set: mocks.privateStateSet },
      publicDataProvider: { queryContractState: mocks.queryContractState }
    }
  });
  mocks.deployContract.mockResolvedValue({ deployTxData: { public: mocks.deployment } });
  mocks.findDeployedContract.mockResolvedValue({
    callTx: { proveCompliance: mocks.proveCompliance }
  });
  mocks.proveCompliance.mockResolvedValue({ public: mocks.safeProof });
}

async function prepareThroughDeployment() {
  await screen.findByRole("heading", { name: "Preprod transaction harness" });

  fireEvent.click(screen.getByRole("button", { name: "CONNECT LACE" }));
  await waitFor(() => expect(mocks.connect).toHaveBeenCalledTimes(1));

  fireEvent.click(screen.getByRole("button", { name: "BUILD PROVIDERS" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "PROVIDERS READY" })).toBeInTheDocument());

  fireEvent.click(screen.getByRole("button", { name: /REQUEST SAFE/ }));
  await waitFor(() => expect(mocks.requestAttestorPrivateState).toHaveBeenCalledTimes(1));

  fireEvent.click(screen.getByRole("button", { name: "DEPLOY TO PREPROD" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "CONTRACT DEPLOYED" })).toBeInTheDocument());
}

async function prepareReplayReady() {
  await prepareThroughDeployment();

  fireEvent.click(screen.getByRole("button", { name: "PROVE SAFE 67" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "REPLAY SAME ATTESTATION" })).toBeInTheDocument());
}

describe("PreprodTransactionDebugPage replay acceptance action", () => {
  beforeEach(() => {
    resetHarnessMocks();
  });

  it("only shows replay after a successful safe proof and count 1", async () => {
    render(<PreprodTransactionDebugPage config={config} />);

    expect(screen.queryByRole("button", { name: "REPLAY SAME ATTESTATION" })).not.toBeInTheDocument();
    await prepareThroughDeployment();
    expect(screen.queryByRole("button", { name: "REPLAY SAME ATTESTATION" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "PROVE SAFE 67" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "REPLAY SAME ATTESTATION" })).toBeInTheDocument());

    expect(screen.getByRole("button", { name: "REPLAY SAME ATTESTATION" })).toBeInTheDocument();
  });

  it("replays the existing attestation without requesting a new one and preserves success evidence", async () => {
    let rejectReplay: ((reason?: unknown) => void) | undefined;
    mocks.proveCompliance
      .mockResolvedValueOnce({ public: mocks.safeProof })
      .mockImplementationOnce(() => new Promise((_resolve, reject) => {
        rejectReplay = reject;
      }));

    render(<PreprodTransactionDebugPage config={config} />);
    await prepareReplayReady();

    fireEvent.click(screen.getByRole("button", { name: "REPLAY SAME ATTESTATION" }));
    await waitFor(() => expect(mocks.proveCompliance).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("button", { name: "TESTING REPLAY" })).toBeDisabled();
    expect(mocks.requestAttestorPrivateState).toHaveBeenCalledTimes(1);
    expect(mocks.privateStateSet).toHaveBeenCalledTimes(2);
    expect(mocks.privateStateSet.mock.calls[0][1]).toBe(mocks.attestation);
    expect(mocks.privateStateSet.mock.calls[1][1]).toBe(mocks.attestation);

    rejectReplay?.(new Error("failed assert: Attestation already used"));

    expect(await screen.findByText("Replay protection")).toBeInTheDocument();
    expect(screen.getByText("This attestation has already been used.")).toBeInTheDocument();
    expect(screen.getByText(/failed assert: Attestation already used/)).toBeInTheDocument();
    expect(screen.getByText("safe-proof-tx")).toBeInTheDocument();
    expect(screen.queryByText("replay-proof-tx")).not.toBeInTheDocument();
    expect(screen.getByText("Observed complianceCount").parentElement).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: /TRY UNSAFE/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /TRY TAMPER/ })).toBeInTheDocument();
  });

  it("keeps an unknown replay failure as a genuine error", async () => {
    mocks.proveCompliance
      .mockResolvedValueOnce({ public: mocks.safeProof })
      .mockRejectedValueOnce(new Error("replay provider unavailable"));

    render(<PreprodTransactionDebugPage config={config} />);
    await prepareReplayReady();

    fireEvent.click(screen.getByRole("button", { name: "REPLAY SAME ATTESTATION" }));

    expect(await screen.findByText("ERROR: replay provider unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Replay protection")).not.toBeInTheDocument();
    expect(screen.getByText("safe-proof-tx")).toBeInTheDocument();
    expect(screen.getByText("Observed complianceCount").parentElement).toHaveTextContent("1");
  });
});
