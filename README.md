# DriveProof

> Prove you drove safely without revealing where you drove.

DriveProof is a privacy-preserving vehicle telemetry proof experience for the Midnight Hackathon mobile track. The driver keeps the route and raw telemetry private while an insurer receives a policy result and a replay-safe proof reference.

## Problem

An insurer may need confidence that a trip met a safety policy, but a driver should not have to disclose their route, origin, destination, GPS history, or exact speed history to get that confidence.

## Solution

DriveProof is a mobile-first PWA / responsive Driver experience paired with an Insurer verifier. The product boundary is designed around a private telemetry witness, an attestation from an authorized issuer, and a policy-compliance proof.

> Zero knowledge protects privacy. Attestation protects integrity.

## Why Midnight

Midnight is the intended proving and verification layer because the policy can be evaluated over private witness data while the verifier learns only the result. The real integration is intentionally deferred until the generated contract/client artifacts and Preprod deployment information arrive from the cryptographic workstream.

## Privacy model

The Driver view shows the complete local demo telemetry: 16 deterministic samples, private grid positions, speed history, braking history, and attestation material. The Insurer view exposes none of those values. It shows only the policy, authorized-attestation status, replay protection, and proof result.

The honest trust boundary is important: DriveProof proves that private telemetry corresponds to an accepted attestation and satisfies the policy constraints. It does not independently prove physical GPS or sensor provenance. A production attestor could be an OEM telematics control unit, trusted OBD device, or hardware-backed phone/vehicle telemetry service.

## Attestation trust model

The hackathon prototype uses deterministic fixtures and `MockDriveProofClient` for product development. This mock has no cryptography, wallet access, or blockchain calls. It simulates safe, unsafe, tampered, and replay states so the UX can be recorded quickly. The eventual registered attestor, subject binding, signature verification, nullifier, and Compact contract are owned by the cryptographic workstream.

## Driver vs Insurer information boundary

The Driver knows everything needed to understand their own trip. The Insurer learns only whether an authorized attestation can produce a valid proof for `AUTO-SAFE-01`, plus a proof/transaction reference when verified. Unsafe and tampered verifier states intentionally use a generic rejection message and do not disclose the violating telemetry value.

## Architecture

```text
Driver PWA / Insurer verifier
          ↓
    DriveProofClient
          ↓
  MockDriveProofClient (now)
          ↓
  MidnightDriveProofClient (after artifacts arrive)
          ↓
  Generated Compact contract client → Midnight Preprod → Lace browser extension
```

The frontend boundary lives in `shared/types` and `shared/driveproof-client`. React components receive a `DriveProofClient`; blockchain behavior is not embedded in UI components.

## Current development status

- Driver and Insurer apps are implemented with React, Vite, and TypeScript.
- Safe, unsafe, tampered, and replay UX paths are implemented through an explicitly labeled mock.
- Deterministic fixtures and frontend tests are included.
- PWA metadata and a lightweight production service worker are included for the Driver app.
- Real Midnight proof generation, wallet signing, generated artifacts, contract deployment, and Preprod verification are unfinished by design.

## Local setup

Requirements: Node.js 20+ and npm 10+.

```bash
npm install
npm run dev:driver
# in another terminal
npm run dev:insurer
```

Open `http://localhost:5173` for the Driver PWA and `http://localhost:5174` for the Insurer verifier. The small bottom-right demo control switches fixtures without dominating the product surface. `VITE_DRIVEPROOF_CLIENT_MODE` defaults to `mock`; setting it to `midnight` intentionally fails until the real client is wired.

## Team split

Atharv owns the product apps, shared frontend/domain types, client abstraction, integration boundary, Preprod/Lace integration on the frontend side once artifacts exist, deployment, documentation, demo UX, and submission.

Ashiha owns `contract/**`, `attestor/**`, the Compact contract, the adapted Midnight ZK Loan attestation architecture, Schnorr-on-Jubjub verification, registered attestors, subject binding, deterministic nullifiers/replay protection, contract tests, and generated Midnight contract/client artifacts. Those paths are not modified by this workstream.

## Security assumptions

The attestor service owns a persistent `PROVIDER_SECRET_KEY`. It must persist across restarts. Its corresponding public key is the key registered on Midnight. The frontend receives only the attestor ID, public key, and deployment metadata needed for integration. `PROVIDER_SECRET_KEY` must never appear in browser code, Vite environment variables, logs, README files, or committed files.

See [`docs/INTEGRATION_CONTRACT.md`](docs/INTEGRATION_CONTRACT.md) for the exact artifact and API handoff checklist. Unknown cryptographic details remain TODOs rather than invented frontend assumptions.

## Preprod + Lace integration plan

The first genuine end-to-end path is:

```text
Driver PWA
  ↓
DriveProofClient
  ↓
Midnight generated contract client
  ↓
Midnight Preprod
  ↓
Lace desktop/browser extension for signing
```

Lace Mobile on Android currently does not support Midnight, and Lace cannot sign against the local undeployed Midnight network. The product remains mobile-first, but the hackathon wallet-connected proof submission will use a desktop browser with Lace against Preprod.

## Tests

```bash
npm test
npm run typecheck
npm run build
```

Mock flows are not real Midnight proofs and no mock transaction is a chain transaction.
