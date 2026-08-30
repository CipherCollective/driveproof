# DriveProof

## Prove you drove safely without revealing where you drove.

Built for the Midnight Hackathon - August 2026
Track: Mobile Track

## What we built

DriveProof is a mobile-first PWA for privacy-preserving driving compliance.
A Vehicle Attestor Simulator signs a 16-sample trip commitment. The Driver
privately proves that the signed samples satisfy an insurer's policy, and the
Insurer receives a public compliance result rather than the route or telemetry.

The final stack is real:

    Driver PWA -> Lace -> Midnight Preprod -> public receipt -> Insurer

The hosted demo runs the Driver, Insurer, and attestor on Vercel and the pinned
8.1.0 proof server on Azure Container Apps.

## The problem

Usage-based insurance often asks drivers to surrender route and location
history, speed history, braking history, and trip telemetry. That is far more
information than an insurer needs to answer a narrow question:

    Did this signed trip satisfy the safety policy?

Retaining the full journey creates privacy and data-retention risk.

## The solution

1. An authorized Vehicle Attestor Simulator issues a signed 16-sample trip.
2. The Driver keeps the telemetry and subject secret in the private proving
   boundary.
3. Compact checks the authorized signature, subject binding, trip commitment,
   speed, braking, allowed operating area, and replay state.
4. Lace authorizes the real Midnight Preprod transaction.
5. The Insurer sees only the public compliance receipt and safe transaction
   metadata.

## Core thesis

> Zero knowledge protects privacy.
> Attestation protects integrity.

Zero knowledge proves predicates over private witness data without publishing the
witness. The attestor signature prevents a user from changing a committed value
and still presenting it as the authorized measurement.

## Final policy

- 16 private telemetry samples.
- Maximum speed: 80 km/h for every sample.
- Harsh braking: at most 2 events, where braking greater than zero counts as
  one event.
- Allowed operating area: every sample inside the inclusive private grid
  rectangle X 0..350 and Y 50..100.
- Authorized attestor: Provider 1.
- Subject binding: derived from a private client-side driver secret.
- Replay protection: contract-local attestation nullifier.

This is an allowed operating area policy, not a prohibited-zone avoidance claim.

## Why Midnight

A hash can commit to data, but it cannot make an insurer verify a policy
predicate over hidden values without revealing the preimage or moving the raw
data to a trusted backend. Hashing also does not by itself prove that an
authorized issuer signed the committed measurement or enforce a contract-local
replay rule.

Midnight combines private witnesses, zero-knowledge policy predicates,
registered-attestor verification, minimal disclosure, and contract state for
replay protection.

## Trust boundary

The hackathon prototype simulates the authorized vehicle telemetry issuer.
DriveProof proves integrity and policy compliance after that trust boundary; it
does not independently prove physical sensor provenance.

Production replacements could include an OEM telematics control unit, a secure
vehicle computer, trusted OBD hardware, or a hardware-backed telemetry provider.

## Privacy model

Private witness data includes:

- 16 samples;
- private grid positions;
- speed, braking, and time buckets;
- salt and signature witness; and
- the client-side driver secret.

The public receipt contains the compliance result and protocol-approved
metadata such as policy, attestor, transaction, block, contract, and network
where available. It does not contain route, coordinates, speed history,
braking history, raw telemetry, salt, subject secrets, or signature material.

The hosted demo uses a remotely hosted proof server for accessibility. The
privacy-maximal configuration uses a local 8.1.0 proof server. We therefore do
not claim that private witness bytes literally never leave a hosted browser.
The precise claim is that raw telemetry is not written to public ledger state
and is not included in the Insurer receipt.

## Real evidence

The final stack has been accepted with:

- real constructor-bound Preprod deployment;
- real safe 16-sample proof;
- real Lace approval and Preprod submission;
- replay rejection: Attestation already used;
- unsafe speed rejection: Speed exceeds policy limit;
- geofence rejection: Sample outside policy geofence;
- telemetry tamper rejection: Invalid attestation signature; and
- contract acceptance for excessive braking, coordinate tampering, and failed
  attempts not consuming the replay nullifier.

Exact transaction identifiers already recorded in the repository are preserved
in docs/PREPROD_EVIDENCE.md. No new transaction IDs are fabricated here.

## Mobile Track relevance

The Driver is a mobile-first PWA designed for phone-sized screens. The
experience makes the private/public boundary understandable on mobile, while
the current Preprod wallet authorization uses the Lace desktop/browser
extension because Lace Mobile does not currently support Midnight signing.
Local proof-server configuration provides the strongest device-local proving
path.

## Hosted architecture

    Driver PWA - Vercel
      -> Vehicle Attestor Simulator - Vercel
      -> Proof Server 8.1.0 - Azure Container Apps
      -> Lace browser extension
      -> Midnight Preprod
      -> public receipt
      -> Insurer - Vercel

## Product value

DriveProof could support usage-based auto insurance, fleet compliance,
safe-driver discounts, commercial-driver certification, and
privacy-preserving telematics programs. The opportunity is to verify risk
predicates without retaining complete route and behavior histories. This
prototype does not claim production hardware provenance, regulatory readiness,
or commercial pricing.

## Links

- Driver: https://driveproof-driver-atharv.vercel.app/driver
- Insurer: https://driveproof-insurer-atharv.vercel.app
- Evidence: docs/PREPROD_EVIDENCE.md
- Deployment: docs/DEPLOYMENT.md
- Judge quickstart: docs/JUDGE_QUICKSTART.md
- Demo script: docs/DEMO_SCRIPT.md
