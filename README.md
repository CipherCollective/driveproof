# DriveProof

> "Prove you drove safely without revealing where you drove."

DriveProof lets a driver prove that telemetry issued by an authorized vehicle attestor satisfies an insurer's safety policy without revealing the private telemetry to the insurer or public ledger.

Built for the Midnight Hackathon — August 2026.

## The problem

Usage-based insurance creates a privacy tradeoff: to prove safe driving, drivers are often asked to surrender detailed route, location, speed, and braking history. That is more information than an insurer needs to answer one question: did the trip satisfy the policy?

## The idea

Zero knowledge protects privacy.
Attestation protects integrity.

## How it works

1. A Vehicle Attestor Simulator acts as the prototype trust root.
2. The attestor issues a signed private driving measurement.
3. The Driver holds the measurement and signature in private state.
4. The Compact contract verifies the configured attestor's Schnorr-on-Jubjub signature.
5. Compact privately checks the Phase 1 policy predicate: signed speed is at or below the public limit.
6. A successful proof increments the public compliance result on Midnight Preprod.
7. An insurer can verify the result without receiving the raw measurement or route.

The current Phase 1 contract proves one signed speed value. Subject binding, deterministic nullifiers, replay protection in contract state, and expanded telemetry are separate pending work.

### Trust root

**Prototype:** Vehicle Attestor Simulator.

**Production examples:** OEM telematics module, secure vehicle computer, trusted OBD hardware, or a hardware-backed telemetry provider.

The simulator is an explicit trust boundary. DriveProof does not claim that it independently proves physical sensor or GPS provenance.

## Why Midnight

An ordinary hash can commit to a route or telemetry file, but it cannot let an insurer verify a policy predicate over hidden values. The driver would still need to reveal the preimage, or a traditional backend would need to receive and retain the raw telemetry. Hashing also does not, by itself, prove that an authorized issuer signed the measurement or prevent reuse.

Midnight supplies the intended combination of private witnesses, zero-knowledge policy predicates, registered-attestor verification, and minimal public disclosure. Deterministic nullifier/replay protection is pending the next contract phase and is not claimed as part of the Phase 1 evidence.

## Privacy boundary

Raw driving telemetry is not revealed to the insurer or public ledger. The real Phase 1 proof uses a private speed/signature witness; the polished Driver UI also contains a deterministic 16-sample product fixture for visual demonstration, which is not the Phase 1 contract input.

For the verified Preprod proof call, the observed public application result was `complianceCount = 1`. Transaction metadata and deployed contract state are public chain data. The insurer-facing product surface is still an explicitly labeled mock verifier until the product `MidnightDriveProofClient` is wired to the generated contract API.

## Security model

### What DriveProof proves

- The private Phase 1 measurement was signed by the configured attestor.
- The signed measurement satisfies the Compact policy predicate.
- The private measurement itself is not published on-chain.

### What DriveProof does not prove in the prototype

- That the simulator measurement came from a physical vehicle.
- That the simulator or any issuer cannot lie.
- That a production hardware trust root has been implemented.

The attestor is therefore an explicit trust assumption, not a claim of independently verified sensor provenance.

### Privacy data flow

| Data | Driver | Attestor | Insurer | Public ledger |
| --- | --- | --- | --- | --- |
| Raw telemetry / speed | Private witness; Phase 1 uses one speed value. The 16-sample view is a product fixture only. | Simulator owns the demo measurement and signs it. | Not received by the current verifier surface. | Raw value is not published. |
| Driver binding / subject secret | Not implemented in Phase 1. | Not used in Phase 1. | Not received. | Not stored by Phase 1. |
| Attestation signature | Held in private state for proving. | Created by the simulator service; its secret stays service-side. | Not exposed. | Not published as raw signature material. |
| Policy | Sees the product policy label and Phase 1 limit `80`. | No policy input is required to issue the fixture. | Product displays `AUTO-SAFE-01`; real public-state wiring is pending. | Phase 1 `speedLimit = 80` is public contract state. |
| Compliance result | Real harness observes the indexed result; product result remains mock. | Not received. | Real connected verifier is pending; current surface is mock. | `complianceCount` was observed moving from `0` to `1`. |
| Transaction metadata | Real harness displays the returned address, transaction, status, and block. | Not received. | Not wired to the real result yet. | Address, transaction metadata, status, and block are public. |

