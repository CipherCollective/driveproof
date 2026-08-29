import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ExternalLink, RefreshCw, TriangleAlert, WalletCards } from "lucide-react";
import { requestAttestorPrivateState, type AttestorTripId } from "@driveproof/attestor-client";
import {
  createLaceMidnightWalletBridge,
  readMidnightWalletConfig,
  type MidnightWalletConfig,
  type WalletConnectionState
} from "@driveproof/midnight-wallet";
import { createMidnightRuntime } from "@driveproof/midnight-runtime";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import type { Contract as MidnightContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { deployContract, findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import type { FinalizedTxData } from "@midnight-ntwrk/midnight-js-types";
import { DriveProof, witnesses, type DriveProofPrivateState } from "driveproof-contract";

const ATTESTOR_URL = import.meta.env.VITE_MIDNIGHT_ATTESTOR_URL?.trim() || "http://localhost:4000";
const PRIVATE_STATE_ID = "driveproofPrivateState";
const ZK_CONFIG_BASE_PATH = "/contract/compiled/driveproof";
const SPEED_LIMIT = 80n;
const ATTESTOR_ID = 1n;
const ATTESTOR_PUBLIC_KEY = {
  x: 24963340820686704563874210959139693074205807300853579178326830224576306549782n,
  y: 13555256131498264457493147271978939536039390820876751212247441513267437911171n
};

type DriveProofContract = DriveProof.Contract<DriveProofPrivateState>;
type DriveProofCircuitId = MidnightContract.ProvableCircuitId<DriveProofContract>;
type DriveProofRuntime = Awaited<ReturnType<typeof createMidnightRuntime<DriveProofCircuitId, typeof PRIVATE_STATE_ID, DriveProofPrivateState>>>;
type PublicTransaction = Pick<FinalizedTxData, "txId" | "txHash" | "blockHash" | "blockHeight" | "status">;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function createStoragePassword(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `DriveProof!${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function publicTransaction(data: FinalizedTxData): PublicTransaction {
  return {
    txId: data.txId,
    txHash: data.txHash,
    blockHash: data.blockHash,
    blockHeight: data.blockHeight,
    status: data.status
  };
}

function createCompiledDriveProof() {
  return CompiledContract.make<DriveProofContract, DriveProofPrivateState>("DriveProof", DriveProof.Contract).pipe(
    CompiledContract.withWitnesses(witnesses),
    // The official browser pattern resolves contract file assets from the app
    // origin. The FetchZkConfigProvider below uses the generated contract path.
    CompiledContract.withCompiledFileAssets(window.location.origin)
  );
}

function statusClass(status: boolean | undefined): string {
  return status ? "debug-good" : "";
}

export function PreprodTransactionDebugPage({ config }: { config?: MidnightWalletConfig }) {
  const resolvedConfig = useMemo(() => config ?? readMidnightWalletConfig(), [config]);
  const bridge = useMemo(() => createLaceMidnightWalletBridge(resolvedConfig), [resolvedConfig]);
  const compiledContract = useMemo(() => createCompiledDriveProof(), []);
  const [detected, setDetected] = useState(false);
  const [connection, setConnection] = useState<WalletConnectionState>({ status: "disconnected" });
  const [attestation, setAttestation] = useState<DriveProofPrivateState>();
  const [runtime, setRuntime] = useState<DriveProofRuntime>();
  const [contractAddress, setContractAddress] = useState<string>();
  const [deployment, setDeployment] = useState<PublicTransaction>();
  const [proof, setProof] = useState<PublicTransaction>();
  const [complianceCount, setComplianceCount] = useState<string>();
  const [operation, setOperation] = useState("idle");
  const [error, setError] = useState<string>();
  const privateStatePassword = useRef<string | undefined>(undefined);

  const walletConnected = connection.status === "connected";
  const networkReady = walletConnected && connection.network === resolvedConfig.networkId;
  const session = connection.status === "connected" ? connection.session : undefined;

  useEffect(() => {
    let cancelled = false;
    void bridge.detect().then((isDetected) => {
      if (!cancelled) setDetected(isDetected);
    });
    return () => { cancelled = true; };
  }, [bridge]);

  async function detect() {
    setDetected(await bridge.detect());
  }

  async function connect() {
    setError(undefined);
    setOperation("connecting");
    try {
      const next = await bridge.connect();
      setConnection(next);
      setDetected(next.status !== "unavailable");
    } catch (connectError) {
      setError(errorMessage(connectError));
      setConnection({ status: "error", message: errorMessage(connectError) });
    } finally {
      setOperation("idle");
    }
  }

  async function requestAttestation(tripId: AttestorTripId) {
    setError(undefined);
    setOperation(`attesting-${tripId}`);
    try {
      const state = await requestAttestorPrivateState(ATTESTOR_URL, tripId);
      setAttestation(state);
    } catch (attestorError) {
      setError(errorMessage(attestorError));
    } finally {
      setOperation("idle");
    }
  }

  async function buildRuntime() {
    if (!session) {
      setError("Connect Lace before constructing Midnight providers.");
      return;
    }

    setError(undefined);
    setOperation("building-runtime");
    try {
      if (!privateStatePassword.current) privateStatePassword.current = createStoragePassword();
      const nextRuntime = await createMidnightRuntime<DriveProofCircuitId, typeof PRIVATE_STATE_ID, DriveProofPrivateState>(
        session.wallet,
        {
          networkId: resolvedConfig.networkId,
          proofServerUrl: resolvedConfig.expectedProofServerUrl,
          zkConfigBaseUrl: `${window.location.origin}${ZK_CONFIG_BASE_PATH}`,
          privateState: {
            privateStoragePasswordProvider: () => privateStatePassword.current ?? ""
          }
        }
      );
      setRuntime(nextRuntime);
    } catch (runtimeError) {
      setError(errorMessage(runtimeError));
    } finally {
      setOperation("idle");
    }
  }

  async function deploy() {
    if (!runtime || !attestation) {
      setError("Request the safe attestation and construct providers first.");
      return;
    }

    setError(undefined);
    setOperation("deploying");
    try {
      const result = await deployContract(runtime.providers, {
        compiledContract,
        args: [SPEED_LIMIT, ATTESTOR_ID, ATTESTOR_PUBLIC_KEY],
        privateStateId: PRIVATE_STATE_ID,
        initialPrivateState: attestation
      });
      setContractAddress(result.deployTxData.public.contractAddress);
      setDeployment(publicTransaction(result.deployTxData.public));
    } catch (deploymentError) {
      setError(errorMessage(deploymentError));
    } finally {
      setOperation("idle");
    }
  }

  async function joinAndProve(nextState: DriveProofPrivateState, operationName: string) {
    if (!runtime || !contractAddress) {
      setError("Deploy the contract and construct providers first.");
      return;
    }

    setError(undefined);
    setOperation(operationName);
    try {
      const joined = await findDeployedContract(runtime.providers, {
        compiledContract,
        contractAddress,
        privateStateId: PRIVATE_STATE_ID
      });
      // findDeployedContract scopes the provider to this contract address
      // before the next witness state is written.
      await runtime.providers.privateStateProvider.set(PRIVATE_STATE_ID, nextState);
      const result = await joined.callTx.proveCompliance();
      setProof(publicTransaction(result.public));
      const currentState = await runtime.providers.publicDataProvider.queryContractState(contractAddress);
      if (!currentState) throw new Error("The deployed contract state was not returned by the indexer.");
      setComplianceCount(DriveProof.ledger(currentState.data).complianceCount.toString());
    } catch (proofError) {
      setError(errorMessage(proofError));
    } finally {
      setOperation("idle");
    }
  }

  async function proveSafe() {
    if (!attestation) {
      setError("Request the safe attestation first.");
      return;
    }
    await joinAndProve(attestation, "proving-safe");
  }

  async function proveUnsafe() {
    try {
      const unsafeState = await requestAttestorPrivateState(ATTESTOR_URL, "unsafe");
      await joinAndProve(unsafeState, "proving-unsafe");
    } catch (attestorError) {
      setError(errorMessage(attestorError));
    }
  }

  async function proveTampered() {
    try {
      const unsafeState = await requestAttestorPrivateState(ATTESTOR_URL, "unsafe");
      await joinAndProve({ ...unsafeState, speed: 71n }, "proving-tampered");
    } catch (attestorError) {
      setError(errorMessage(attestorError));
    }
  }

  const busy = operation !== "idle";
  const connectionMessage = connection.status === "error"
    ? connection.message
    : connection.status === "wrong-network"
      ? `Lace reported ${connection.network}; expected ${connection.expectedNetwork}.`
      : connection.status === "unavailable"
        ? connection.reason
        : undefined;

  return (
    <div className="wallet-debug-shell">
      <main className="wallet-debug-card">
        <header className="wallet-debug-header">
          <a className="wallet-debug-back" href="/wallet-debug"><ArrowLeft size={15} /> Wallet debug</a>
          <div className="eyebrow">ENGINEERING INSTRUMENTATION · DEV ONLY</div>
        </header>

        <div className="wallet-debug-intro">
          <div className="wallet-debug-icon"><WalletCards size={22} /></div>
          <div>
            <div className="eyebrow">FIRST REAL DRIVEPROOF TRANSACTION</div>
            <h1>Preprod transaction harness</h1>
            <p>Real Lace, Preprod, generated Compact artifacts, and the local 8.1.0 proof server. No mock fallback.</p>
          </div>
        </div>

        <section className="wallet-debug-status-grid" aria-label="Real transaction readiness">
          <div className="wallet-debug-status"><span>Lace extension</span><strong className={statusClass(detected)}>{detected ? "DETECTED" : "NOT DETECTED"}</strong></div>
          <div className="wallet-debug-status"><span>Wallet</span><strong className={statusClass(walletConnected)}>{walletConnected ? "CONNECTED" : "DISCONNECTED"}</strong></div>
          <div className="wallet-debug-status"><span>Network</span><strong className={statusClass(networkReady)}>{networkReady ? "PREPROD" : connection.status === "wrong-network" ? "WRONG NETWORK" : "PREPROD TARGET"}</strong></div>
          <div className="wallet-debug-status"><span>Proof server</span><strong>LOCAL · 8.1.0</strong></div>
          <div className="wallet-debug-status"><span>Contract</span><strong className={statusClass(Boolean(contractAddress))}>{contractAddress ? "DEPLOYED" : "NOT DEPLOYED"}</strong></div>
        </section>

        <section className="wallet-debug-panel">
          <div className="wallet-debug-panel-heading"><span className="eyebrow">1 · LACE + PROVIDERS</span><span className={networkReady ? "debug-good" : "debug-neutral"}>{networkReady ? "READY" : "PREPARE"}</span></div>
          <p>Authorize this browser in Lace, validate Preprod, check <code>{resolvedConfig.expectedProofServerUrl}/version</code>, then construct the real provider bundle.</p>
          <div className="wallet-debug-actions">
            <button className="debug-primary-button" disabled={busy || walletConnected} onClick={() => void connect()} type="button">
              {operation === "connecting" ? "CONNECTING TO LACE" : "CONNECT LACE"} {operation === "connecting" ? <RefreshCw className="debug-spin" size={15} /> : <ExternalLink size={15} />}
            </button>
            <button className="debug-secondary-button" disabled={busy || !walletConnected || Boolean(runtime)} onClick={() => void buildRuntime()} type="button">{operation === "building-runtime" ? "BUILDING PROVIDERS" : runtime ? "PROVIDERS READY" : "BUILD PROVIDERS"}</button>
            <button className="debug-refresh-button" disabled={busy} onClick={() => void detect()} type="button" aria-label="Refresh Lace detection"><RefreshCw size={15} /></button>
          </div>
        </section>

        <section className="wallet-debug-panel">
          <div className="wallet-debug-panel-heading"><span className="eyebrow">2 · ISSUER ATTESTATION</span><span className={attestation ? "debug-good" : "debug-neutral"}>{attestation ? "LOADED IN MEMORY" : "NOT REQUESTED"}</span></div>
          <p>Calls the local attestor with a trip identifier. The browser never supplies speed and never receives the provider secret.</p>
          <div className="wallet-debug-actions">
            <button className="debug-secondary-button" disabled={busy} onClick={() => void requestAttestation("safe")} type="button">{operation === "attesting-safe" ? "REQUESTING SAFE" : "REQUEST SAFE · EXPECT 67"}</button>
            <button className="debug-secondary-button" disabled={busy} onClick={() => void requestAttestation("unsafe")} type="button">{operation === "attesting-unsafe" ? "REQUESTING UNSAFE" : "REQUEST UNSAFE · EXPECT 112"}</button>
          </div>
        </section>

        <section className="wallet-debug-panel">
          <div className="wallet-debug-panel-heading"><span className="eyebrow">3 · DEPLOY CONSTRUCTOR-BOUND CONTRACT</span><span className={deployment ? "debug-good" : "debug-neutral"}>{deployment ? "CONFIRMED" : "NOT SUBMITTED"}</span></div>
          <p>Exact constructor: <code>speedLimit=80</code>, <code>attestorId=1</code>, and the handoff public key. Lace approval is required for the real deployment transaction.</p>
          <button className="debug-primary-button" disabled={busy || !runtime || !attestation || Boolean(deployment)} onClick={() => void deploy()} type="button">{operation === "deploying" ? "DEPLOYING · APPROVE LACE" : deployment ? "CONTRACT DEPLOYED" : "DEPLOY TO PREPROD"} {operation === "deploying" && <RefreshCw className="debug-spin" size={15} />}</button>
          {contractAddress && <div className="wallet-debug-details"><div><span>Contract address</span><strong>{contractAddress}</strong></div></div>}
          {deployment && <TransactionDetails transaction={deployment} label="Deployment transaction" />}
        </section>

        <section className="wallet-debug-panel">
          <div className="wallet-debug-panel-heading"><span className="eyebrow">4 · PROVE SAFE 67</span><span className={proof && complianceCount === "1" ? "debug-good" : "debug-neutral"}>{complianceCount === "1" ? "LEDGER COUNT · 1" : "NOT SUBMITTED"}</span></div>
          <p>Stores the attestor response through the encrypted private-state provider, joins the deployed contract, and invokes generated <code>proveCompliance()</code>.</p>
          <button className="debug-primary-button" disabled={busy || !contractAddress || !runtime || !attestation || complianceCount === "1"} onClick={() => void proveSafe()} type="button">{operation === "proving-safe" ? "PROVING · APPROVE LACE" : "PROVE SAFE 67"} {operation === "proving-safe" && <RefreshCw className="debug-spin" size={15} />}</button>
          {proof && <TransactionDetails transaction={proof} label="Safe proof transaction" />}
          {complianceCount && <div className="wallet-debug-details"><div><span>Observed complianceCount</span><strong className={complianceCount === "1" ? "debug-good" : ""}>{complianceCount}</strong></div></div>}
        </section>

        {complianceCount === "1" && (
          <section className="wallet-debug-panel">
            <div className="wallet-debug-panel-heading"><span className="eyebrow">FAILURE BOUNDARIES</span><span className="debug-neutral">NO SUCCESS EXPECTED</span></div>
            <p>These buttons use the real witness path. A rejection is the expected result; no rejection is turned into a fabricated transaction.</p>
            <div className="wallet-debug-actions">
              <button className="debug-secondary-button" disabled={busy} onClick={() => void proveUnsafe()} type="button">{operation === "proving-unsafe" ? "PROVING UNSAFE" : "TRY UNSAFE · 112"}</button>
              <button className="debug-secondary-button" disabled={busy} onClick={() => void proveTampered()} type="button">{operation === "proving-tampered" ? "PROVING TAMPER" : "TRY TAMPER · 112 → 71"}</button>
            </div>
          </section>
        )}

        {connectionMessage && <div className="wallet-debug-message" role="alert"><TriangleAlert size={16} /><span>{connectionMessage}</span></div>}
        {error && <div className="wallet-debug-message" role="alert"><TriangleAlert size={16} /><span>{error}</span></div>}
        {complianceCount === "1" && <p className="wallet-debug-note"><Check size={13} /> The observed ledger state is the only success signal shown by this page.</p>}

        <footer className="wallet-debug-footer">Artifacts: {ZK_CONFIG_BASE_PATH} · Attestor: {ATTESTOR_URL} · This page never falls back to the product mock client.</footer>
      </main>
    </div>
  );
}

function TransactionDetails({ transaction, label }: { transaction: PublicTransaction; label: string }) {
  return (
    <div className="wallet-debug-details">
      <div><span>{label} txId</span><strong>{transaction.txId}</strong></div>
      <div><span>Status</span><strong className={transaction.status === "SucceedEntirely" ? "debug-good" : ""}>{transaction.status}</strong></div>
      <div><span>Block height</span><strong>{transaction.blockHeight}</strong></div>
      <div><span>Block hash</span><strong>{transaction.blockHash}</strong></div>
    </div>
  );
}
