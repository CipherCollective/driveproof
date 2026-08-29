# Judge Quickstart

DriveProof has two deliberately separate surfaces:

1. the polished Driver/Insurer product shell, which is mock-mode and labeled;
2. the real Phase 1 Midnight Preprod harness, which requires local services and manual Lace approval.

The recorded real results are in [`PREPROD_EVIDENCE.md`](PREPROD_EVIDENCE.md). A judge does not need to reproduce a transaction to inspect that evidence.

## A. Hosted product surfaces

- Landing / Driver: <https://driveproof-driver-atharv.vercel.app/> / <https://driveproof-driver-atharv.vercel.app/driver>
- Insurer: <https://driveproof-insurer-atharv.vercel.app>

The Driver demo controls switch between `safe`, `unsafe`, and `tampered`. The Insurer can also be opened directly with `?fixture=unsafe` or `?fixture=tampered`.

These hosted product surfaces use `MockDriveProofClient` and visibly disclose that mode. They do not claim to submit a DriveProof contract transaction.

The hosted engineering wallet page, if enabled for the deployment, is:

<https://driveproof-driver-atharv.vercel.app/wallet-debug>

It can test browser-origin Lace diagnostics, but the local proof server is not a hosted service. HTTPS-to-`http://localhost:6300` access is blocked by browser security in the recorded hosted test. See [`DEPLOYMENT.md`](DEPLOYMENT.md).

## B. Real local Preprod harness

### Requirements

- Chrome or Brave with the Lace browser extension installed and unlocked.
- Lace configured for Midnight **Preprod** and funded for the intended manual transaction.
- Docker Desktop.
- Node.js 22+ and npm.
- The existing attestor service `.env` at `attestation/attestor-simulator/.env`, containing its persistent service configuration. Do not print, copy, commit, or replace its provider secret.

### Start services

From the repository root:

```powershell
docker run --rm -p 6300:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v
```

Check the proof server in another terminal:

```powershell
curl.exe http://localhost:6300/version
```

It should report version `8.1.0`.

Start the attestor in a second terminal:

```powershell
Set-Location attestation/attestor-simulator
npm run dev
```

The service should listen on `http://localhost:4000`. Its `/attest` endpoint owns the safe/unsafe speed selection; the browser supplies only the trip ID.

Start the Driver in a third terminal from the repository root:

```powershell
npm run dev:driver
```

### Run the real harness

Open:

<http://localhost:5173/wallet-debug/transaction>

Use this order:

1. `CONNECT LACE` and authorize the exact localhost origin.
2. `REQUEST SAFE · EXPECT 67`.
3. `BUILD PROVIDERS` and confirm the Preprod/proof-server gates.
4. `DEPLOY TO PREPROD`, then review and manually approve the Lace transaction. The page displays the expected constructor values: speed limit `80`, attestor ID `1`, and the registered handoff public key.
5. After deployment confirmation, select `PROVE SAFE 67` and manually approve the proof transaction if Lace asks.
6. Confirm the returned transaction status and indexed `complianceCount = 1`.
7. Only after safe success, run the unsafe and tamper failure boundaries.

The page never falls back to the product mock client, never auto-submits, and never displays private signatures, seeds, mnemonics, or provider secrets. Lace approval is always a human action.

## What to expect

- Safe: signed speed `67` under the `80 km/h` limit; real Preprod success.
- Unsafe: signed speed `112`; proof rejects with `Speed exceeds policy limit`.
- Tamper: signed `112` changed privately to `71`; proof rejects with `Invalid attestation signature`.
- Rejected attempts do not become fabricated successful transactions.

## Reproduction versus evidence

The known-good deployment and safe proof are already recorded with their exact contract address, transaction IDs, statuses, blocks, and observed ledger result in [`PREPROD_EVIDENCE.md`](PREPROD_EVIDENCE.md). Reproducing the flow locally creates a new real transaction and requires Lace approval, wallet funds, a running proof server, and the persistent local attestor. Do not treat a screenshot of the mock product shell as proof of a chain transaction.

## Stop services

- Proof server: press `Ctrl+C` in its terminal; `--rm` removes the stopped container.
- Attestor and Driver: press `Ctrl+C` in their terminals.
