import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Code2,
  EyeOff,
  Fingerprint,
  HelpCircle,
  LayoutDashboard,
  LockKeyhole,
  MapPinOff,
  Menu,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  X
} from "lucide-react";
import { POLICY_ID } from "@driveproof/fixtures";
import type { DemoFixture, DriveProofClient, ProofResult, TripAttestation } from "@driveproof/types";

function InsurerSidebar({
  isOpen,
  driverUrl,
  technicalUrl,
  mode,
  onNavigate
}: {
  isOpen: boolean;
  driverUrl: string;
  technicalUrl: string;
  mode: DriveProofClient["mode"];
  onNavigate: () => void;
}) {
  return (
    <aside className={`product-sidebar ${isOpen ? "product-sidebar--open" : ""}`} aria-label="Insurer navigation">
      <div className="product-sidebar-top">
        <a className="brand" href="/" aria-label="DriveProof home">
          <span className="brand-mark">D</span><span className="brand-word">DRIVEPROOF</span>
        </a>
        <button className="mobile-sidebar-close" onClick={onNavigate} type="button" aria-label="Close navigation"><X size={17} /></button>
      </div>
      <nav className="product-navigation" aria-label="Verifier sections">
        <div className="product-navigation-label">Verifier</div>
        <a className="product-nav-link product-nav-link--active" href="#overview" onClick={onNavigate}><LayoutDashboard size={15} /> Overview</a>
        <a className="product-nav-link" href="#verification" onClick={onNavigate}><ShieldCheck size={15} /> Verification</a>
        <a className="product-nav-link" href="#privacy" onClick={onNavigate}><LockKeyhole size={15} /> Privacy boundary</a>
        <div className="product-navigation-divider" />
        <div className="product-navigation-label">Surfaces</div>
        <a className="product-nav-link" href={driverUrl} onClick={onNavigate}><ArrowUpRight size={15} /> Driver view</a>
        <a className="product-nav-link" href={technicalUrl} onClick={onNavigate}><Code2 size={15} /> Technical evidence <span className="product-nav-note">DEV</span></a>
      </nav>
      <div className="product-sidebar-footer">
        <div className="product-sidebar-status">
          <span>Network target</span>
          <strong>MIDNIGHT PREPROD</strong>
        </div>
        <div className="product-help-button product-help-button--static"><HelpCircle size={15} /> Public result boundary</div>
        <div className="product-sidebar-mode">{mode === "mock" ? "MOCK CLIENT · PRODUCT SURFACE" : "REAL CLIENT · PRODUCT SURFACE"}</div>
      </div>
    </aside>
  );
}

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

function VerifierStatusStrip({ result, isMock }: { result: ProofResult; isMock: boolean }) {
  const verified = result.status === "verified";
  const network = verified ? result.receipt.network : undefined;
  return (
    <section className="product-status-strip insurer-status-strip" aria-label="Verifier summary">
      <div className="product-status-intro">
        <div className="eyebrow">VERIFIER OVERVIEW</div>
        <h2>Verify the result, not the route.</h2>
        <p>The public view is intentionally smaller than the private witness behind it.</p>
      </div>
      <div className="product-status-items">
        <div className="product-status-item"><span>Result</span><strong className={verified ? "product-status-good" : "product-status-bad"}>{verified ? "VERIFIED" : "REJECTED"}</strong><small>{isMock ? "mock product surface" : "public result"}</small></div>
        <div className="product-status-item"><span>Network</span><strong>{isMock ? "MOCK MODE" : network ?? "NOT REPORTED"}</strong><small>{isMock ? "no chain request" : "receipt field"}</small></div>
        <div className="product-status-item"><span>Data received</span><strong>PUBLIC RESULT</strong><small>raw telemetry not included</small></div>
      </div>
    </section>
  );
}

