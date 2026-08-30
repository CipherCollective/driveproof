# DriveProof Demo Runbook

This is the shortest reliable final-demo path. The hosted product is configured
for the real Midnight Preprod client. The engineering evidence page remains
available for transaction stages and expected rejection cases.

## Primary hosted setup

Use these URLs:

- Driver: https://driveproof-driver-atharv.vercel.app/driver
- Insurer: https://driveproof-insurer-atharv.vercel.app
- Attestor health: https://driveproof-attestor-atharv.vercel.app/health

The custom aliases are optional. Prefer the Vercel URLs during recording because
the custom Driver hostname has shown resolver-specific failures on some clients.

The hosted stack uses:

- Driver, Insurer, and Attestor on Vercel;
- Midnight proof server 8.1.0 on Azure Container Apps;
- Lace in desktop Chrome or Brave; and
- Midnight Preprod.

No product page auto-connects Lace, auto-approves a wallet request, or silently
falls back to mock mode.

## Hosted recording order

1. Open the Driver URL in a desktop browser and size the Driver viewport to a
   phone-like frame for the product shots.
2. Confirm the visible label is REAL · MIDNIGHT PREPROD.
3. Connect Lace and authorize this Driver origin manually.
4. Confirm the wallet is on Midnight Preprod.
5. Prepare the signed 16-sample safe trip.
6. Review the private policy: speed at most 80, harsh braking at most 2, and
   every private sample inside the inclusive allowed operating area.
7. Select Create Private Proof.
8. Approve the real transaction in Lace.
9. Wait for the actual verified receipt and capture its transaction/block/
   contract metadata.
10. Select View Insurer Receipt and show the public-only result.
11. If recording rejection evidence, use the technical evidence page for unsafe
    speed, telemetry tamper, geofence, and same-attestation replay.

The Vehicle Attestor Simulator is the prototype trust root. Do not describe it
as physical vehicle telemetry.

## Engineering evidence page

Open:

    https://driveproof-driver-atharv.vercel.app/wallet-debug/transaction?recording=1

Use this page only for real readiness, provider stages, transaction evidence,
and expected rejection boundaries. It is not a mock success surface.

## Local fallback path

Use this when hosted wallet/prover conditions are not convenient. Start four
terminals from the repository root.

1. Start the attestor with its existing private, persistent configuration:

       Set-Location attestation/attestor-simulator
       npm run dev

   Its ignored file must be attestation/attestor-simulator/.env. Never print,
   copy, rotate, or commit PROVIDER_SECRET_KEY.

2. Start the pinned local proof server:

       docker run --rm -p 6300:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v

   Check it:

       curl.exe http://localhost:6300/version

   The response must report 8.1.0. Stop with Ctrl+C; --rm removes the stopped
   container.

3. Start the Driver from the repository root:

       npm run dev:driver

4. Start the Insurer:

       npm run dev:insurer

For the local real path, set the public app variables to midnight mode, Preprod,
the local proof server, the local attestor URL, and the local Insurer origin.
Use docs/DEPLOYMENT.md for the variable names. Do not place provider secrets,
wallet seeds, mnemonics, or private witnesses in Vite variables.

## Local readiness checklist

On the real harness, expect:

- Lace extension: DETECTED;
- Wallet: CONNECTED;
- Network: PREPROD;
- Proof server: LOCAL 8.1.0;
- Attestor: READY;
- Contract: DEPLOYED only after a real deployment in the current page session;
- Safe attestation: LOADED only after a real request.

The readiness panel uses real checks. A failed check remains failed.

## Safe flow

1. Connect Lace and approve only the intended origin request.
2. Request the safe attestation. The browser sends the trip ID and subject
   binding; the attestor owns the fixture values.
3. Build providers and confirm the real proof server version.
4. Reuse a deployed contract in the same page session when available. If none
   is loaded, deploy once and approve Lace manually.
5. Generate the private proof and approve the proof transaction manually.
6. Capture the verified Preprod result and observed complianceCount.
7. Do not repeat a successful attestation except when intentionally recording
   the replay rejection.

## Expected rejection cases

- Unsafe speed 112: Speed exceeds policy limit.
- Three harsh-braking events: Harsh braking exceeds policy limit.
- Out-of-area sample: Sample outside policy geofence.
- Signed telemetry changed: Invalid attestation signature.
- Same attestation submitted again: Attestation already used.

All of these remain rejected states. They do not create a fabricated receipt.

## Troubleshooting

- Lace disconnected: unlock Lace, confirm Preprod, and reconnect. Do not reset
  the extension.
- Wrong network: switch Lace to Preprod and reconnect. The runtime fails closed.
- Proof server unavailable or wrong version: restart the pinned server and
  verify /version reports 8.1.0.
- Attestor unavailable: check /health and the simulator terminal. Never expose
  the provider secret.
- Lace syncing: use the sync status shown by Lace. The Connector API does not
  expose an authoritative sync percentage.
- Expected assertion: keep the rejection visible as evidence. Unknown runtime
  errors must remain errors.

## Privacy language

Use: Raw telemetry is not written to public ledger state and is not included in
the Insurer receipt.

Do not say telemetry never leaves the device, and do not claim physical GPS
provenance.
