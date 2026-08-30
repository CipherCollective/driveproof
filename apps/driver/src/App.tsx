import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  HelpCircle,
  Code2,
  Fingerprint,
  LayoutDashboard,
  LockKeyhole,
  MapPinOff,
  Menu,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  X,
  Zap
} from "lucide-react";
import {
  fixtureLabel,
  harshBrakingCount,
  maxSpeed,
  POLICY_ID,
  VEHICLE_ID
} from "@driveproof/fixtures";
import type {
  DemoFixture,
  DriveProofClient,
  DriveProofConnectionState,
  DriverFlowState,
  ProofResult,
  PublicProofReceipt,
  TripAttestation
} from "@driveproof/types";
import { WalletDebugPage } from "./WalletDebugPage";
import { PreprodTransactionDebugPage } from "./PreprodTransactionDebugPage";
import {
  completeOnboardingTask,
  canCompleteOnboardingTask,
  loadOnboardingState,
  onboardingProgress,
  resetOnboardingState,
  saveOnboardingState,
  type OnboardingState,
  type OnboardingTaskId
} from "./onboarding";
import { getDriverProofSteps } from "./driverPresentation";
import { LandingPage } from "./LandingPage";

const pendingStages = [
  "Preparing private witness",
  "Checking authorized attestation",
  "Evaluating private safety policy",
  "Generating Midnight proof",
  "Submitting verification"
];

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function normalizeClientError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return "The DriveProof client returned an unexpected error.";
}

function insurerUrlForResult(fixture: DemoFixture, result?: ProofResult): string {
  const baseUrl = `${import.meta.env.VITE_INSURER_URL ?? "http://localhost:5174"}/?fixture=${fixture}`;
  if (!result || result.status !== "verified") return baseUrl;

  // Only the public receipt crosses the app boundary. TripAttestation and
  // generated private state are deliberately absent from this handoff.
  return `${baseUrl}&receipt=${encodeURIComponent(JSON.stringify(result.receipt))}`;
}

