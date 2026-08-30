# DriveProof Integration Contract

Status: final 16-sample product integration is present on this branch. This
document records the stable boundary between the product and the generated
Midnight contract; it does not replace the Compact source or generated artifacts.

## Trust and secret boundary

- The Vehicle Attestor Simulator is the prototype trust root.
- The attestor service owns PROVIDER_SECRET_KEY.
- PROVIDER_SECRET_KEY persists across restarts so its registered public key
  remains stable.
- The corresponding public key is constructor-registered on Midnight.
- The frontend receives only the attestor identifier, public key metadata where
  needed, and deployment metadata.
- PROVIDER_SECRET_KEY must never appear in browser code, Vite variables, logs,
  README files, or committed files.
- The driver secret and private witness remain client-side/private and never
  enter the public receipt.

## Product boundary

The product-facing interface is defined in shared/types:

    interface DriveProofClient {
      readonly mode: "mock" | "midnight";
      readonly displayName: string;
      issueDemoTrip(fixture: DemoFixture): Promise<TripAttestation>;
      proveCompliance(attestation: TripAttestation, policyId: string): Promise<ProofResult>;
      getProofStatus?(transactionId: string): Promise<ProofResult>;
      getConnectionState?(): DriveProofConnectionState;
      connect?(): Promise<DriveProofConnectionState>;
      detect?(): Promise<boolean>;
      getLatestReceipt?(): PublicProofReceipt | undefined;
    }

policyId remains product metadata at this boundary. The current Midnight
circuit call is proveCompliance() without a caller-controlled policy namespace;
replay is contract-local and derived from the attestation identity.

MidnightDriveProofClient owns all generated-contract mapping, provider
construction, private-state handling, attestor calls, and public receipt
normalization. React components do not import Lace, ConnectedAPI, witnesses,
compiled contracts, ZK providers, or transaction primitives.

## Current contract behavior

The current constructor binds:

- speed limit 80;
- harsh-braking limit 2;
- inclusive geofence X 0..350 and Y 50..100;
- authorized attestor ID 1; and
- the registered attestor public key.

The private trip contains 16 ordered samples. Each sample binds gridX, gridY,
speed, braking, and timeBucket. The signed commitment also binds the attestation
ID, driver binding, and salt.

The current proof checks:

1. authorized attestor;
2. signature and trip-commitment integrity;
3. subject binding;
4. every speed against the limit;
5. total braking events where braking is greater than zero;
6. every sample inside the inclusive allowed operating area;
7. unused attestation nullifier; then
8. nullifier consumption and complianceCount increment.

Failed integrity or policy checks do not consume the nullifier.

## Attestor boundary

The browser requests the simulator with the minimum product input:

    POST /attest
    { "tripId": "<fixture>", "driverBinding": "<client-derived binding>" }

The browser does not choose speed, braking, coordinates, time buckets, salt,
attestation ID, or signature. The simulator owns those values and returns the
signed private trip payload required by the generated client.

The final response contains the private witness material needed for proving:
ordered samples, salt, attestation ID, trip commitment, signature, and the
attestor identifier. It is never sent to the Insurer as a receipt.

## Public receipt boundary

A successful product result maps to PublicProofReceipt:

    type PublicProofReceipt = {
      status: "verified";
      network?: string;
      transactionId: string;
      blockHeight?: number;
      contractAddress?: string;
      complianceStatus?: "satisfied";
      policyId?: string;
      attestorId?: string;
      nullifier?: string;
    };

Only values actually supplied by the real public result are included. The
receipt never includes samples, route, coordinates, speed, braking, time
buckets, salt, signature, driver binding, driver secret, or private state.

The Insurer consumes only ProofResult/PublicProofReceipt. It does not receive a
TripAttestation and does not independently re-prove the witness unless a future
product change explicitly adds that capability.

## Expected result mapping

The current real client classifies only these known assertions:

- Speed exceeds policy limit -> rejected, reason policy.
- Harsh braking exceeds policy limit -> rejected, reason policy.
- Sample outside policy geofence -> rejected, reason policy.
- Invalid attestation signature -> rejected, reason integrity.
- Attestation already used -> rejected, reason replay.

Unknown runtime/prover/wallet failures remain genuine errors. The product never
turns an unknown failure into a verified result or silently falls back to the
mock client.

## Deployment boundary

Hosted production:

    Driver PWA -> Vercel
      -> Vehicle Attestor Simulator -> Vercel
      -> Midnight proof server 8.1.0 -> Azure Container Apps
      -> Lace browser extension
      -> Midnight Preprod
      -> public receipt -> Insurer Vercel app

Privacy-maximal local proving uses the same contract and policy with the local
8.1.0 proof server. Current Preprod wallet authorization uses Lace in a desktop
browser; Lace Mobile is not assumed to sign Midnight transactions.

## Acceptance matrix

| Scenario | Expected result |
| --- | --- |
| Fresh safe 16-sample trip | Proof succeeds; complianceCount increments |
| Same attestation again | Replay rejection: Attestation already used |
| Unsafe speed 112 | Policy rejection: Speed exceeds policy limit |
| Three braking events | Policy rejection: Harsh braking exceeds policy limit |
| Sample outside allowed rectangle | Policy rejection: Sample outside policy geofence |
| Speed or coordinate changed after signing | Integrity rejection: Invalid attestation signature |
| Failed policy/integrity attempts | Nullifier remains unused |
| New valid attestation after failures | Proof can succeed |

Exact Preprod transaction identifiers are maintained in docs/PREPROD_EVIDENCE.md
only when they have been recorded from a confirmed run.
