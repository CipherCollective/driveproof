# DriveProof Final Hosted Deployment

This is the final Vercel deployment layout for the real Midnight Preprod product. The Driver and Insurer are static Vite applications. The Vehicle Attestor Simulator is a small Vercel Node function adapter around the existing simulator HTTP handler. No Midnight proof server is deployed by DriveProof; the Driver uses Midnight's hosted Preprod proof endpoint.

## Production surfaces

| Surface | Vercel project | URL | Config |
| --- | --- | --- | --- |
| Driver | `driveproof-driver-atharv` | https://driveproof-driver-atharv.vercel.app | `vercel.driver.json` |
| Insurer | `driveproof-insurer-atharv` | https://driveproof-insurer-atharv.vercel.app | `vercel.insurer.json` |
| Vehicle Attestor Simulator | `driveproof-attestor-atharv` | https://driveproof-attestor-atharv.vercel.app | `vercel.attestor.json` |

All three projects use the repository root so npm workspaces resolve consistently. The latest production deployments were created from the final UI-polish source and are `READY` in Vercel.

## Public production configuration

Vite values are compiled into the browser bundle at build time. The production Driver is configured with:

```text
VITE_DRIVEPROOF_CLIENT_MODE=midnight
VITE_INSURER_ORIGIN=https://driveproof-insurer-atharv.vercel.app
VITE_MIDNIGHT_NETWORK=preprod
VITE_MIDNIGHT_PROOF_SERVER=https://driveproof-driver-atharv.vercel.app/midnight-proof
VITE_MIDNIGHT_ATTESTOR_URL=https://driveproof-attestor-atharv.vercel.app
VITE_ENABLE_WALLET_DEBUG=true
```

The production Insurer is configured with:

```text
VITE_DRIVEPROOF_CLIENT_MODE=midnight
VITE_DRIVER_URL=https://driveproof-driver-atharv.vercel.app
```

The attestor's non-secret production values are:

```text
PROVIDER_ID=1
NETWORK_ID=preprod
ATTTESTOR_ALLOWED_ORIGIN=https://driveproof-driver-atharv.vercel.app
```

`ATTTESTOR_ALLOWED_ORIGIN` intentionally preserves the existing simulator environment-variable spelling. Its value is a single production Driver origin; wildcard CORS is not enabled.

No wallet seed, mnemonic, private witness, signing key, or `PROVIDER_SECRET_KEY` is present in Vite variables or committed files.

## Deploy commands

Run from the repository root with Vercel CLI authenticated to the `atharv-mantris-projects` team:

```powershell
vercel deploy --scope atharv-mantris-projects --project driveproof-driver-atharv --local-config vercel.driver.json --prod --yes

vercel deploy --scope atharv-mantris-projects --project driveproof-insurer-atharv --local-config vercel.insurer.json --prod --yes

vercel deploy --scope atharv-mantris-projects --project driveproof-attestor-atharv --local-config vercel.attestor.json --prod --yes
```

The Driver and Insurer commands use their Vercel Production variables. The attestor command uses its public values, but the production secret below must be present before its HTTP endpoints can start.

The attestor build is:

```text
npm run build --workspace driveproof-attestor-simulator
```

`vercel.attestor.json` maps `/health`, `/provider-info`, and `/attest` to `api/attestor.ts`, which delegates to the existing request handler. `.vercelignore` excludes local `.env` files from all uploads.

## Manual secret step required

The hosted attestor is intentionally fail-closed until its existing persistent provider secret is added. In Vercel:

1. Open project `driveproof-attestor-atharv` → Settings → Environment Variables.
2. Add `PROVIDER_SECRET_KEY` for **Production** as a sensitive/secret variable.
3. Use the existing persistent attestor secret from the local gitignored attestor environment. Do not rotate it, commit it, log it, or paste it into chat.
4. Redeploy the attestor production project.

Do not put this secret in a `VITE_` variable. The corresponding public key must remain the key already registered by the final Compact contract.

Until this step is completed, the deployed function returns Vercel `FUNCTION_INVOCATION_FAILED` for `/health` and `/provider-info` because startup refuses to run without `PROVIDER_SECRET_KEY`. This is an expected safe failure, not a successful attestor deployment.

## Verification checklist

After the manual secret step and redeploy:

```powershell
Invoke-WebRequest https://driveproof-attestor-atharv.vercel.app/health
Invoke-WebRequest https://driveproof-attestor-atharv.vercel.app/provider-info
```

`/health` should return HTTP 200. `/provider-info` should report provider ID `1` and the same public key authorized by the final contract. Do not print or compare the private key.

The Driver's production pages currently return HTTP 200:

```text
https://driveproof-driver-atharv.vercel.app/
https://driveproof-driver-atharv.vercel.app/driver
https://driveproof-driver-atharv.vercel.app/wallet-debug
https://driveproof-driver-atharv.vercel.app/wallet-debug/transaction
```

The Insurer returns HTTP 200 at:

```text
https://driveproof-insurer-atharv.vercel.app/
```

## Remote proof server

The production Driver uses a same-origin Vercel external rewrite for proof requests:

```text
https://driveproof-driver-atharv.vercel.app/midnight-proof
```

Vercel forwards that path server-side to Midnight's hosted Preprod proof server:

```text
https://proof-server.preprod.midnight.network
```

The rewrite is `no-store` and is configured only in `vercel.driver.json`. Local development remains configured for `http://localhost:6300`.

The hosted upstream responds:

```text
GET /version -> 200
body -> 8.1.0
```

The same-origin proxy also forwards `POST /check` with the provider's binary content type. Connectivity checks return an upstream HTTP response rather than a browser CORS fetch failure. This verifies reachability and version compatibility only; it does not perform a proof or transaction.

## Hosted Lace and real proof steps

No wallet action or transaction was automated during deployment. After the attestor secret is installed:

1. Open https://driveproof-driver-atharv.vercel.app in Chrome or Brave with Lace installed and unlocked.
2. Connect Lace and authorize the exact HTTPS origin if prompted.
3. Confirm the wallet is on Midnight Preprod.
4. Open the Driver proof flow and prepare the attested trip.
5. Create the private proof.
6. Approve the real Midnight transaction in Lace.
7. Confirm the Driver shows the real Preprod receipt.
8. Open https://driveproof-insurer-atharv.vercel.app and load the receipt using the product's existing flow.

The main product remains explicit about real versus mock mode. The deployed Driver is real mode (`REAL · MIDNIGHT PREPROD`); mock mode remains available only when selected through configuration. The attestor remains honestly described as a Vehicle Attestor Simulator.

## Security notes

- `PROVIDER_SECRET_KEY` belongs only to the attestor service and must persist across restarts.
- Browser code receives only public attestor/deployment metadata and never receives the provider secret.
- The hosted attestor allows only the configured Driver origin; it does not use `*`.
- No custom public proxy is used for Midnight proving.
- `http://localhost:6300` is not used in the final production Driver; viewers' localhost is their own machine.
- Deployment does not deploy Compact, create a contract, or submit a transaction.
