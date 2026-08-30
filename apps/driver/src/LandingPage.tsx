import {
  ArrowRight,
  ArrowUpRight,
  Check,
  EyeOff,
  Fingerprint,
  LockKeyhole,
  ShieldCheck
} from "lucide-react";
import type { DriveProofClientMode } from "@driveproof/types";

function Brand({ href = "/" }: { href?: string }) {
  return (
    <a className="brand" href={href} aria-label="DriveProof home">
      <span className="brand-mark">D</span><span className="brand-word">DRIVEPROOF</span>
    </a>
  );
}

function LandingProofVisual() {
  return (
    <div className="landing-proof-visual" aria-label="Private telemetry becomes a public compliance result">
      <div className="landing-proof-visual-top">
        <span>PRIVATE INPUT</span><span>PUBLIC RESULT</span>
      </div>
      <div className="landing-proof-visual-body">
        <div className="landing-private-zone">
          <div className="landing-telemetry-slate">
            <div className="landing-telemetry-route" aria-hidden="true"><i /><i /><i /><i /><i /></div>
            <div><strong>PRIVATE TELEMETRY</strong><span>route · speed · braking</span></div>
          </div>
          <div className="landing-attestor-node"><Fingerprint size={15} /><div><strong>AUTHORIZED ATTESTOR</strong><span>issuer-signed</span></div></div>
        </div>
        <div className="landing-proof-bridge" aria-hidden="true">
          <span /><span /><span />
          <div className="landing-proof-badge"><ShieldCheck size={19} /><b>ZK PROOF</b></div>
        </div>
        <div className="landing-public-zone">
          <div className="landing-compliance-token"><Check size={20} strokeWidth={2.4} /><div><strong>COMPLIANT</strong><span>policy result</span></div></div>
          <div className="landing-public-caption">no route disclosed</div>
        </div>
      </div>
      <div className="landing-proof-visual-footer"><LockKeyhole size={13} /> Raw telemetry is not revealed to the insurer or public ledger.</div>
    </div>
  );
}

function FlowArrow() {
  return <ArrowRight className="landing-flow-arrow" size={17} aria-hidden="true" />;
}