## Architecture

```mermaid
flowchart LR
    T[Raw telemetry (PRIVATE)] --> A[Vehicle Attestor Simulator - prototype trust root]
    A -->|issuer-signed measurement| B[Driver PWA]
    B -->|private speed + signature + attestor ID| C[Encrypted private state]
    C -->|private proving input| D[Local proof server 8.1.0]
    D --> E[Generated Compact contract]
    L[Lace browser extension] -->|wallet authorization| P[Midnight Preprod - PUBLIC CHAIN]
    E -->|real proof transaction| P
    P -->|PUBLIC: complianceCount + transaction metadata| I[Insurer verifier - PUBLIC RESULT]

    classDef private fill:#172126,stroke:#83d6c4,color:#f4f7f6;
    classDef public fill:#1d2619,stroke:#c8f36d,color:#f4f7f6;
    class T,C,D private;
    class P,I public;
```

The browser wallet and local proof server are real infrastructure in the confirmed harness. The primary Driver/Insurer product surfaces remain mock-mode because the final `MidnightDriveProofClient` facade is not yet present.

## Real Preprod checkpoint

The confirmed Phase 1 evidence is recorded in [`docs/PREPROD_EVIDENCE.md`](docs/PREPROD_EVIDENCE.md). It includes a real deployment, a real safe proof for signed speed `67` under limit `80`, and the observed `complianceCount` transition from `0` to `1`.

## Current status

### Done

- Mobile-first Driver PWA and Insurer verifier shell.
- Real Phase 1 Compact contract and generated proving artifacts.
- Vehicle Attestor Simulator that owns the signed `safe = 67` and `unsafe = 112` fixtures.
- Lace browser connection and Preprod network validation.
- Midnight runtime/provider harness with local proof server `8.1.0`.
- Confirmed real deployment and safe proof transaction on Midnight Preprod.
- Expected unsafe policy and tamper signature rejections.

### Pending

- Product-facing `MidnightDriveProofClient` integration and connected Insurer public-state flow.
- Subject binding and deterministic contract nullifiers/replay protection.
- Expanded 16-sample/braking/geofence contract witness, if accepted in the next crypto phase.
- Production physical telemetry trust root.

## Local setup

Requirements: Node.js 22+ and npm.

```powershell
npm install
npm run dev:driver
# in another terminal
npm run dev:insurer
```

Open `http://localhost:5173` for the Driver and `http://localhost:5174` for the Insurer. The product surfaces use `MockDriveProofClient` by default and label that mode clearly; mock transaction IDs are not blockchain transactions.

For the real harness, use [`docs/JUDGE_QUICKSTART.md`](docs/JUDGE_QUICKSTART.md). It requires Lace on Preprod, the local proof server on port `6300`, and the attestor simulator on port `4000`. Lace approval is always manual.

## Judge materials

- [`docs/PREPROD_EVIDENCE.md`](docs/PREPROD_EVIDENCE.md) - exact real transaction and rejection evidence.
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) - honest 110-second recording plan.
- [`docs/DEVPOST_DRAFT.md`](docs/DEVPOST_DRAFT.md) - submission copy.
- [`docs/JUDGE_QUICKSTART.md`](docs/JUDGE_QUICKSTART.md) - shortest inspection and local reproduction path.
- [`docs/INTEGRATION_CONTRACT.md`](docs/INTEGRATION_CONTRACT.md) - remaining contract/client handoff fields.

## Security notes

The attestor service owns its persistent provider secret and keeps it out of browser code, Vite environment variables, logs, and the repository. Lace owns wallet signing. No seed, mnemonic, private witness, or signing secret belongs in the repository or public deployment configuration.

The honest claim is: DriveProof proves that telemetry issued by an authorized attestor satisfies an insurer's policy without revealing the telemetry. It does not independently prove physical sensor provenance.

## Team split

Atharv owns the product apps, shared frontend/domain types, client boundary, Lace/Preprod integration, deployment, documentation, demo UX, and submission materials. Ashiha owns the Compact contract, attestor cryptography, generated artifacts, contract tests, and the next cryptographic phases.

## Testing

```powershell
npm test
npm run typecheck
npm run build
```
