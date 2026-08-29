import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ExternalLink, RefreshCw, TriangleAlert, WalletCards } from "lucide-react";
import {
  createLaceMidnightWalletBridge,
  readMidnightWalletConfig,
  type MidnightWalletBridge,
  type MidnightWalletConfig,
  type WalletConnectionState
} from "@driveproof/midnight-wallet";
import { checkProofServer, type ProofServerStatus } from "@driveproof/midnight-runtime/proof-server";

function statusLabel(ready: boolean): string {
  return ready ? "DETECTED" : "NOT DETECTED";
}

function formatUri(uri: string | undefined): string {
  if (!uri) return "not provided by wallet";
  return uri;
}

export function WalletDebugPage({
  bridge,
  config
}: {
  bridge?: MidnightWalletBridge;
  config?: MidnightWalletConfig;
}) {
  const resolvedConfig = useMemo(() => config ?? readMidnightWalletConfig(), [config]);
  const walletBridge = useMemo(() => bridge ?? createLaceMidnightWalletBridge(resolvedConfig), [bridge, resolvedConfig]);
  const [detected, setDetected] = useState(false);
  const [connection, setConnection] = useState<WalletConnectionState>({ status: "disconnected" });
  const [isChecking, setIsChecking] = useState(true);
  const [proofServer, setProofServer] = useState<ProofServerStatus | "checking">("checking");

  const refreshDetection = useCallback(async () => {
    const isDetected = await walletBridge.detect();
    setDetected(isDetected);
    setIsChecking(false);
  }, [walletBridge]);

  useEffect(() => {
    let attempts = 0;
    let cancelled = false;
    const check = async () => {
      const isDetected = await walletBridge.detect();
      if (cancelled) return;
      setDetected(isDetected);
      attempts += 1;
      if (isDetected || attempts >= 40) setIsChecking(false);
    };

    void check();
    const intervalId = window.setInterval(() => void check(), 500);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [walletBridge]);

  useEffect(() => {
    if (connection.status !== "connected") {
      setProofServer("checking");
      return;
    }

    let cancelled = false;
    setProofServer("checking");
    void checkProofServer({ url: resolvedConfig.expectedProofServerUrl }).then((status) => {
      if (!cancelled) setProofServer(status);
    });
    return () => { cancelled = true; };
  }, [connection, resolvedConfig.expectedProofServerUrl]);

  async function connect() {
    setConnection({ status: "connecting" });
    setConnection(await walletBridge.connect());
  }

  async function disconnect() {
    await walletBridge.disconnect();
    setConnection({ status: "disconnected" });
  }

  const session = connection.status === "connected" ? connection.session : undefined;
  const walletConnected = connection.status === "connected";
  const networkReady = walletConnected && connection.network === resolvedConfig.networkId;
  const runtimeReady = false;
  const connectionMessage = connection.status === "error"
    ? connection.message
    : connection.status === "unavailable"
      ? connection.reason
      : connection.status === "wrong-network"
        ? `Wallet reported ${connection.network}; this spike requires ${connection.expectedNetwork}.`
        : undefined;

  return (
    <div className="wallet-debug-shell">
      <main className="wallet-debug-card">
        <header className="wallet-debug-header">
          <a className="wallet-debug-back" href="/" aria-label="Back to Driver"><ArrowLeft size={15} /> Driver</a>
          <div className="eyebrow">ENGINEERING INSTRUMENTATION · DEV ONLY</div>
        </header>

        <div className="wallet-debug-intro">
          <div className="wallet-debug-icon"><WalletCards size={22} /></div>
          <div>
            <div className="eyebrow">MIDNIGHT PREPROD CONNECTIVITY</div>
            <h1>Lace browser-wallet spike</h1>
            <p>Connection only. No DriveProof contract, proof, or transaction is invoked from this page.</p>
          </div>
        </div>

        <section className="wallet-debug-status-grid" aria-label="Wallet connectivity status">
          <div className="wallet-debug-status"><span>Lace extension</span><strong className={detected ? "debug-good" : ""}>{isChecking ? "CHECKING" : statusLabel(detected)}</strong></div>
          <div className="wallet-debug-status"><span>Wallet</span><strong className={walletConnected ? "debug-good" : ""}>{walletConnected ? "CONNECTED" : "DISCONNECTED"}</strong></div>
          <div className="wallet-debug-status"><span>Network</span><strong className={networkReady ? "debug-good" : connection.status === "wrong-network" ? "debug-bad" : ""}>{networkReady ? "PREPROD" : connection.status === "wrong-network" ? "WRONG NETWORK" : "PREPROD TARGET"}</strong></div>
          <div className="wallet-debug-status"><span>Proof server</span><strong className={proofServer !== "checking" && proofServer.status === "reachable" ? "debug-good" : proofServer !== "checking" ? "debug-bad" : ""}>{proofServer === "checking" ? "CHECKING" : proofServer.status === "reachable" ? "REACHABLE" : "ERROR"}</strong></div>
          <div className="wallet-debug-status"><span>Runtime providers</span><strong className={runtimeReady ? "debug-good" : "debug-bad"}>{runtimeReady ? "READY" : "ERROR"}</strong></div>
        </section>

        <section className="wallet-debug-panel">
          <div className="wallet-debug-panel-heading"><span className="eyebrow">PROOF SERVER</span><span className="debug-neutral">EXPECTED {resolvedConfig.expectedProofServerUrl.replace(/^https?:\/\//, "")}</span></div>
          <div className="wallet-debug-details wallet-debug-proof-details">
            <div><span>Reachability</span><strong className={proofServer !== "checking" && proofServer.status === "reachable" ? "debug-good" : ""}>{proofServer === "checking" ? "CHECKING" : proofServer.status === "reachable" ? "REACHABLE" : "ERROR"}</strong></div>
            <div><span>Version</span><strong className={proofServer !== "checking" && proofServer.status === "reachable" ? "debug-good" : ""}>{proofServer === "checking" ? "CHECKING" : proofServer.status === "reachable" ? proofServer.version : proofServer.status === "incompatible" ? proofServer.version ?? "UNKNOWN" : "NOT AVAILABLE"}</strong></div>
            <div><span>Expected version</span><strong>8.1.0</strong></div>
          </div>
        </section>

        <section className="wallet-debug-panel">
          <div className="wallet-debug-panel-heading"><span className="eyebrow">WALLET SYNC</span><span className="debug-neutral">NOT EXPOSED BY CONNECTOR API</span></div>
          <p>Lace may show its own sync state in the extension. The current DApp Connector API does not expose a trustworthy sync-status field to this page.</p>
        </section>

        {proofServer !== "checking" && proofServer.status !== "reachable" && (
          <div className="wallet-debug-message" role="alert">
            <TriangleAlert size={16} />
            <span>{proofServer.message}</span>
          </div>
        )}

        {connectionMessage && (
          <div className="wallet-debug-message" role="alert">
            <TriangleAlert size={16} />
            <span>{connectionMessage}</span>
          </div>
        )}

        {session && (
          <section className="wallet-debug-panel wallet-debug-session">
            <div className="wallet-debug-panel-heading"><span className="eyebrow">WALLET SESSION</span><span className="debug-good">READY</span></div>
            <div className="wallet-debug-details">
              <div><span>Wallet</span><strong>{session.walletName}</strong></div>
              <div><span>Connector API</span><strong>{session.apiVersion}</strong></div>
              <div><span>Network ID</span><strong>{session.networkId}</strong></div>
              <div><span>Indexer URI</span><strong>{formatUri(session.configuration.indexerUri)}</strong></div>
              <div><span>Node URI</span><strong>{formatUri(session.configuration.substrateNodeUri)}</strong></div>
              <div><span>Proof URI</span><strong>{formatUri(session.configuration.proverServerUri)}</strong></div>
            </div>
            <p className="wallet-debug-note"><Check size={13} /> ConnectedAPI and wallet configuration are available to the future MidnightDriveProofClient.</p>
          </section>
        )}

        {walletConnected && (
          <section className="wallet-debug-panel">
            <div className="wallet-debug-panel-heading"><span className="eyebrow">RUNTIME PROVIDER GATE</span><span className="debug-bad">ERROR</span></div>
            <p>Full MidnightProviders are intentionally not constructed in this page: the generated Compact ZK artifact base URL and an app-owned private-state password callback are not present yet. The reusable builder is ready for those explicit Ashiha handoff inputs.</p>
            {proofServer !== "checking" && proofServer.status === "reachable" && <p className="wallet-debug-note"><Check size={13} /> Preprod configuration and local proof-server reachability are verified.</p>}
          </section>
        )}

        <div className="wallet-debug-actions">
          {!walletConnected ? (
            <button className="debug-primary-button" disabled={connection.status === "connecting"} onClick={() => void connect()} type="button">
              {connection.status === "connecting" ? "CONNECTING TO LACE" : "CONNECT LACE"}
              {connection.status === "connecting" ? <RefreshCw className="debug-spin" size={15} /> : <ExternalLink size={15} />}
            </button>
          ) : (
            <button className="debug-secondary-button" onClick={() => void disconnect()} type="button">CLEAR LOCAL SESSION</button>
          )}
          <button className="debug-refresh-button" onClick={() => void refreshDetection()} type="button" aria-label="Refresh extension detection"><RefreshCw size={15} /></button>
        </div>

        <footer className="wallet-debug-footer">Target network: {resolvedConfig.networkId} · This page never falls back to the product mock client.</footer>
      </main>
    </div>
  );
}
