# DriveProof Judge Quickstart

DriveProof has a real hosted Preprod product path and an isolated engineering
harness. The reliable public URLs are:

- Driver: https://driveproof-driver-atharv.vercel.app/driver
- Insurer: https://driveproof-insurer-atharv.vercel.app
- Attestor health: https://driveproof-attestor-atharv.vercel.app/health

Optional custom aliases are documented in README.md, but the *.vercel.app URLs
are the recommended judge entry points.

## Fastest product walkthrough

1. Open the Driver URL.
2. Confirm the page shows REAL · MIDNIGHT PREPROD.
3. Connect Lace in a desktop Chrome or Brave browser and authorize the Driver
   origin when Lace prompts.
4. Confirm Lace is on Midnight Preprod.
5. Prepare the signed 16-sample trip.
6. Review the private policy summary:
   - maximum speed 80 km/h;
   - at most 2 harsh braking events; and
   - every private sample inside the inclusive allowed grid rectangle.
7. Select Create Private Proof.
8. Approve the real Midnight Preprod request in Lace.
9. Confirm the real receipt: compliance result, transaction, block, contract, and
   network.
10. Open the Insurer link and observe that it receives the public receipt
    fields only.

The proof server is hosted at the Azure endpoint documented in
docs/DEPLOYMENT.md and reports version 8.1.0. The hosted Driver does not claim
that private witness bytes never leave the browser; the safe claim is that raw
telemetry is not written to public ledger state and is not included in the
Insurer receipt.

## What the judge should notice

- The Driver is designed mobile-first even though final Lace authorization uses
  the desktop/browser extension.
- The Vehicle Attestor Simulator is the prototype trust root.
- The authorized issuer signs a committed trip; the browser cannot replace its
  speed, coordinates, braking flags, salt, or attestation ID.
- Compact checks the private witness against the signed commitment and policy.
- A repeated attestation is rejected by the contract-local replay check.
- The Insurer sees a compliance result and safe public metadata, not route,
  location, speed history, braking history, or raw telemetry.

## Expected negative cases

The engineering harness can show the real boundaries:

- unsafe speed 112 -> Speed exceeds policy limit;
- out-of-geofence sample -> Sample outside policy geofence;
- telemetry changed after signing -> Invalid attestation signature;
- same attestation submitted again -> Attestation already used.

These are expected proof rejections, not successful transactions.

## Engineering evidence page

Open:

    https://driveproof-driver-atharv.vercel.app/wallet-debug/transaction?recording=1

This page is DEV-only instrumentation. It exposes readiness, real provider
stages, transaction metadata, and exact expected assertions without replacing
the product flow or adding mock success.

## Local reproduction

For a local run, use Node.js 22+, the pinned proof server 8.1.0, the attestor
simulator with its existing persistent private provider secret, Driver/Insurer
dev servers, and Lace on Preprod. Follow docs/DEMO_RUNBOOK.md. Do not copy
or disclose the attestor secret, wallet seed, mnemonic, or private witness.

## Technical context

DriveProof does not claim physical sensor provenance. Production could replace
the simulator with an OEM telematics control unit, secure vehicle computer,
trusted OBD device, or hardware-backed telemetry issuer.
