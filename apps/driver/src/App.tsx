import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Code2,
  Fingerprint,
  Gauge,
  KeyRound,
  LockKeyhole,
  MapPinOff,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  X,
  Zap
} from "lucide-react";
import { createDriveProofClient } from "@driveproof/driveproof-client";
import {
  fixtureLabel,
  harshBrakingCount,
  maxSpeed,
  POLICY_ID,
  VEHICLE_ID
} from "@driveproof/fixtures";
import type { DemoFixture, DriveProofClient, ProofResult, TripAttestation } from "@driveproof/types";

const pendingStages = [
  "Preparing private witness",
  "Checking authorized attestation",
  "Evaluating private safety policy",
  "Generating Midnight proof",
  "Submitting verification"
];

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function configuredClient(): DriveProofClient {
  const requestedMode = import.meta.env.VITE_DRIVEPROOF_CLIENT_MODE === "midnight" ? "midnight" : "mock";
  return createDriveProofClient(requestedMode);
}

function RouteVisualization({ attestation }: { attestation: TripAttestation }) {
  const points = attestation.samples.map((sample) => `${sample.gridX},${sample.gridY}`).join(" ");
  return (
    <div className="route-stage" aria-label="Stylized private route visualization">
      <span className="route-tag route-tag--top">PRIVATE GRID · 16 OBSERVATIONS</span>
      <span className="route-tag route-tag--bottom">GPS COORDINATES · NOT DISCLOSED</span>
      <svg className="route-svg" viewBox="0 0 360 120" role="img" aria-label="Deterministic route grid">
        <polyline className="route-line-secondary" points="8,48 55,48 80,30 132,30 170,44 226,44 260,26 346,26" />
        <polyline className="route-line-secondary" points="25,110 55,94 82,94 115,109 171,109 205,92 254,92 293,107 350,107" />
        <polyline className="route-line" points={points} />
        {attestation.samples.map((sample, index) => (
          <circle
            className={index === attestation.samples.length - 1 ? "route-node route-node--last" : "route-node"}
            cx={sample.gridX}
            cy={sample.gridY}
            key={`${sample.gridX}-${sample.gridY}`}
            r={index === 0 || index === attestation.samples.length - 1 ? 4 : 2.2}
          />
        ))}
      </svg>
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="metric">
      <dt>{label}</dt>
      <dd>
        {value} {unit && <span>{unit}</span>}
      </dd>
    </div>
  );
}

function PrivacyPanel({ attestation }: { attestation: TripAttestation }) {
  return (
    <div className="privacy-grid">
      <section className="panel privacy-panel">
        <div className="panel-padding">
          <div className="privacy-header">
            <LockKeyhole size={15} strokeWidth={1.8} />
            <h2 className="privacy-heading">LOCAL PRIVATE STATE</h2>
          </div>
          <div className="privacy-items">
            <div className="privacy-item"><span>Telemetry samples</span><span>{attestation.samples.length} samples</span></div>
            <div className="privacy-item"><span>Route / grid positions</span><span>private</span></div>
            <div className="privacy-item"><span>Speed history</span><span>private</span></div>
            <div className="privacy-item"><span>Braking history</span><span>private</span></div>
            <div className="privacy-item"><span>Attestation</span><span>issuer-signed</span></div>
          </div>
          <div className="lock-line"><Fingerprint size={12} /> witness stays in the driver flow</div>
        </div>
      </section>
      <section className="panel privacy-panel privacy-panel--public">
        <div className="panel-padding">
          <div className="privacy-header">
            <MapPinOff size={15} strokeWidth={1.8} />
            <h2 className="privacy-heading">RAW TELEMETRY DISCLOSED</h2>
          </div>
          <div className="privacy-items">
            <div className="privacy-item"><span>GPS coordinates</span><span>0</span></div>
            <div className="privacy-item"><span>Speed samples</span><span>0</span></div>
            <div className="privacy-item"><span>Braking samples</span><span>0</span></div>
          </div>
          <div className="lock-line"><ShieldCheck size={12} /> only the proof crosses the boundary</div>
        </div>
      </section>
    </div>
  );
}

