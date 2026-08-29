import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  EyeOff,
  Fingerprint,
  LockKeyhole,
  MapPinOff,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  X
} from "lucide-react";
import { POLICY_ID } from "@driveproof/fixtures";
import type { DemoFixture, DriveProofClient, ProofResult, TripAttestation } from "@driveproof/types";

function initialFixture(): DemoFixture {
  const value = new URLSearchParams(window.location.search).get("fixture");
  return value === "unsafe" || value === "tampered" ? value : "safe";
}

function DemoControls({ fixture, onFixtureChange }: { fixture: DemoFixture; onFixtureChange: (fixture: DemoFixture) => void }) {
  return (
    <aside className="demo-controls" aria-label="Demo controls">
      <div className="demo-controls-header"><SlidersHorizontal size={11} /> demo control · mock only</div>
      <div className="demo-buttons">
        {(["safe", "unsafe", "tampered"] as DemoFixture[]).map((option) => (
          <button className={`demo-button ${fixture === option ? "demo-button--active" : ""} ${option === "tampered" && fixture === option ? "demo-button--danger" : ""}`} key={option} onClick={() => onFixtureChange(option)} type="button">
            {option.toUpperCase()}
          </button>
        ))}
      </div>
    </aside>
  );
}

function ProofChecks({ verified }: { verified: boolean }) {
  const checks = [
    ["Authorized telemetry", verified ? "VERIFIED" : "NOT VERIFIED"],
    ["Safety policy", verified ? "SATISFIED" : "NOT SATISFIED"],
    ["Replay protection", "ACTIVE"]
  ] as const;
  return (
    <div className="result-checks">
      {checks.map(([label, value]) => (
        <div className="result-check" key={label}>
          <span>{label}</span>
          <span className={`check-value ${!verified && label !== "Replay protection" ? "check-value--muted" : ""}`}>
            {verified || label === "Replay protection" ? <Check size={12} strokeWidth={2.4} /> : <X size={12} />}
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function PrivateBoundary() {
  return (
    <section className="panel boundary-card">
      <div className="panel-padding">
        <div className="eyebrow">INFORMATION BOUNDARY</div>
        <h2 className="panel-title" style={{ fontSize: "22px", letterSpacing: "-0.05em", marginTop: 9 }}>Driver knows everything.<br />Insurer learns only the proof.</h2>
        <div className="boundary-stack">
          <div className="boundary-item"><ShieldCheck size={17} /><div><h3>DRIVER KNOWS EVERYTHING</h3><p>Raw driving telemetry is not revealed to the insurer or public ledger.</p></div></div>
          <div className="boundary-arrow"><ArrowDown size={15} /></div>
          <div className="boundary-item"><EyeOff size={17} /><div><h3>INSURER LEARNS ONLY THE PROOF</h3><p>A policy result, attestation status, and replay-safe reference.</p></div></div>
        </div>
        <div className="boundary-callout"><div className="eyebrow">PRIVATE DATA</div><p>Route, origin, destination, exact speed history, and GPS history remain private.</p></div>
      </div>
    </section>
  );
}

function PrivateDataStrip() {
  const fields = [
    ["ROUTE", "PRIVATE"],
    ["ORIGIN", "PRIVATE"],
    ["DESTINATION", "PRIVATE"],
    ["EXACT SPEED HISTORY", "PRIVATE"],
    ["GPS HISTORY", "PRIVATE"]
  ];
  return (
    <section className="panel panel-padding" style={{ marginTop: 16 }}>
      <div className="privacy-header"><LockKeyhole size={15} /><h2 className="privacy-heading">PRIVATE DATA</h2></div>
      <div className="private-data-grid">
        {fields.map(([label, value]) => <div className="private-stat" key={label}><div className="eyebrow">{label}</div><strong>{value}</strong><span>not disclosed</span></div>)}
      </div>
    </section>
  );
}

export type InsurerExperienceProps = {
  /** Optional only when a public result is supplied directly. */
  client?: DriveProofClient;
  initialFixtureOverride?: DemoFixture;
  publicResult?: ProofResult;
  mode?: DriveProofClient["mode"];
  displayName?: string;
  onResubmit?: () => Promise<ProofResult>;
};

export function InsurerExperience({
  client,
  initialFixtureOverride,
  publicResult,
  mode: modeOverride,
  displayName: displayNameOverride,
  onResubmit
}: InsurerExperienceProps) {
  const clientMode = client?.mode ?? modeOverride ?? "mock";
  const displayName = client?.displayName ?? displayNameOverride ?? "PUBLIC PROOF RESULT";
  const isMock = clientMode === "mock";
  const [fixture, setFixture] = useState<DemoFixture>(() => initialFixtureOverride ?? initialFixture());
  const [attestation, setAttestation] = useState<TripAttestation>();
  const [result, setResult] = useState<ProofResult | undefined>(publicResult);
  const [isLoading, setIsLoading] = useState(true);
  const [isResubmitting, setIsResubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    if (publicResult) {
      setAttestation(undefined);
      setResult(publicResult);
      setIsLoading(false);
      return () => { cancelled = true; };
    }
    if (!client) {
      setResult(undefined);
      setIsLoading(false);
      return () => { cancelled = true; };
    }
    setResult(undefined);
    void client.issueDemoTrip(fixture).then(async (nextAttestation) => {
      const nextResult = await client.proveCompliance(nextAttestation, POLICY_ID);
      if (!cancelled) {
        setAttestation(nextAttestation);
        setResult(nextResult);
        setIsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [client, fixture, publicResult]);

  async function resubmit() {
    if (isResubmitting || (!onResubmit && (!client || !attestation))) return;
    setIsResubmitting(true);
    try {
      const nextResult = onResubmit
        ? await onResubmit()
        : await client!.proveCompliance(attestation!, POLICY_ID);
      setResult(nextResult);
    } finally {
      setIsResubmitting(false);
    }
  }

  const driverUrl = `${import.meta.env.VITE_DRIVER_URL ?? "http://localhost:5173"}/?fixture=${fixture}`;
  const verified = result?.status === "verified";
  const replay = result?.status === "rejected" && result.reason === "replay";

  if (isLoading || !result) {
    return <div className="app-shell"><div className="shell-content"><div className="empty-state"><div><div className="eyebrow">DRIVEPROOF · INSURER</div><h1>Waiting for proof</h1><p>Loading the verifier boundary.</p></div></div></div></div>;
  }

  return (
    <div className="app-shell insurer-shell">
      <div className="shell-content">
        <header className="topbar">
          <a className="brand" href="/" aria-label="DriveProof Insurer home"><span className="brand-mark">D</span><span className="brand-word">DRIVEPROOF</span></a>
          <div className="topbar-right">
            <a className="quiet-link" href={driverUrl}>Driver view <ArrowUpRight size={13} /></a>
            <span className="environment-chip"><span className="environment-dot" /> {displayName}</span>
          </div>
        </header>

        <main>
          <section className="hero insurer-hero-title">
            <div>
              <div className="eyebrow">INSURER VERIFIER · {POLICY_ID}</div>
              <h1>THE PROOF<br />IS ENOUGH.</h1>
              <p className="hero-copy">A clear compliance signal, <strong>without access to the journey behind it.</strong></p>
            </div>
          </section>

          <section className="verifier-grid">
            <section className="panel verification-result-card">
              <div className="panel-padding">
                <div className="panel-heading"><div><h2 className="panel-title">Verification result</h2><p className="panel-subtitle">What the insurer can trust from this submission.</p></div><div className="status-label">{isMock ? "Demo" : "Preprod"}</div></div>
                <div className="result-hero">
                  <div className={`result-icon ${!verified ? "result-icon--rejected" : ""}`}>{verified ? <Check size={22} /> : replay ? <RotateCcw size={22} /> : <X size={22} />}</div>
                  <div>
                    <div className={`result-kicker ${!verified ? "result-kicker--rejected" : ""}`}>{replay ? "REPLAY REJECTED" : verified ? "DRIVEPROOF" : "PROOF GENERATION REJECTED"}</div>
                    <h2>{replay ? "This proof was already used." : verified ? "VERIFIED" : "No valid proof."}</h2>
                    <p>{replay ? `This attestation has already been used against ${POLICY_ID}.` : verified ? "The submitted private witness satisfies the authorized safety policy." : `This attested trip cannot produce a valid proof for policy ${POLICY_ID}. Underlying telemetry remains private.`}</p>
                  </div>
                </div>
                <ProofChecks verified={verified} />
                {verified && <div className="result-transaction"><div className="eyebrow">{isMock ? "TRANSACTION REFERENCE · MOCK ONLY" : "TRANSACTION REFERENCE · MIDNIGHT PREPROD"}</div><div className="transaction-value">{result.receipt.transactionId}</div></div>}
                <div className="mock-callout"><Code2Icon /><p>{isMock
                  ? <><strong>{displayName}.</strong> This verifier view is a product-development simulation. It did not contact Midnight.</>
                  : <><strong>{displayName}.</strong> The verifier receives the compliance result without raw driving telemetry.</>}</p></div>
                {(onResubmit || (client && attestation)) && <button className="secondary-button" disabled={isResubmitting} onClick={() => void resubmit()} style={{ marginTop: 13, width: "100%" }} type="button">
                  {isResubmitting ? "RESUBMITTING" : "RESUBMIT SAME ATTESTATION"} <RotateCcw size={13} />
                </button>}
              </div>
            </section>

            <PrivateBoundary />
          </section>

          <PrivateDataStrip />
          <div className="insurer-footer-note"><Fingerprint size={11} style={{ verticalAlign: "-2px", marginRight: 6 }} /> zero knowledge protects privacy · attestation protects integrity</div>
        </main>
      </div>
      {!publicResult && client && isMock && <DemoControls fixture={fixture} onFixtureChange={setFixture} />}
    </div>
  );
}

function Code2Icon() {
  return <span style={{ color: "var(--accent)", display: "inline-flex", flex: "0 0 auto" }}><MapPinOff size={14} /></span>;
}

export type InsurerAppProps = {
  client: DriveProofClient;
  publicResult?: ProofResult;
};

export default function App({ client, publicResult }: InsurerAppProps) {
  return <InsurerExperience client={client} publicResult={publicResult} />;
}
