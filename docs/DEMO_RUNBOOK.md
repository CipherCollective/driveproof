# DriveProof Demo Runbook

This is the shortest supported local path for the final demo. It uses the
real DEV transaction harness for Preprod evidence and keeps the product pages
honestly labeled as mock until `MidnightDriveProofClient` is supplied.

## Start order

Use four PowerShell terminals from the repository root.

1. Start the existing attestor simulator. Its persistent, gitignored service
   configuration must already be at `attestation/attestor-simulator/.env`.
   Do not print, copy, replace, or commit that file.

   ```powershell
   Set-Location attestation/attestor-simulator
   npm run dev
   ```

   It should listen on `http://localhost:4000`. The service owns the safe/unsafe
   speed selection; the browser sends only `tripId`.

2. Start the official local proof server:

   ```powershell
   docker run --rm -p 6300:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v
   ```

   In another terminal, confirm the expected version:

   ```powershell
   curl.exe http://localhost:6300/version
   ```

   The response must identify `8.1.0`. Stop it with `Ctrl+C`; `--rm` removes
   the stopped container.

3. Start the Driver:

   ```powershell
   npm run dev:driver
   ```

4. Start the Insurer if its placeholder product shot is needed:

   ```powershell
   npm run dev:insurer
   ```

## Lace and readiness

In Lace, select Midnight **Preprod**, use the local proof-server setting
`http://localhost:6300`, and unlock the wallet. Open:

`http://localhost:5173/wallet-debug/transaction?recording=1`

The page runs real checks. Before the flow, expect:

- Lace extension: `DETECTED`
- Wallet: `CONNECTED`
- Network: `PREPROD`
- Proof server: `LOCAL 8.1.0`
- Attestor: `READY`
- Contract: `NOT DEPLOYED` on a fresh tab
- Safe attestation: `NOT LOADED` until requested

If a previous run deployed in this same tab, the harness can reuse that
address for proving. Otherwise deploy once in this tab; it does not currently
restore a deployed address after reload.

## Recording flow

1. If needed, click `RESET UI ONLY` before starting. This clears only transient
   Driver page state and does not reset Lace, wallet storage, the private-state
   provider, a deployed contract, or chain state.
2. Click `CONNECT LACE` and complete the origin authorization manually.
3. Click `REQUEST SAFE · EXPECT 67`.
4. Click `BUILD PROVIDERS` and wait for `PROVIDERS READY`.
5. If the status says `NOT DEPLOYED`, click `DEPLOY TO PREPROD`. Review the
   constructor shown on screen and approve only the intended Lace request.
6. After `CONFIRMED ON PREPROD`, click `PROVE SAFE 67` and approve the proof
   request manually if Lace asks.
7. Capture the real `MIDNIGHT PREPROD` evidence and observed
   `complianceCount = 1`.
8. Without resetting or reloading the tab, click `TRY UNSAFE · 112`, then
   `TRY TAMPER · 112 → 71`. Both are expected proof rejections and must not be
   presented as successful transactions.

The page never auto-deploys, auto-approves, retries, or falls back to the
product mock client.

## Quick service checks

```powershell
curl.exe http://localhost:4000/health
curl.exe http://localhost:6300/version
```

The harness itself also displays Attestor `/health` and proof-server `/version`
results in its readiness summary. Use `READ WALLET DIAGNOSTICS` only when
needed; it is read-only and does not build or submit a transaction.

## Known failures

- **Lace disconnected:** unlock Lace, confirm it is on Midnight Preprod, then
  click `CONNECT LACE` again. Do not reset the extension.
- **Wrong network:** switch Lace to Preprod and reconnect. The harness will not
  configure or use Preprod from a wrong-network session.
- **Proof server unavailable:** restart the documented Docker command and
  confirm `/version` reports `8.1.0`.
- **Proof server wrong version:** stop the incompatible server and start the
  exact `8.1.0` image; the harness fails closed on a mismatch.
- **Attestor unavailable:** confirm the simulator terminal is running and
  `curl.exe http://localhost:4000/health` returns its healthy response. The
  provider secret remains only in the simulator's ignored `.env`.
- **Lace wallet syncing:** wait for the sync state shown inside Lace. The
  Connector API does not expose an authoritative sync percentage, and the
  demo must not reset Lace or wallet storage.
- **Expected policy/signature assertion:** `Speed exceeds policy limit` and
  `Invalid attestation signature` are intentional negative cases. The harness
  shows `REJECTED AS EXPECTED` and no successful transaction.

Unknown errors remain visible as `ERROR` and should not be edited into a
successful result.