function RouteVisualization({ attestation }: { attestation: TripAttestation }) {
  const points = attestation.samples.map((sample) => `${sample.gridX},${sample.gridY}`).join(" ");
  const start = attestation.samples[0];
  const end = attestation.samples[attestation.samples.length - 1];
  return (
    <div className="route-stage" aria-label="Stylized private journey visualization">
      <span className="route-tag route-tag--top">PRIVATE GRID · {attestation.samples.length} SAMPLES</span>
      <span className="route-tag route-tag--bottom">NO GPS COORDINATES</span>
      <svg className="route-svg" viewBox="0 0 360 120" role="img" aria-label="Deterministic private journey grid with start and end nodes">
        <g className="route-roads" aria-hidden="true">
          <path d="M0 20H360 M0 47H360 M0 104H360" />
          <path d="M40 0V120 M88 0V120 M172 0V120 M246 0V120 M312 0V120" />
          <path d="M8 120L110 0 M126 120L208 0 M232 120L346 28" />
        </g>
        <g className="route-intersections" aria-hidden="true">
          <circle cx="40" cy="20" r="2" /><circle cx="88" cy="47" r="2" /><circle cx="172" cy="47" r="2" />
          <circle cx="246" cy="104" r="2" /><circle cx="312" cy="20" r="2" /><circle cx="208" cy="47" r="2" />
        </g>
        <polyline className="route-line" points={points} />
        {attestation.samples.map((sample, index) => (
          <circle
            className={index === 0 ? "route-node route-node--start" : index === attestation.samples.length - 1 ? "route-node route-node--end" : "route-node"}
            cx={sample.gridX}
            cy={sample.gridY}
            key={`${sample.gridX}-${sample.gridY}`}
            r={index === 0 || index === attestation.samples.length - 1 ? 4 : 2.2}
          />
        ))}
        <g className="route-endpoint" transform={`translate(${start.gridX} ${start.gridY})`}>
          <circle className="route-endpoint-ring" r="8" />
          <text x="-4" y="-10">START</text>
        </g>
        <g className="route-endpoint route-endpoint--end" transform={`translate(${end.gridX} ${end.gridY})`}>
          <circle className="route-endpoint-ring" r="8" />
          <text x="-6" y="-10">END</text>
        </g>
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

export type PublicProofMetadataField = {
  label: string;
  value: string;
  note: string;
};

const pendingPublicProofMetadata: PublicProofMetadataField[] = [
  { label: "Policy identifier", value: "—", note: "awaiting Midnight field" },
  { label: "Attestor identifier", value: "—", note: "awaiting Midnight field" },
  { label: "Nullifier", value: "—", note: "awaiting Midnight field" },
  { label: "Transaction / proof reference", value: "—", note: "awaiting Midnight field" }
];

export function PublicProofMetadata({
  fields = pendingPublicProofMetadata,
  connected = false
}: {
  fields?: PublicProofMetadataField[];
  connected?: boolean;
}) {
  return (
    <section className="panel public-metadata-panel" aria-labelledby="public-metadata-title">
      <div className="panel-padding">
        <div className="public-metadata-heading">
          <div><h2 className="eyebrow" id="public-metadata-title">PUBLIC PROOF METADATA</h2><p>{connected ? "Public-safe fields returned by the injected proof client." : "Reserved for the exact public fields returned by Midnight."}</p></div>
          <span className="metadata-pending">{connected ? "PUBLIC RESULT" : "NOT WIRED"}</span>
        </div>
        <div className="public-metadata-grid">
          {fields.map((field) => (
            <div className="public-metadata-item" key={field.label}>
              <span>{field.label}</span>
              <strong>{field.value}</strong>
              <small>{field.note}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrivacyPanel({ attestation, receipt }: { attestation?: TripAttestation; receipt?: PublicProofReceipt }) {
  const privateTelemetryLabel = !attestation
    ? "not loaded"
    : attestation.samples.length > 0
      ? `${attestation.samples.length} samples`
      : "v2 measurement";
  const publicFields: PublicProofMetadataField[] | undefined = receipt
    ? [
        { label: "Policy identifier", value: receipt.policyId ?? "NOT RETURNED", note: receipt.policyId ? "product metadata" : "not returned by client" },
        { label: "Attestor identifier", value: receipt.attestorId ?? "NOT RETURNED", note: receipt.attestorId ? "public metadata" : "not returned by client" },
        { label: "Nullifier", value: receipt.nullifier ?? "NOT RETURNED", note: receipt.nullifier ? "public protocol metadata" : "not returned by client" },
        { label: "Transaction / proof reference", value: receipt.transactionId, note: "public receipt" }
      ]
    : undefined;
  return (
    <div className="privacy-grid" id="privacy">
      <section className="panel privacy-panel">
        <div className="panel-padding">
          <div className="privacy-header">
            <LockKeyhole size={15} strokeWidth={1.8} />
            <h2 className="privacy-heading">LOCAL PRIVATE STATE</h2>
          </div>
          <div className="privacy-items">
            <div className="privacy-item"><span>Private telemetry</span><span>{privateTelemetryLabel}</span></div>
            <div className="privacy-item"><span>Route / grid positions</span><span>private</span></div>
            <div className="privacy-item"><span>Speed history</span><span>private</span></div>
            <div className="privacy-item"><span>Braking history</span><span>private</span></div>
            <div className="privacy-item"><span>Attestation</span><span>{attestation ? "issuer-signed" : "not loaded"}</span></div>
          </div>
          <div className="lock-line"><Fingerprint size={12} /> the authorized attestor signs the private measurement</div>
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
          <div className="lock-line"><ShieldCheck size={12} /> raw driving telemetry is not revealed to the insurer or public ledger</div>
        </div>
      </section>
      <PublicProofMetadata fields={publicFields} connected={Boolean(receipt)} />
    </div>
  );
}

function ProofPipeline() {
  return (
    <div className="proof-pipeline" aria-label="Private telemetry becomes a zero knowledge proof and policy result">
      <div className="pipeline-node"><LockKeyhole size={13} /><span title="Private driving data used by the proof.">PRIVATE TELEMETRY</span></div>
      <ChevronRight className="pipeline-arrow" size={15} />
      <div className="pipeline-node"><ShieldCheck size={13} /><span title="Proves a statement without revealing the underlying private data.">ZK PROOF</span></div>
      <ChevronRight className="pipeline-arrow" size={15} />
      <div className="pipeline-node"><Check size={13} /><span title="The conditions the insurer requires the trip to satisfy.">POLICY RESULT</span></div>
    </div>
  );
}

function VerificationFlow({ stage, result, mode }: { stage: number; result?: ProofResult; mode: DriveProofClient["mode"] }) {
  const verified = result?.status === "verified";
  const isMock = mode === "mock";
  const displayStages = verified ? [...pendingStages, "Verification confirmed"] : pendingStages;
  const progress = result ? 100 : Math.round(((stage + 1) / pendingStages.length) * 100);
  return (
    <section className="verification-panel" aria-live="polite">
      <div className="eyebrow">{isMock ? (result ? "MOCK RESULT" : "MOCK UX SIMULATION") : result ? "MIDNIGHT PREPROD RESULT" : "MIDNIGHT PREPROD FLOW"}</div>
      <h2>{result ? (result.status === "verified" ? "Verification confirmed" : result.reason === "replay" ? "Replay rejected" : "Proof generation rejected") : "Building your DriveProof"}</h2>
      <p>{result
        ? isMock
          ? "This product shell is ready for the generated Midnight client. No real proof or chain transaction was created in this run."
          : "The private witness was evaluated through the configured Midnight Preprod client."
        : isMock
          ? "A calm, staged view of the private proving flow. The current client is development-only."
          : "A staged view of the private proving flow, from attestation to Midnight verification."}</p>
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

function ResultBanner({ result, mode }: { result: ProofResult; mode: DriveProofClient["mode"] }) {
  const verified = result.status === "verified";
  const replay = result.status === "rejected" && result.reason === "replay";
  const isMock = mode === "mock";
  return (
    <section className={`state-banner ${verified ? "state-banner--verified" : "state-banner--rejected"}`} role="status" aria-live="polite">
      {verified ? <Check size={16} /> : replay ? <RotateCcw size={16} /> : <X size={16} />}
      <div>
        <h3>{verified ? isMock ? "DRIVEPROOF VERIFIED IN MOCK MODE" : "DRIVEPROOF VERIFIED ON MIDNIGHT PREPROD" : replay ? "REPLAY REJECTED" : "PROOF GENERATION REJECTED"}</h3>
        <p>{verified
          ? isMock
            ? "The safe fixture satisfied the demo policy. The insurer view receives only this proof-shaped result."
            : "The submitted private witness satisfied the authorized safety policy on Midnight Preprod. Only the compliance result was recorded; raw driving telemetry was not revealed."
          : replay
            ? `This attestation has already been used against ${POLICY_ID}.`
            : `This private witness cannot produce a valid proof for policy ${POLICY_ID}. Underlying telemetry remains private.`}</p>
        {verified && <div className="state-mono">{result.receipt.transactionId}</div>}
        {verified && !isMock && <PublicReceiptSummary receipt={result.receipt} />}
      </div>
    </section>
  );
}

function PublicReceiptSummary({ receipt }: { receipt: PublicProofReceipt }) {
  const fields = [
    ["Network", receipt.network],
    ["Block", receipt.blockHeight === undefined ? undefined : String(receipt.blockHeight)],
    ["Contract", receipt.contractAddress],
    ["Compliance", receipt.complianceStatus]
  ].filter((field): field is [string, string] => field[1] !== undefined);

  return (
    <div className="state-receipt" aria-label="Public proof receipt">
      {fields.map(([label, value]) => <span key={label}><small>{label}</small><strong>{value}</strong></span>)}
    </div>
  );
}

function ClientErrorBanner({ message }: { message: string }) {
  return (
    <section className="state-banner state-banner--rejected" role="alert" aria-live="assertive">
      <X size={16} />
      <div>
        <h3>DRIVEPROOF CLIENT ERROR</h3>
        <p>The proof could not be completed. No compliance result was recorded.</p>
        <div className="state-mono" style={{ color: "var(--danger)" }}>{message}</div>
      </div>
    </section>
  );
}

function TamperedNotice() {
  return (
    <section className="state-banner state-banner--rejected" role="status" aria-live="polite">
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

function ProductSidebar({
  mode,
  isOpen,
  insurerUrl,
  onNavigate,
  onResume
}: {
  mode: DriveProofClient["mode"];
  isOpen: boolean;
  insurerUrl: string;
  onNavigate: () => void;
  onResume: () => void;
}) {
  return (
    <aside className={`product-sidebar ${isOpen ? "product-sidebar--open" : ""}`} aria-label="Driver navigation">
      <div className="product-sidebar-top">
        <a className="brand" href="/" aria-label="DriveProof home">
          <span className="brand-mark">D</span><span className="brand-word">DRIVEPROOF</span>
        </a>
        <button className="mobile-sidebar-close" onClick={onNavigate} type="button" aria-label="Close navigation"><X size={17} /></button>
      </div>
      <nav className="product-navigation" aria-label="Product sections">
        <div className="product-navigation-label">Workspace</div>
        <a className="product-nav-link product-nav-link--active" href="#overview" onClick={onNavigate}><LayoutDashboard size={15} /> Overview</a>
        <a className="product-nav-link" href="#create-proof" onClick={onNavigate}><ShieldCheck size={15} /> Create proof</a>
        <a className="product-nav-link" href="#privacy" onClick={onNavigate}><LockKeyhole size={15} /> Privacy</a>
        <div className="product-navigation-divider" />
        <div className="product-navigation-label">Surfaces</div>
        <a className="product-nav-link" href={insurerUrl} onClick={onNavigate}><ArrowUpRight size={15} /> Insurer view</a>
        <a className="product-nav-link" href="/wallet-debug" onClick={onNavigate}><Code2 size={15} /> Technical evidence <span className="product-nav-note">DEV</span></a>
      </nav>
      <div className="product-sidebar-footer">
        <div className="product-sidebar-status">
          <span>Network target</span>
          <strong>MIDNIGHT PREPROD</strong>
        </div>
        <button className="product-help-button" onClick={onResume} type="button"><HelpCircle size={15} /> Help &amp; walkthrough</button>
        <div className="product-sidebar-mode">{mode === "mock" ? "MOCK CLIENT · PRODUCT SURFACE" : "REAL CLIENT · PRODUCT SURFACE"}</div>
      </div>
    </aside>
  );
}

function ProductStatusStrip({
  client,
  hasAttestation,
  connection
}: {
  client: DriveProofClient;
  hasAttestation: boolean;
  connection: DriveProofConnectionState;
}) {
  const isMock = client.mode === "mock";
  const walletLabel = isMock
    ? "MOCK MODE"
    : connection.status === "connected"
      ? "CONNECTED"
      : connection.status === "connecting"
        ? "CONNECTING"
        : "ACTION NEEDED";
  const networkLabel = isMock
    ? "MOCK MODE"
    : connection.status === "connected"
      ? connection.network.toUpperCase()
      : "PREPROD TARGET";
  return (
    <section className="product-status-strip" aria-label="Driver readiness">
      <div className="product-status-intro">
        <div className="eyebrow">DRIVER OVERVIEW</div>
        <h2>Your driving data is not shared with the insurer.</h2>
        <p>The insurer receives only whether your signed trip satisfies the policy.</p>
      </div>
      <div className="product-status-items">
        <div className="product-status-item">
          <span>Wallet</span>
          <strong>{walletLabel}</strong>
          <small>{isMock ? "Lace lives in Technical evidence." : connection.status === "connected" ? "Lace session authorized." : "Connect Lace to continue."}</small>
        </div>
        <div className="product-status-item">
          <span>Network</span>
          <strong>{networkLabel}</strong>
          <small>{isMock ? "target environment" : connection.status === "connected" ? "validated by client" : "validated after connection"}</small>
        </div>
        <div className="product-status-item">
          <span>Proof readiness</span>
          <strong className={hasAttestation ? "product-status-good" : ""}>{hasAttestation ? "READY" : "ACTION NEEDED"}</strong>
          <small>{hasAttestation ? "attested trip loaded" : "prepare an attested trip"}</small>
        </div>
      </div>
    </section>
  );
}

function ProductProofStepper({
  client,
  hasAttestation,
  walletConnected,
  flowState,
  result
}: {
  client: DriveProofClient;
  hasAttestation: boolean;
  walletConnected: boolean;
  flowState: DriverFlowState;
  result?: ProofResult;
}) {
  const steps = getDriverProofSteps({ mode: client.mode, hasAttestation, walletConnected, flowState, result });
  const stateLabel: Record<ReturnType<typeof getDriverProofSteps>[number]["state"], string> = {
    complete: "complete",
    current: "next",
    upcoming: "up next",
    unavailable: "mock path"
  };

  return (
    <ol className="product-proof-stepper" aria-label="Private proof creation steps">
      {steps.map((step, index) => (
        <li className={`product-proof-step product-proof-step--${step.state}`} key={step.id}>
          <span className="product-proof-step-number">{step.state === "complete" ? <Check size={12} strokeWidth={3} /> : String(index + 1).padStart(2, "0")}</span>
          <div className="product-proof-step-copy">
            <div className="product-proof-step-heading">
              <strong>{step.label}</strong>
              <span>{stateLabel[step.state]}</span>
            </div>
            <p>{step.description}</p>
            {step.note && <small>{step.note}</small>}
          </div>
        </li>
      ))}
    </ol>
  );
}

const onboardingTasks: Array<{
  id: OnboardingTaskId;
  number: string;
  title: string;
  duration: string;
  description: string;
  why: string;
  action: string;
  href: string;
}> = [
  {
    id: "connect-wallet",
    number: "01",
    title: "Connect Lace",
    duration: "Required",
    description: "Connect the browser wallet used to authorize Midnight transactions.",
    why: "This is the boundary between the product surface and the engineering wallet path.",
    action: "Open wallet path",
    href: "/wallet-debug"
  },
  {
    id: "privacy-boundary",
    number: "02",
    title: "Understand the privacy boundary",
    duration: "~30 sec",
    description: "See which driving fields stay private and which result can be shared.",
    why: "A proof is useful because the insurer does not need the journey behind it.",
    action: "View privacy boundary",
    href: "#privacy"
  },
  {
    id: "create-proof",
    number: "03",
    title: "Create your first private proof",
    duration: "Required",
    description: "Load an issuer-signed trip and evaluate it against the current policy.",
    why: "The proof checks the signed measurement without displaying the raw trip to the insurer.",
    action: "Open proof flow",
    href: "#create-proof"
  },
  {
    id: "insurer-result",
    number: "04",
    title: "View what an insurer receives",
    duration: "~30 sec",
    description: "Open the verifier view and inspect the public-safe result boundary.",
    why: "The insurer sees a compliance result and relevant receipt metadata, not private telemetry.",
    action: "Open Insurer",
    href: "http://localhost:5174/"
  }
];

function browserStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function initialConnectionState(client: DriveProofClient): DriveProofConnectionState {
  return client.getConnectionState?.() ?? (client.mode === "mock"
    ? { status: "connected", network: "mock" }
    : { status: "disconnected" });
}

function connectionErrorMessage(connection: DriveProofConnectionState): string | undefined {
  if (connection.status === "error") return connection.message;
  if (connection.status === "unavailable") return connection.reason;
  if (connection.status === "wrong-network") {
    return `Lace reported ${connection.network}; expected ${connection.expectedNetwork}.`;
  }
  return undefined;
}

function PrivateTripPlaceholder({
  client,
  walletConnected,
  onPrepare
}: {
  client: DriveProofClient;
  walletConnected: boolean;
  onPrepare: () => void;
}) {
  return (
    <section className="panel route-card private-trip-placeholder">
      <div className="panel-heading">
        <div><h2 className="panel-title">Private Trip</h2><p className="panel-subtitle">An attested measurement appears here after the session is ready.</p></div>
        <div className="status-label">Awaiting trip</div>
      </div>
      <div className="private-trip-placeholder-body">
        <LockKeyhole size={22} strokeWidth={1.5} />
        <div>
          <h3>{walletConnected ? "Prepare an attested drive" : "Connect Lace to begin"}</h3>
          <p>{walletConnected
            ? "The Vehicle Attestor Simulator will issue the signed private measurement used by the current proof."
            : "DriveProof uses Lace only to authorize Midnight Preprod transactions. Raw trip data is not sent to the wallet."}</p>
          {walletConnected && <button className="secondary-button" onClick={onPrepare} type="button">PREPARE ATTESTED DRIVE <ChevronRight size={14} /></button>}
        </div>
      </div>
      <div className="lock-line"><ShieldCheck size={12} /> no private measurement has been loaded yet</div>
      {client.mode === "midnight" && !walletConnected && <div className="private-trip-placeholder-note">Use the primary action in the proof panel to connect Lace.</div>}
    </section>
  );
}

function PrivateMeasurementCard() {
  return (
    <section className="panel route-card private-trip-placeholder">
      <div className="panel-heading">
        <div><h2 className="panel-title">Private Trip</h2><p className="panel-subtitle">The current v2 contract proves one issuer-signed speed measurement.</p></div>
        <div className="status-label">Local only</div>
      </div>
      <div className="private-trip-placeholder-body">
        <LockKeyhole size={22} strokeWidth={1.5} />
        <div>
          <h3>Attested measurement ready</h3>
          <p>The signed measurement is held in the private witness. Route and expanded telemetry are not part of this contract version.</p>
        </div>
      </div>
      <div className="lock-line"><ShieldCheck size={12} /> the authorized attestor signs the private measurement</div>
    </section>
  );
}

function OnboardingChecklist({
  insurerUrl,
  state,
  onStateChange,
  clientMode,
  proofVerified,
  onConnect
}: {
  insurerUrl: string;
  state: OnboardingState;
  onStateChange: (nextState: OnboardingState) => void;
  clientMode: DriveProofClient["mode"];
  proofVerified: boolean;
  onConnect?: () => void;
}) {
  const progress = onboardingProgress(state);

  if (state.dismissed) {
    return <button className="onboarding-resume" onClick={() => onStateChange({ ...state, dismissed: false })} type="button"><RotateCcw size={14} /> Resume onboarding</button>;
  }

  return (
    <section className="onboarding-panel" aria-labelledby="onboarding-title">
      <div className="onboarding-header">
        <div>
          <div className="eyebrow">FIRST-RUN GUIDE</div>
          <h2 id="onboarding-title">Get started with DriveProof</h2>
          <p>Four short steps to understand the proof and its privacy boundary.</p>
        </div>
        <div className="onboarding-header-actions">
          <span className="onboarding-progress-label">{progress.completed} / {progress.total} complete</span>
          <button className="onboarding-text-button" onClick={() => onStateChange({ ...state, dismissed: true })} type="button">Dismiss</button>
        </div>
      </div>
      <div className="onboarding-progress-track" aria-hidden="true"><span style={{ width: `${(progress.completed / progress.total) * 100}%` }} /></div>
      <div className="onboarding-tasks">
        {onboardingTasks.map((task) => {
          const completed = state.completed[task.id];
          const href = task.id === "insurer-result" ? insurerUrl : task.href;
          const canComplete = canCompleteOnboardingTask(task.id, clientMode, proofVerified);
          const completeFromGuide = () => {
            if (canComplete) onStateChange(completeOnboardingTask(state, task.id));
          };
          return (
            <details className={`onboarding-task ${completed ? "onboarding-task--complete" : ""}`} key={task.id}>
              <summary>
                <span className="onboarding-task-number">{completed ? <Check size={12} strokeWidth={3} /> : task.number}</span>
                <span className="onboarding-task-title">{task.title}</span>
                <span className="onboarding-task-duration">{completed ? "DONE · LOCAL UI" : task.duration}</span>
              </summary>
              <div className="onboarding-task-body">
                <p>{task.description}</p>
                <small><strong>Why it matters</strong> {task.why}</small>
                <div className="onboarding-task-actions">
                  {task.id === "connect-wallet" && clientMode === "midnight" && onConnect
                    ? <button className="secondary-button" onClick={onConnect} type="button">Connect Lace <ArrowUpRight size={13} /></button>
                    : <a className="secondary-button" href={href} onClick={() => task.id !== "connect-wallet" && completeFromGuide()}>{task.action} <ArrowUpRight size={13} /></a>}
                  {canComplete
                    ? <button className="onboarding-complete-button" onClick={completeFromGuide} type="button">{completed ? "Completed locally" : "Mark complete"}</button>
                    : <span className="onboarding-complete-note">Completes after a verified result</span>}
                </div>
              </div>
            </details>
          );
        })}
      </div>
      <div className="onboarding-footer"><span>Completion is saved in this browser only.</span><button className="onboarding-text-button" onClick={() => onStateChange(resetOnboardingState())} type="button">Restart walkthrough</button></div>
    </section>
  );
}

export type DriverExperienceProps = {
  client: DriveProofClient;
  stageDelayMs?: number;
};

export function DriverExperience({ client, stageDelayMs = 650 }: DriverExperienceProps) {
  const isMock = client.mode === "mock";
  const storage = browserStorage();
  const [fixture, setFixture] = useState<DemoFixture>("safe");
  const [attestation, setAttestation] = useState<TripAttestation>();
  const [result, setResult] = useState<ProofResult>();
  const [stage, setStage] = useState(0);
  const [flowState, setFlowState] = useState<DriverFlowState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [connection, setConnection] = useState<DriveProofConnectionState>(() => initialConnectionState(client));
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPreparingTrip, setIsPreparingTrip] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(() => loadOnboardingState(storage));
  const isVerifying = flowState === "preparing" || flowState === "proving" || flowState === "submitting";
  const walletConnected = isMock || connection.status === "connected";
  const isBusy = isConnecting || isPreparingTrip || isVerifying;

  function updateOnboardingState(nextState: OnboardingState) {
    setOnboardingState(nextState);
    saveOnboardingState(storage, nextState);
  }

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setAttestation(undefined);
    setResult(undefined);
    setStage(0);
    setErrorMessage(undefined);
    setFlowState("idle");

    if (!isMock) {
      setConnection(initialConnectionState(client));
      setIsLoading(false);
      return () => { cancelled = true; };
    }

    void client.issueDemoTrip(fixture)
      .then((nextAttestation) => {
        if (!cancelled) {
          setAttestation(nextAttestation);
          setIsLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setErrorMessage(normalizeClientError(error));
          setFlowState("error");
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [client, fixture, isMock]);

  useEffect(() => {
    if (client.mode !== "midnight" || connection.status !== "connected") return;

    setOnboardingState((current) => {
      if (current.completed["connect-wallet"]) return current;
      const next = completeOnboardingTask(current, "connect-wallet");
      saveOnboardingState(storage, next);
      return next;
    });
  }, [client.mode, connection.status, storage]);

  useEffect(() => {
    if (client.mode !== "midnight" || result?.status !== "verified") return;

    setOnboardingState((current) => {
      if (current.completed["create-proof"]) return current;
      const next = completeOnboardingTask(current, "create-proof");
      saveOnboardingState(storage, next);
      return next;
    });
  }, [client.mode, result, storage]);

  async function connectWallet() {
    if (isMock || isConnecting || isVerifying) return;
    if (!client.connect) {
      setErrorMessage("This real client does not expose a wallet connection method.");
      setFlowState("error");
      return;
    }

    setErrorMessage(undefined);
    setIsConnecting(true);
    try {
      const nextConnection = await client.connect();
      setConnection(nextConnection);
      if (nextConnection.status === "error" || nextConnection.status === "unavailable") {
        setErrorMessage(connectionErrorMessage(nextConnection));
        setFlowState("error");
      } else {
        setFlowState("idle");
      }
    } catch (error: unknown) {
      setErrorMessage(normalizeClientError(error));
      setFlowState("error");
    } finally {
      setIsConnecting(false);
    }
  }

  async function prepareAttestedTrip() {
    if (isMock || !walletConnected || isBusy) return;

    setErrorMessage(undefined);
    setResult(undefined);
    setIsPreparingTrip(true);
    setFlowState("preparing");
    try {
      const nextAttestation = await client.issueDemoTrip(fixture);
      setAttestation(nextAttestation);
      setFlowState("idle");
    } catch (error: unknown) {
      setErrorMessage(normalizeClientError(error));
      setFlowState("error");
    } finally {
      setIsPreparingTrip(false);
    }
  }

  async function generateProof() {
    if (!attestation || isBusy) return;
    setResult(undefined);
    setErrorMessage(undefined);
    try {
      if (client.mode === "mock") {
        setFlowState("preparing");
        for (let index = 0; index < pendingStages.length; index += 1) {
          setStage(index);
          setFlowState(index >= 4 ? "submitting" : index >= 3 ? "proving" : "preparing");
          if (stageDelayMs > 0) await wait(stageDelayMs);
        }
      } else {
        // The real client owns deploy, proving, wallet approval, and submit.
        // Keep one honest coarse stage until that product operation resolves.
        setStage(3);
        setFlowState("proving");
      }
      const nextResult = await client.proveCompliance(attestation, POLICY_ID);
      setResult(nextResult);
      setFlowState(nextResult.status === "verified" ? "verified" : "rejected");
    } catch (error: unknown) {
      setResult(undefined);
      setErrorMessage(normalizeClientError(error));
      setFlowState("error");
    }
  }

  const primaryAction = !walletConnected ? connectWallet : !attestation ? prepareAttestedTrip : generateProof;
  const primaryLabel = isConnecting
    ? "CONNECTING TO LACE"
    : isPreparingTrip
      ? "REQUESTING ATTESTATION"
      : isVerifying
        ? "GENERATING PROOF"
        : !walletConnected
          ? "CONNECT LACE"
          : !attestation
            ? "PREPARE ATTESTED DRIVE"
            : result?.status === "verified"
              ? "RESUBMIT SAME ATTESTATION"
              : "CREATE PRIVATE PROOF";
  const insurerUrl = insurerUrlForResult(fixture, result);
  const connectionError = connectionErrorMessage(connection);

  if (isLoading) {
    return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to main content</a><main className="shell-content" id="main-content"><div className="empty-state"><div><div className="eyebrow">DRIVEPROOF · DRIVER</div><h1>Preparing private trip</h1><p>Loading the deterministic demo fixture.</p></div></div></main></div>;
  }

  return (
    <div className="app-shell driver-shell product-app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <ProductSidebar isOpen={isNavOpen} mode={client.mode} insurerUrl={insurerUrl} onNavigate={() => setIsNavOpen(false)} onResume={() => { setIsNavOpen(false); updateOnboardingState({ ...onboardingState, dismissed: false }); }} />
      {isNavOpen && <button className="product-sidebar-scrim" onClick={() => setIsNavOpen(false)} type="button" aria-label="Close navigation" />}
      <div className="product-main">
        <div className="shell-content">
        <header className="topbar product-topbar">
          <button className="mobile-menu-button" onClick={() => setIsNavOpen(true)} type="button" aria-label="Open navigation"><Menu size={18} /></button>
          <a className="brand product-mobile-brand" href="/" aria-label="DriveProof home"><span className="brand-mark">D</span><span className="brand-word">DRIVEPROOF</span></a>
          <div className="topbar-right">
            <a className="quiet-link" href={insurerUrl}>Insurer view <ArrowUpRight size={13} /></a>
            <span className="environment-chip"><span className="environment-dot" /> {client.displayName}</span>
          </div>
        </header>

        <main id="main-content">
          <section className="hero product-hero" id="overview">
            <div>
              <div className="eyebrow">DRIVER CONSOLE · {fixtureLabel(fixture)}</div>
              <h1>PRIVATE BY<br />DEFAULT.</h1>
              <p className="hero-copy">Prove you drove safely <strong>without revealing where you drove.</strong></p>
            </div>
            <div className="vehicle-card"><div className="eyebrow">VEHICLE</div><div className="vehicle-name">{VEHICLE_ID}</div><div className="vehicle-detail">Personal trip · Today, 09:42</div></div>
          </section>

          <ProductStatusStrip client={client} hasAttestation={Boolean(attestation)} connection={connection} />

          <section className="dashboard-grid">
            <div>
              {attestation && attestation.samples.length > 0
                ? <section className="panel route-card">
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
                : attestation
                  ? <PrivateMeasurementCard />
                  : <PrivateTripPlaceholder client={client} walletConnected={walletConnected} onPrepare={() => void prepareAttestedTrip()} />}
              <PrivacyPanel attestation={attestation} receipt={result?.status === "verified" ? result.receipt : undefined} />
            </div>

            <section className="panel proof-panel" id="create-proof">
              <div className="panel-padding">
                <div className="panel-heading"><div><div className="eyebrow">PRIVATE PROOF</div><h2 className="panel-title">Create a private proof</h2><p className="panel-subtitle">The insurer receives only whether your signed trip satisfies the policy.</p></div><div className="status-label">{POLICY_ID}</div></div>
                <ProductProofStepper client={client} hasAttestation={Boolean(attestation)} walletConnected={walletConnected} flowState={flowState} result={result} />
                <div className="proof-orbit"><ShieldCheck className="proof-orbit-icon" size={32} strokeWidth={1.3} /><span className="proof-orbit-label">PRIVATE WITNESS</span></div>
                <ProofPipeline />
                <div className="proof-list">
                  <div className="proof-row"><span className="proof-row-label" title="A cryptographic signature from an authorized telemetry source.">Authorized attestation</span><span className="proof-row-value">{attestation ? "ready" : "waiting"}</span></div>
                  <div className="proof-row"><span className="proof-row-label" title="The conditions the insurer requires the trip to satisfy.">Safety policy</span><span className="proof-row-value">{POLICY_ID}</span></div>
                  <div className="proof-row"><span className="proof-row-label">Replay protection</span><span className="proof-row-value">active</span></div>
                </div>
                <div style={{ marginTop: "auto", paddingTop: 23 }}>
                  <button className="primary-button" disabled={isBusy} onClick={() => void primaryAction()} type="button">
                    {primaryLabel}
                    {isBusy ? <Zap size={14} /> : <ChevronRight size={15} />}
                  </button>
                  <p className="proof-footnote"><Code2 size={11} style={{ verticalAlign: "-2px", marginRight: 4 }} /> {client.displayName} {isMock ? "· no chain transaction" : "· Lace approval required"}</p>
                </div>
              </div>
            </section>
          </section>

          <OnboardingChecklist insurerUrl={insurerUrl} state={onboardingState} onStateChange={updateOnboardingState} clientMode={client.mode} proofVerified={result?.status === "verified"} onConnect={() => void connectWallet()} />

          {fixture === "tampered" && <TamperedNotice />}
          {flowState === "error" && errorMessage && <ClientErrorBanner message={errorMessage} />}
          {flowState !== "error" && connectionError && <ClientErrorBanner message={connectionError} />}
          {isVerifying && <VerificationFlow mode={client.mode} stage={stage} />}
          {result && !isVerifying && <><ResultBanner mode={client.mode} result={result} /><VerificationFlow mode={client.mode} stage={pendingStages.length - 1} result={result} /></>}
        </main>
        </div>
      </div>
      {isMock && <DemoControls fixture={fixture} onFixtureChange={setFixture} />}
    </div>
  );
}

export type DriverAppProps = {
  client: DriveProofClient;
};

export default function App({ client }: DriverAppProps) {
  const walletDebugEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_WALLET_DEBUG === "true";
  if (walletDebugEnabled && window.location.pathname === "/wallet-debug") {
    return <WalletDebugPage />;
  }
  if (import.meta.env.DEV && window.location.pathname === "/wallet-debug/transaction") {
    return <PreprodTransactionDebugPage />;
  }
  if (window.location.pathname === "/" || window.location.pathname === "") {
    return <LandingPage mode={client.mode} />;
  }
  return <DriverExperience client={client} />;
}