export function LandingPage({ mode = "mock" }: { mode?: DriveProofClientMode }) {
  const isMock = mode === "mock";
  const insurerOrigin = (import.meta.env.VITE_INSURER_ORIGIN?.trim()
    || import.meta.env.VITE_INSURER_URL?.trim()
    || "http://localhost:5174").replace(/\/$/, "");
  const insurerUrl = `${insurerOrigin}/`;

  return (
    <div className="landing-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="landing-nav">
        <Brand />
        <nav className="landing-nav-links" aria-label="Landing page sections">
          <a href="#how-it-works">How it works</a>
          <a href="#privacy">Privacy</a>
          <a href="#drivers">For drivers</a>
          <a href="#insurers">For insurers</a>
          <a href="#technical-proof">Technical proof</a>
        </nav>
        <div className="landing-nav-actions">
          <span className="landing-network-chip"><span /> {isMock ? "MIDNIGHT · PREPROD TARGET" : "REAL · MIDNIGHT PREPROD"}</span>
          <a className="landing-nav-cta" href="/driver">Launch DriveProof <ArrowUpRight size={14} /></a>
        </div>
      </header>

      <main id="main-content">
        <section className="landing-hero landing-section-width" aria-labelledby="landing-hero-title">
          <div className="landing-hero-copy">
            <div className="landing-eyebrow">PRIVATE INSURANCE INFRASTRUCTURE</div>
            <h1 id="landing-hero-title">Prove you drove safely.<br /><em>Not where you drove.</em></h1>
            <p>DriveProof lets drivers prove that privately attested vehicle telemetry satisfies an insurer&apos;s safety policy  without revealing the trip to the insurer or public ledger.</p>
            <div className="landing-hero-actions">
              <a className="landing-button landing-button--primary" href="/driver">Launch Driver <ArrowRight size={15} /></a>
              <a className="landing-button landing-button--quiet" href="#how-it-works">See how it works <ArrowRight size={15} /></a>
            </div>
            <div className="landing-trust-line">
              <span>Built on Midnight</span>
              <i />
              <span>Zero knowledge protects privacy.</span>
              <span>Attestation protects integrity.</span>
            </div>
          </div>
          <LandingProofVisual />
        </section>

        <section className="landing-section landing-section-width landing-problem" aria-labelledby="problem-title">
          <div className="landing-section-heading">
            <div className="landing-eyebrow">THE PRIVACY PROBLEM</div>
            <h2 id="problem-title">A safe-driving signal should not require a surveillance archive.</h2>
          </div>
          <div className="landing-model-compare">
            <div className="landing-model landing-model--traditional">
              <div className="landing-model-label">TRADITIONAL MODEL</div>
              <div className="landing-model-flow"><strong>Driver</strong><FlowArrow /><span>uploads route, speed<br />and behavior</span><FlowArrow /><strong>Insurer stores everything</strong></div>
              <p>Usage-based insurance often asks for the full history behind a single pricing or eligibility decision.</p>
            </div>
            <div className="landing-model landing-model--driveproof">
              <div className="landing-model-label">DRIVEPROOF</div>
              <div className="landing-model-flow"><strong>Driver</strong><FlowArrow /><span>proves policy<br />compliance</span><FlowArrow /><strong className="landing-accent-text">Insurer receives result</strong></div>
              <p>The journey stays private while the policy outcome becomes verifiable.</p>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section-width" id="how-it-works" aria-labelledby="how-title">
          <div className="landing-section-heading landing-section-heading--row">
            <div><div className="landing-eyebrow">HOW DRIVEPROOF WORKS</div><h2 id="how-title">A smaller disclosure surface.</h2></div>
            <p>Each step has a clear owner. The private witness stays private throughout the proof.</p>
          </div>
          <ol className="landing-step-grid">
            <li><span>01</span><h3>Attest</h3><p>An authorized vehicle attestor signs the telemetry used by the proof.</p><small>Trust enters at the issuer boundary.</small></li>
            <li><span>02</span><h3>Prove</h3><p>The driver privately evaluates the signed data against the insurer&apos;s policy.</p><small>Raw telemetry is a private witness.</small></li>
            <li><span>03</span><h3>Verify</h3><p>Midnight verifies the zero-knowledge proof without receiving the underlying trip.</p><small>Policy predicates, not a route, are checked.</small></li>
            <li><span>04</span><h3>Share</h3><p>The insurer receives the compliance result and the public metadata required by the protocol.</p><small>Minimal disclosure by design.</small></li>
          </ol>
        </section>

        <section className="landing-section landing-section-width landing-privacy-section" id="privacy" aria-labelledby="privacy-title">
          <div className="landing-section-heading">
            <div className="landing-eyebrow">WHAT STAYS PRIVATE</div>
            <h2 id="privacy-title">Keep the trip. Share the proof.</h2>
            <p>The public result is intentionally smaller than the data used to produce it.</p>
          </div>
          <div className="landing-privacy-table">
            <div className="landing-privacy-column landing-privacy-column--private">
              <div className="landing-privacy-column-heading"><LockKeyhole size={16} /><span>PRIVATE WITNESS</span><b>NOT SHARED WITH INSURER</b></div>
              <ul><li>Raw speed</li><li>Location and route</li><li>Braking behavior</li><li>Private witness</li><li>Attestation material as appropriate</li></ul>
            </div>
            <div className="landing-privacy-divider" aria-hidden="true"><span>BOUNDARY</span></div>
            <div className="landing-privacy-column landing-privacy-column--public">
              <div className="landing-privacy-column-heading"><Check size={16} /><span>PUBLIC RESULT</span><b>SHARED FOR VERIFICATION</b></div>
              <ul><li>Compliance result</li><li>Transaction metadata</li><li>Contract state required by protocol</li><li>Exact final fields pending contract handoff</li></ul>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section-width landing-trust-section" aria-labelledby="trust-title">
          <div className="landing-trust-copy">
            <div className="landing-eyebrow">TRUST MODEL</div>
            <h2 id="trust-title">Zero knowledge proves what the signed data says.</h2>
            <p>The attestor establishes where that data came from. The prototype uses a Vehicle Attestor Simulator as its trust root; production could replace it with an OEM telematics control unit, secure vehicle computer, trusted OBD hardware, or a hardware-backed telemetry provider.</p>
          </div>
          <div className="landing-trust-note"><Fingerprint size={17} /><div><strong>PROTOTYPE TRUST ROOT</strong><span>Vehicle Attestor Simulator</span><small>Physical sensor provenance is outside the current claim.</small></div></div>
        </section>

        <section className="landing-section landing-section-width landing-preview-section" id="drivers" aria-labelledby="preview-title">
          <div className="landing-section-heading landing-section-heading--row"><div><div className="landing-eyebrow">ONE PRODUCT · TWO VIEWS</div><h2 id="preview-title">Proof for the driver.<br />Confidence for the insurer.</h2></div><p>Both surfaces show the same boundary from a different side.</p></div>
          <div className="landing-preview-grid">
            <div className="landing-preview landing-preview--driver">
              <div className="landing-preview-top"><span>DRIVER</span><span className="landing-preview-status">PRIVATE BY DEFAULT</span></div>
              <div className="landing-preview-content"><div className="landing-preview-route" aria-hidden="true"><span /><span /><span /><span /></div><strong>Keep the trip.<br />Share the proof.</strong><p>Inspect the private journey, then create a policy proof.</p></div>
              <a href="/driver">Open Driver <ArrowUpRight size={14} /></a>
            </div>
            <div className="landing-preview landing-preview--insurer" id="insurers">
              <div className="landing-preview-top"><span>INSURER</span><span className="landing-preview-status">PUBLIC RESULT</span></div>
              <div className="landing-preview-content"><div className="landing-preview-result"><Check size={18} /><span>COMPLIANT</span></div><strong>Verify risk<br />without the route.</strong><p>Review only the result and public-safe receipt metadata.</p></div>
              <a href={insurerUrl}>Open Insurer <ArrowUpRight size={14} /></a>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section-width landing-evidence-section" id="technical-proof" aria-labelledby="evidence-title">
          <div className="landing-section-heading landing-section-heading--row"><div><div className="landing-eyebrow">REAL MIDNIGHT EVIDENCE</div><h2 id="evidence-title">The product story has a real checkpoint.</h2></div><a className="landing-text-link" href="/wallet-debug">View technical evidence <ArrowUpRight size={14} /></a></div>
          <div className="landing-evidence-strip">
            <div className="landing-evidence-network"><span className="landing-evidence-dot" /><strong>MIDNIGHT PREPROD</strong><small>confirmed checkpoint</small></div>
            <div><span>Real deployment</span><strong><Check size={13} /> SucceedEntirely</strong></div>
            <div><span>Real private proof</span><strong><Check size={13} /> SucceedEntirely</strong></div>
            <div><span>Unsafe policy</span><strong><Check size={13} /> Rejected</strong></div>
            <div><span>Tampered witness</span><strong><Check size={13} /> Rejected</strong></div>
          </div>
          <p className="landing-evidence-note">{isMock
            ? "The product surface is clearly labeled mock until real mode is selected. Technical evidence is available in the engineering harness."
            : "Real mode uses the injected Midnight client; the engineering harness remains available for detailed transaction evidence."}</p>
        </section>

        <section className="landing-final-cta landing-section-width" aria-labelledby="final-title">
          <div><div className="landing-eyebrow">PRIVATE BY DESIGN</div><h2 id="final-title">Prove the policy.<br /><em>Keep the trip.</em></h2></div>
          <div className="landing-final-actions"><a className="landing-button landing-button--primary" href="/driver">Launch Driver <ArrowRight size={15} /></a><a className="landing-text-link" href="/wallet-debug">View technical proof <ArrowUpRight size={14} /></a></div>
        </section>
      </main>

      <footer className="landing-footer landing-section-width"><Brand /><span>{isMock ? "MOCK · PRODUCT PREVIEW" : "REAL · MIDNIGHT PREPROD"}</span><small>Zero knowledge protects privacy · attestation protects integrity.</small></footer>
    </div>
  );
}