function VerificationFlow({ stage, result }: { stage: number; result?: ProofResult }) {
  const verified = result?.status === "verified";
  const displayStages = verified ? [...pendingStages, "Verification confirmed"] : pendingStages;
  const progress = result ? 100 : Math.round(((stage + 1) / pendingStages.length) * 100);
  return (
    <section className="verification-panel" aria-live="polite">
      <div className="eyebrow">{result ? "MOCK RESULT" : "MOCK UX SIMULATION"}</div>
      <h2>{result ? (result.status === "verified" ? "Verification confirmed" : result.reason === "replay" ? "Replay rejected" : "Proof generation rejected") : "Building your DriveProof"}</h2>
      <p>{result ? "This product shell is ready for the generated Midnight client. No real proof or chain transaction was created in this run." : "A calm, staged view of the private proving flow. The current client is development-only."}</p>
      <div className="verification-stages">
        {displayStages.map((label, index) => {
          const isConfirmation = label === "Verification confirmed";
          const done = verified || (Boolean(result) && !isConfirmation) || index < stage;
          const active = !result && index === stage;
          return (
            <div className={`verification-stage ${active ? "verification-stage--active" : ""} ${done ? "verification-stage--done" : ""}`} key={label}>
              <span className="stage-indicator">{done ? <Check size={11} strokeWidth={3} /> : index + 1}</span>
              <span>{label}</span>
            </div>
          );
        })}
      </div>
      <div className="progress-track"><div className="progress-value" style={{ width: `${progress}%` }} /></div>
    </section>
  );
}

function ResultBanner({ result }: { result: ProofResult }) {
  const verified = result.status === "verified";
  const replay = result.status === "rejected" && result.reason === "replay";
  return (
    <section className={`state-banner ${verified ? "state-banner--verified" : "state-banner--rejected"}`}>
      {verified ? <Check size={16} /> : replay ? <RotateCcw size={16} /> : <X size={16} />}
      <div>
        <h3>{verified ? "DRIVEPROOF VERIFIED IN MOCK MODE" : replay ? "REPLAY REJECTED" : "PROOF GENERATION REJECTED"}</h3>
        <p>{verified ? "The safe fixture satisfied the demo policy. The insurer view receives only this proof-shaped result." : replay ? `This attestation has already been used against ${POLICY_ID}.` : `This private witness cannot produce a valid proof for policy ${POLICY_ID}. Underlying telemetry remains private.`}</p>
        {verified && <div className="state-mono">{result.transactionId}</div>}
      </div>
    </section>
  );
}