function PublicReceiptDetails({ result }: { result: ProofResult }) {
  if (result.status !== "verified") return null;
  const receipt = result.receipt;
  const value = (field: string | number | undefined): string => field === undefined ? "NOT REPORTED" : String(field);
  const fields = [
    ["Result", "COMPLIANT"],
    ["Policy", value(receipt.policyId)],
    ["Attestor", value(receipt.attestorId)],
    ["Network", value(receipt.network)],
    ["Transaction", receipt.transactionId],
    ["Block", value(receipt.blockHeight)],
    ["Contract", value(receipt.contractAddress)]
  ] as const;

  return (
    <section className="public-receipt" aria-labelledby="public-receipt-title">
      <div className="public-receipt-heading"><div><div className="eyebrow" title="The minimal on-chain result the insurer can verify.">PUBLIC RECEIPT</div><h3 id="public-receipt-title">What the verifier can retain</h3></div><span>NO PRIVATE TELEMETRY</span></div>
      <div className="public-receipt-grid">
        {fields.map(([label, fieldValue]) => <div key={label}><span>{label}</span><strong>{fieldValue}</strong></div>)}
      </div>
    </section>
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
    <section className="panel boundary-card" id="privacy">
      <div className="panel-padding">
        <div className="eyebrow">INFORMATION BOUNDARY</div>
        <h2 className="panel-title boundary-title">Driver keeps the journey.<br />Insurer learns the proof.</h2>
        <div className="boundary-stack">
          <div className="boundary-item"><ShieldCheck size={17} /><div><h3>DRIVER KNOWS THE JOURNEY</h3><p>Raw driving telemetry remains on the private side of the experience.</p></div></div>
          <div className="boundary-arrow"><ArrowDown size={15} /></div>
          <div className="boundary-item"><EyeOff size={17} /><div><h3>INSURER LEARNS THE PROOF</h3><p>A policy result and only the public metadata needed to verify it.</p></div></div>
        </div>
        <div className="boundary-callout"><div className="eyebrow">NOT SHARED</div><p>Route, origin, destination, exact speed history, and GPS history remain private.</p></div>
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
      <div className="privacy-header"><LockKeyhole size={15} /><div><h2 className="privacy-heading">NOT SHARED</h2><p className="private-data-intro">The insurer can verify compliance without receiving these fields.</p></div></div>
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
  const [isNavOpen, setIsNavOpen] = useState(false);

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
    if (client.mode === "midnight") {
      // The insurer is a public receipt surface. It must never initiate a
      // private attestation or proof operation; the Driver hands it a receipt.
      setAttestation(undefined);
      setResult(undefined);
      setIsLoading(false);
      return () => { cancelled = true; };
    }
    setResult(undefined);
    void client.issueDemoTrip(fixture)
      .then((nextAttestation) => client.proveCompliance(nextAttestation, POLICY_ID).then((nextResult) => {
        if (!cancelled) {
          setAttestation(nextAttestation);
          setResult(nextResult);
          setIsLoading(false);
        }
      }))
      .catch(() => {
        if (!cancelled) {
          setAttestation(undefined);
          setResult(undefined);
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

  const driverUrl = `${import.meta.env.VITE_DRIVER_URL ?? "http://localhost:5173"}/driver?fixture=${fixture}`;
  const technicalUrl = `${import.meta.env.VITE_DRIVER_URL ?? "http://localhost:5173"}/wallet-debug`;
  const verified = result?.status === "verified";
  const replay = result?.status === "rejected" && result.reason === "replay";

  if (isLoading) {
    return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to main content</a><main className="shell-content" id="main-content"><div className="empty-state"><div><div className="eyebrow">DRIVEPROOF · INSURER</div><h1>Waiting for proof</h1><p>Loading the verifier boundary.</p></div></div></main></div>;
  }

  if (!result) {
    return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to main content</a><main className="shell-content" id="main-content"><div className="empty-state"><div><div className="eyebrow">DRIVEPROOF · INSURER</div><h1>NO PROOF LOADED</h1><p>Open a public receipt from the Driver or load one through the configured verifier integration.</p></div></div></main></div>;
  }

  return (
    <div className="app-shell insurer-shell product-app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <InsurerSidebar isOpen={isNavOpen} driverUrl={driverUrl} technicalUrl={technicalUrl} mode={clientMode} onNavigate={() => setIsNavOpen(false)} />
      {isNavOpen && <button className="product-sidebar-scrim" onClick={() => setIsNavOpen(false)} type="button" aria-label="Close navigation" />}
      <div className="product-main">
        <div className="shell-content">
        <header className="topbar product-topbar">
          <button className="mobile-menu-button" onClick={() => setIsNavOpen(true)} type="button" aria-label="Open navigation"><Menu size={18} /></button>
          <a className="brand product-mobile-brand" href="/" aria-label="DriveProof home"><span className="brand-mark">D</span><span className="brand-word">DRIVEPROOF</span></a>
          <div className="topbar-right">
            <a className="quiet-link" href={driverUrl}>Driver view <ArrowUpRight size={13} /></a>
            <span className="environment-chip"><span className="environment-dot" /> {displayName}</span>
          </div>
        </header>

        <main id="main-content">
          <section className="hero insurer-hero-title product-hero" id="overview">
            <div>
              <div className="eyebrow">INSURER VERIFIER · {POLICY_ID}</div>
              <h1>VERIFY THE RESULT.<br />NOT THE ROUTE.</h1>
              <p className="hero-copy">A clear compliance signal, <strong>without access to the journey behind it.</strong></p>
            </div>
          </section>

          <VerifierStatusStrip result={result} isMock={isMock} />

          <section className="verifier-grid" id="verification">
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
                <PublicReceiptDetails result={result} />
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
