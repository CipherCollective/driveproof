# DriveProof Hosted Deployment

Mission 1.7 deployment spike. Driver and Insurer are separate static Vite deployments on Vercel. This document covers the hosted shell and the isolated Lace/proof-server diagnostic path; it does not enable DriveProof contract calls.

## Vercel project layout

Both Vercel projects use the repository root as the project root so npm workspaces can link `shared/*` packages:

| Surface | Project config | Build command | Output |
| --- | --- | --- | --- |
| Driver | `vercel.driver.json` | `npm run build --workspace @driveproof/driver` | `apps/driver/dist` |
| Insurer | `vercel.insurer.json` | `npm run build --workspace @driveproof/insurer` | `apps/insurer/dist` |

Deploy from the repository root:

```powershell
vercel --scope atharv-mantris-projects --project driveproof-driver-atharv --local-config vercel.driver.json --prod --yes `
  --build-env VITE_DRIVEPROOF_CLIENT_MODE=mock `
  --build-env VITE_INSURER_URL=https://driveproof-insurer-atharv.vercel.app `
  --build-env VITE_MIDNIGHT_NETWORK=preprod `
  --build-env VITE_MIDNIGHT_PROOF_SERVER=http://localhost:6300 `
  --build-env VITE_ENABLE_WALLET_DEBUG=true

vercel --scope atharv-mantris-projects --project driveproof-insurer-atharv --local-config vercel.insurer.json --prod --yes `
  --build-env VITE_DRIVEPROOF_CLIENT_MODE=mock `
  --build-env VITE_DRIVER_URL=https://driveproof-driver-atharv.vercel.app
```

Vite variables are compiled into the static bundle at build time. If either production URL changes, update the other app's URL and redeploy that app.

Equivalent dashboard settings are safe public values only:

Driver:

```text
VITE_DRIVEPROOF_CLIENT_MODE=mock
VITE_INSURER_URL=<Insurer production URL>
VITE_MIDNIGHT_NETWORK=preprod
VITE_MIDNIGHT_PROOF_SERVER=http://localhost:6300
VITE_ENABLE_WALLET_DEBUG=true   # only on the explicit hosted acceptance deployment
```

Insurer:

```text
VITE_DRIVEPROOF_CLIENT_MODE=mock
VITE_DRIVER_URL=<Driver production URL>
```

No wallet seed, mnemonic, private witness, signing secret, or `PROVIDER_SECRET_KEY` belongs in Vercel environment variables. `VITE_ENABLE_WALLET_DEBUG` only exposes the existing engineering page at `/wallet-debug`; it does not change product proof behavior.

## Public URLs

- Driver: https://driveproof-driver-atharv.vercel.app
- Insurer: https://driveproof-insurer-atharv.vercel.app
- Hosted Driver diagnostics: https://driveproof-driver-atharv.vercel.app/wallet-debug

## Hosted Lace acceptance

Use Chrome or Brave on the same computer that has the Lace browser extension installed and unlocked:

1. Set Lace to Midnight Preprod.
2. Open the hosted Driver URL `/wallet-debug` over HTTPS.
3. Confirm the page shows the extension as `DETECTED`.
4. Click `CONNECT LACE` and approve the origin in Lace.
5. Confirm `Wallet: CONNECTED`, `Network: PREPROD`, `WALLET SESSION: READY`, and the Lace-returned `ConnectedAPI` configuration fields.
6. Confirm the page never shows a contract address, policy result, transaction ID, or proof result.
7. Repeat from an origin not authorized in Lace to document the expected authorization prompt/rejection. Do not whitelist or bypass browser security.

The connector authorization is origin-specific. A successful localhost authorization does not prove the hosted origin is authorized; Lace must be approved for the exact HTTPS origin.

## Hosted local proof-server acceptance

With the official local server running on the same computer:

```powershell
docker run --rm -p 6300:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v
```

The hosted `/wallet-debug` page performs the same browser-side request as local development:

```text
GET http://localhost:6300/version
```

Expected success is `REACHABLE` with version `8.1.0`. The hosted browser probe recorded:

- Hosted HTTPS -> `http://localhost:6300/version`: blocked; `TypeError: Failed to fetch`, Chrome network log `net::ERR_FAILED`.
- Hosted HTTPS -> `http://127.0.0.1:6300/version`: blocked with the same result.
- The local server itself returned `200 8.1.0` and an `Access-Control-Allow-Origin` value matching the hosted Driver origin when probed directly. The browser failure is therefore a secure-origin/security-path limitation consistent with HTTP-from-HTTPS mixed-content handling, not a workaround target.
- Exact interactive acceptance should still be repeated in the normal Chrome/Brave profile with Lace installed; headless acceptance does not contain the Lace extension.

Do not add a public proxy, disable browser security, or weaken CORS to make this pass. `localhost` from a hosted page refers to the viewer's own machine, not a Vercel server. A successful result would prove only that the local proof server is reachable from that browser/origin under its security rules.

## Safe limitation/workaround

The hosted static app can connect to Lace because the extension runs in the viewer's browser. A local proof server is inherently per-machine and is not a shared hosted service. Since the hosted secure-origin probe is blocked, the safest hackathon options are:

- run the Driver and proof server on the same developer machine and use the hosted page only for the browser-wallet/origin acceptance test;
- use the official Midnight Preprod proof endpoint returned/approved by the selected current Midnight stack once the generated contract client specifies it;
- keep the final demo on a confirmed supported environment rather than weakening browser security.

Do not implement any workaround until the final generated-client proof-provider requirement is known.

## Current hosted result

- Lace detected: not verified in the automated headless browser; requires the installed Lace profile.
- Lace authorization for hosted origin: not verified; authorize the exact HTTPS origin interactively.
- Preprod validation: not verified interactively; bridge validation is unchanged from localhost.
- ConnectedAPI available: not verified interactively; the hosted page is loading the real bridge.
- `http://localhost:6300/version` from hosted page: blocked with `TypeError: Failed to fetch` / `net::ERR_FAILED`.
- Runtime diagnostic parity with localhost: page loads and diagnostics render; local proof-server access does not work from the hosted secure origin in the automated browser.