function TamperedNotice() {
  return (
    <section className="state-banner state-banner--rejected">
      <X size={16} />
      <div>
        <h3>DEMO TAMPERING ATTEMPT</h3>
        <p>The signed attestation says one value; this demonstration substitutes another private witness value. The frontend is not detecting cryptographic tampering here.</p>
        <div className="state-mono" style={{ color: "var(--danger)" }}>ATTESTED VALUE · 112 km/h &nbsp; / &nbsp; MODIFIED VALUE · 71 km/h</div>
      </div>
    </section>
  );
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

export function DriverExperience({ client: providedClient, stageDelayMs = 650 }: { client?: DriveProofClient; stageDelayMs?: number }) {
  const client = useMemo(() => providedClient ?? configuredClient(), [providedClient]);
  const [fixture, setFixture] = useState<DemoFixture>("safe");
  const [attestation, setAttestation] = useState<TripAttestation>();
  const [result, setResult] = useState<ProofResult>();
  const [stage, setStage] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setResult(undefined);
    setStage(0);
    void client.issueDemoTrip(fixture).then((nextAttestation) => {
      if (!cancelled) {
        setAttestation(nextAttestation);
        setIsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [client, fixture]);

  async function generateProof() {
    if (!attestation || isVerifying) return;
    setResult(undefined);
    setIsVerifying(true);
    for (let index = 0; index < pendingStages.length; index += 1) {
      setStage(index);
      if (stageDelayMs > 0) await wait(stageDelayMs);
    }
    const nextResult = await client.proveCompliance(attestation, POLICY_ID);
    setResult(nextResult);
    setIsVerifying(false);
  }

  const insurerUrl = `${import.meta.env.VITE_INSURER_URL ?? "http://localhost:5174"}/?fixture=${fixture}`;

  if (isLoading || !attestation) {
    return <div className="app-shell"><div className="shell-content"><div className="empty-state"><div><div className="eyebrow">DRIVEPROOF · DRIVER</div><h1>Preparing private trip</h1><p>Loading the deterministic demo fixture.</p></div></div></div></div>;
  }

  return (
    <div className="app-shell driver-shell">
      <div className="shell-content">
        <header className="topbar">
          <a className="brand" href="/" aria-label="DriveProof Driver home"><span className="brand-mark">D</span><span className="brand-word">DRIVEPROOF</span></a>
          <div className="topbar-right">
            <a className="quiet-link" href={insurerUrl}>Insurer view <ArrowUpRight size={13} /></a>
            <span className="environment-chip"><span className="environment-dot" /> {client.displayName}</span>
          </div>
        </header>

        <main>
          <section className="hero">
            <div>
              <div className="eyebrow">DRIVER CONSOLE · {fixtureLabel(fixture)}</div>
              <h1>PRIVATE BY<br />DEFAULT.</h1>
              <p className="hero-copy">Prove you drove safely <strong>without revealing where you drove.</strong></p>
            </div>
            <div className="vehicle-card"><div className="eyebrow">VEHICLE</div><div className="vehicle-name">{VEHICLE_ID}</div><div className="vehicle-detail">Personal trip · Today, 09:42</div></div>
          </section>

          <section className="dashboard-grid">
            <div>
              <section className="panel route-card">
                <div className="panel-heading">
                  <div><h2 className="panel-title">Private Trip</h2><p className="panel-subtitle">A local view of the telemetry your proof uses.</p></div>
                  <div className="status-label">Local only</div>
                </div>
                <RouteVisualization attestation={attestation} />
                <dl className="route-metric-grid">
                  <Metric label="Distance" value="18.7" unit="km" />
                  <Metric label="Samples" value={attestation.samples.length} />
                  <Metric label="Max speed" value={maxSpeed(attestation.samples)} unit="km/h" />
                  <Metric label="Harsh braking" value={harshBrakingCount(attestation.samples)} />
                </dl>
              </section>
              <PrivacyPanel attestation={attestation} />
            </div>

            <section className="panel proof-panel">
              <div className="panel-padding">
                <div className="panel-heading"><div><h2 className="panel-title">DriveProof</h2><p className="panel-subtitle">A privacy-preserving compliance proof.</p></div><div className="status-label">{POLICY_ID}</div></div>
                <div className="proof-orbit"><ShieldCheck className="proof-orbit-icon" size={32} strokeWidth={1.3} /><span className="proof-orbit-label">PRIVATE WITNESS</span></div>
                <div className="proof-list">
                  <div className="proof-row"><span className="proof-row-label">Authorized attestation</span><span className="proof-row-value">ready</span></div>
                  <div className="proof-row"><span className="proof-row-label">Safety policy</span><span className="proof-row-value">{POLICY_ID}</span></div>
                  <div className="proof-row"><span className="proof-row-label">Replay protection</span><span className="proof-row-value">active</span></div>
                </div>
                <div style={{ marginTop: "auto", paddingTop: 23 }}>
                  <button className="primary-button" disabled={isVerifying} onClick={() => void generateProof()} type="button">
                    {isVerifying ? "GENERATING PROOF" : result?.status === "verified" ? "RESUBMIT SAME ATTESTATION" : "GENERATE DRIVEPROOF"}
                    {isVerifying ? <Zap size={14} /> : <ChevronRight size={15} />}
                  </button>
                  <p className="proof-footnote"><Code2 size={11} style={{ verticalAlign: "-2px", marginRight: 4 }} /> {client.displayName}. UX stages are simulated for local development.</p>
                </div>
              </div>
            </section>
          </section>

          {fixture === "tampered" && <TamperedNotice />}
          {isVerifying && <VerificationFlow stage={stage} />}
          {result && !isVerifying && <><ResultBanner result={result} /><VerificationFlow stage={pendingStages.length - 1} result={result} /></>}
        </main>
      </div>
      <DemoControls fixture={fixture} onFixtureChange={setFixture} />
    </div>
  );
}

export default function App() {
  return <DriverExperience />;
}
