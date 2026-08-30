# DriveProof Final Deployment

DriveProof's final hosted layout runs the product surfaces on Vercel and the
proof server on Azure Container Apps. The Compact contract and transaction
semantics are unchanged between local and hosted deployment modes.

## Primary reliable public URLs

| Surface | URL |
| --- | --- |
| Driver | https://driveproof-driver-atharv.vercel.app/driver |
| Insurer | https://driveproof-insurer-atharv.vercel.app |
| Vehicle Attestor Simulator | https://driveproof-attestor-atharv.vercel.app |

Optional custom aliases are attached to the Vercel projects:

- https://driveproof.atharv.me
- https://verify.driveproof.atharv.me

The *.vercel.app URLs are the primary judge URLs because the custom Driver
hostname has shown resolver-specific failures on some clients. Do not remove
the Vercel fallback domains.

## Hosted architecture

    Driver PWA
      -> Vercel
      -> Vehicle Attestor Simulator (Vercel)
      -> Proof Server 8.1.0 (Azure Container Apps)
      -> Lace browser extension
      -> Midnight Preprod
      -> public compliance receipt
      -> Insurer verifier (Vercel)

The proof server is the pinned image:

    midnightntwrk/proof-server:8.1.0

Current hosted endpoint:

    https://driveproof-proof-server.bluewater-aa5f9cb8.centralindia.azurecontainerapps.io

The hosted Driver uses this Azure endpoint rather than the public Midnight
endpoint that previously returned 403 for proving requests. The Azure service
reports version 8.1.0 and allows the production Driver origin for the actual
proof-provider path.

## Vercel project configuration

The repository root is the build root for all projects.

Driver:

    Project: driveproof-driver-atharv
    Config:  vercel.driver.json
    Build:   npm run build --workspace @driveproof/driver
    Output:  apps/driver/dist

Insurer:

    Project: driveproof-insurer-atharv
    Config:  vercel.insurer.json
    Build:   npm run build --workspace @driveproof/insurer
    Output:  apps/insurer/dist

Attestor:

    Project: driveproof-attestor-atharv
    Config:  vercel.attestor.json
    Build:   npm run build --workspace driveproof-attestor-simulator

The attestor adapter exposes GET /health, GET /provider-info, and POST
/attest while delegating to the existing simulator handler. It does not change
signing, fixtures, commitment construction, or provider-key semantics.

## Production configuration

Vite values are public build-time configuration. They contain no wallet or
signing secrets.

Driver production:

    VITE_DRIVEPROOF_CLIENT_MODE=midnight
    VITE_MIDNIGHT_NETWORK=preprod
    VITE_MIDNIGHT_PROOF_SERVER=https://driveproof-proof-server.bluewater-aa5f9cb8.centralindia.azurecontainerapps.io
    VITE_MIDNIGHT_ATTESTOR_URL=https://driveproof-attestor-atharv.vercel.app
    VITE_INSURER_ORIGIN=https://verify.driveproof.atharv.me
    VITE_ENABLE_WALLET_DEBUG=true

Insurer production:

    VITE_DRIVEPROOF_CLIENT_MODE=midnight
    VITE_DRIVER_URL=https://driveproof.atharv.me

Attestor non-secret configuration:

    PROVIDER_ID=1
    NETWORK_ID=preprod
    ATTTESTOR_ALLOWED_ORIGIN=https://driveproof.atharv.me

The spelling ATTTESTOR_ALLOWED_ORIGIN matches the current simulator contract.
It must contain one exact Driver origin; wildcard CORS is not allowed. The
existing persistent PROVIDER_SECRET_KEY is configured privately in Vercel and
must never appear in source, Vite variables, logs, documentation, or commits.

## Deployment commands

From the repository root, with the Vercel CLI authenticated to the project
team:

    vercel deploy --scope atharv-mantris-projects --project driveproof-driver-atharv --local-config vercel.driver.json --prod --yes

    vercel deploy --scope atharv-mantris-projects --project driveproof-insurer-atharv --local-config vercel.insurer.json --prod --yes

    vercel deploy --scope atharv-mantris-projects --project driveproof-attestor-atharv --local-config vercel.attestor.json --prod --yes

Set production environment variables in the Vercel project settings or through
the Vercel CLI. Never put PROVIDER_SECRET_KEY, a wallet seed, mnemonic, private
witness, or signing secret in a Vite variable.

## Verification checklist

    curl.exe https://driveproof-driver-atharv.vercel.app/driver
    curl.exe https://driveproof-insurer-atharv.vercel.app/
    curl.exe https://driveproof-attestor-atharv.vercel.app/health
    curl.exe https://driveproof-proof-server.bluewater-aa5f9cb8.centralindia.azurecontainerapps.io/version

Expected results:

- Driver, Insurer, and Attestor return HTTP 200;
- Attestor health is healthy and its provider info matches the constructor
  registered public key;
- Azure proof server version is 8.1.0;
- production product surfaces display REAL · MIDNIGHT PREPROD;
- Attestor CORS allows only the configured Driver origin; and
- no production page falls back silently to mock mode.

The real wallet path still requires a manual Lace approval. The hosted
deployment does not auto-connect Lace, generate a proof, or submit a
transaction.

## Local privacy-maximal mode

For device-local proving, run the pinned local proof server:

    docker run --rm -p 6300:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v

Run the attestor with its private persistent .env, then start the Driver and
Insurer with the local mode variables documented in docs/DEMO_RUNBOOK.md. This
mode uses the same Compact contract and policy as the hosted deployment.
