# Lace Preprod Connectivity Spike

Status: Mission 1.5 wallet-only spike. This document records the current official Midnight browser-wallet path and the boundary implemented in `shared/midnight-wallet`.

This spike stops at:

```text
Driver dev page
  -> Midnight connector discovered in the browser
  -> Lace connects to the requested network
  -> connection status and configuration confirm Preprod
  -> ConnectedAPI/session is available for a future client
```

It does not deploy or call a DriveProof contract, generate a DriveProof proof, submit a transaction, or create generated contract bindings.

## Findings from current official sources

### 1. Lace browser connection and discovery

The browser extension injects connector APIs into `window.midnight`. The current connector API specification models the global as a map of wallet IDs to `InitialAPI` objects. An `InitialAPI` exposes `name`, `icon`, `apiVersion`, and `connect(networkId)`. The dApp should inspect the available APIs, check the API version, and then request the desired network.

The official wallet dApp polls for injected APIs because extension injection can happen after the page has loaded. Its detection hook validates the shape of each candidate. The official ZK Loan UI prefers `window.midnight.mnLace` and otherwise uses an available connector. DriveProof follows the same discovery model, prefers a connector whose ID/name/RDNS identifies Lace, and does not silently substitute its product mock client.

Sources:

- [`midnight-wallet-dapp/src/hooks/useWalletDetection.ts`](https://github.com/midnightntwrk/midnight-wallet-dapp/blob/main/src/hooks/useWalletDetection.ts)
- [`example-zkloan/zkloan-credit-scorer-ui/src/contexts/ZKLoanContext.tsx`](https://github.com/midnightntwrk/example-zkloan/blob/main/zkloan-credit-scorer-ui/src/contexts/ZKLoanContext.tsx)
- [`dapp-connector-api/src/globals.ts`](https://github.com/midnightntwrk/midnight-dapp-connector-api/blob/main/src/globals.ts)
- [`dapp-connector-api InitialAPI`](https://github.com/midnightntwrk/midnight-dapp-connector-api/blob/main/docs/api/type-aliases/InitialAPI.md)

The bridge uses `@midnight-ntwrk/dapp-connector-api@4.0.1` for the official connector types. The actual Lace detection/connection remains an extension interaction through the injected browser API; the npm package does not install or emulate Lace.

### 2. Preprod selection and validation

The official ZK Loan UI calls:

```ts
await initialAPI.connect("preprod");
```

After connection, the official API exposes both `getConnectionStatus()` and `getConfiguration()`. DriveProof validates that both returned network IDs equal the requested `VITE_MIDNIGHT_NETWORK` value. A mismatch is surfaced as `wrong-network`; an unavailable extension, rejected authorization, or other connector failure remains a distinct unavailable/error state.

Sources:

- [`example-zkloan UI wallet connection`](https://github.com/midnightntwrk/example-zkloan/blob/main/zkloan-credit-scorer-ui/src/contexts/ZKLoanContext.tsx)
- [`dapp-connector-api ConnectedAPI`](https://github.com/midnightntwrk/midnight-dapp-connector-api/blob/main/docs/api/type-aliases/ConnectedAPI.md)
- [`dapp-connector-api Configuration`](https://github.com/midnightntwrk/midnight-dapp-connector-api/blob/main/docs/api/type-aliases/Configuration.md)
- [`dapp-connector-api ConnectionStatus`](https://github.com/midnightntwrk/midnight-dapp-connector-api/blob/main/docs/api/type-aliases/ConnectionStatus.md)

For this spike, the target is exactly `preprod`. The bridge does not infer a network from a configured proof-server URL or from UI text.

### 3. Provider objects required later

The current Midnight.js provider architecture expects a `MidnightProviders` bundle containing:

- `privateStateProvider`
- `publicDataProvider`
- `zkConfigProvider`
- `proofProvider`
- `walletProvider`
- `midnightProvider`

The official wallet dApp builds service/configuration providers from the connected wallet configuration, then adapts the wallet API to the Midnight.js `WalletProvider` and `MidnightProvider` interfaces. The official ZK Loan UI similarly constructs an indexer public-data provider, a proof provider, and wallet/transaction adapters after connection.

This spike intentionally does not instantiate those contract-facing objects. A generated Compact contract and its compiled ZK configuration assets are required to create `zkConfigProvider` and to build contract calls. The bridge exposes the real `ConnectedAPI`, validated `Configuration`, and connected status in `MidnightWalletSession` so the future `MidnightDriveProofClient` can create the exact providers after Ashiha supplies the generated artifacts.

Sources:

- [`midnight-js README provider architecture`](https://github.com/midnightntwrk/midnight-js/blob/main/README.md)
- [`midnight-wallet-dapp/src/lib/providers.ts`](https://github.com/midnightntwrk/midnight-wallet-dapp/blob/main/src/lib/providers.ts)
- [`midnight-wallet-dapp/src/lib/walletAdapter.ts`](https://github.com/midnightntwrk/midnight-wallet-dapp/blob/main/src/lib/walletAdapter.ts)
- [`example-zkloan UI package`](https://github.com/midnightntwrk/example-zkloan/blob/main/zkloan-credit-scorer-ui/package.json)

The current connector proof-provider package documents a later path based on `getProvingProvider(keyMaterialProvider)`:

- [`@midnight-ntwrk/midnight-js-dapp-connector-proof-provider`](https://www.npmjs.com/package/@midnight-ntwrk/midnight-js-dapp-connector-proof-provider)
- [`dapp-connector-api ProvingProvider`](https://github.com/midnightntwrk/midnight-dapp-connector-api/blob/main/docs/api/type-aliases/ProvingProvider.md)

Whether DriveProof uses that connector proving provider or the HTTP proof provider is a later generated-client integration decision. TODO: confirm against the generated contract artifacts and the exact compatible Midnight.js release before adding these dependencies.

### 4. Proof-server configuration

The app-owned public configuration names are:

```dotenv
VITE_MIDNIGHT_NETWORK=preprod
VITE_MIDNIGHT_PROOF_SERVER=http://localhost:6300
```

`VITE_MIDNIGHT_PROOF_SERVER` is the local development expectation shown by the instrumentation page. It is not a secret and it does not override the wallet-advertised service configuration. The connector `Configuration` may expose `proverServerUri`; the later provider setup must follow the selected official stack and validate any endpoint choice.

The official current network matrix lists the public Preprod proof endpoint as `https://lace-proof-pub.preprod.midnight.network`. The current ZK Loan example still uses a local proof server for its documented browser UI workflow. Do not treat either endpoint as a DriveProof deployment decision yet.

Sources:

- [`midnight-sdk COMPATIBILITY.md`](https://github.com/midnightntwrk/midnight-sdk/blob/main/COMPATIBILITY.md)
- [`dapp-connector-api Configuration`](https://github.com/midnightntwrk/midnight-dapp-connector-api/blob/main/docs/api/type-aliases/Configuration.md)
- [`example-zkloan README`](https://github.com/midnightntwrk/example-zkloan/blob/main/README.md)
- [`example-zkloan CLI config`](https://github.com/midnightntwrk/example-zkloan/blob/main/zkloan-credit-scorer-cli/src/config.ts)

### 5. Wallet sync behavior

The current DApp Connector API exposes connected/disconnected status, but no trustworthy wallet-sync progress field. The official ZK Loan README tells the developer to wait for Lace's own wallet-syncing banner before attempting transactions. The debug page therefore reports `NOT EXPOSED BY CONNECTOR API` and does not invent a percentage, block height, or readiness signal.

Sources:

- [`dapp-connector-api ConnectionStatus`](https://github.com/midnightntwrk/midnight-dapp-connector-api/blob/main/docs/api/type-aliases/ConnectionStatus.md)
- [`example-zkloan Preprod setup`](https://github.com/midnightntwrk/example-zkloan/blob/main/README.md)

### 6. Compatible package versions

The current ZK Loan UI pins the connector API to `4.0.1` and its Midnight.js packages to `4.1.1`. The current official `midnight-wallet-dapp/package.json` also uses connector API `4.0.1` and Midnight.js `4.1.1` for its provider examples. The official compatibility matrix currently lists stable `@midnight-ntwrk/dapp-connector-api` `4.0.1` and stable Midnight.js `4.0.4`.

This workspace adds only `@midnight-ntwrk/dapp-connector-api@4.0.1` to the wallet spike. It does not upgrade or add the whole Midnight.js stack. TODO: align all contract-facing packages to the exact release required by Ashiha's generated artifacts.

Sources:

- [`example-zkloan UI package.json`](https://github.com/midnightntwrk/example-zkloan/blob/main/zkloan-credit-scorer-ui/package.json)
- [`midnight-wallet-dapp package.json`](https://github.com/midnightntwrk/midnight-wallet-dapp/blob/main/package.json)
- [`midnight-sdk COMPATIBILITY.md`](https://github.com/midnightntwrk/midnight-sdk/blob/main/COMPATIBILITY.md)

## What was added

`shared/midnight-wallet` provides `LaceMidnightWalletBridge` and `MidnightWalletSession`. It performs real injected connector discovery and real `InitialAPI.connect(networkId)` calls when run in a browser with Lace installed. It has no mock implementation or fallback.

The Driver dev server exposes the isolated page at:

```text
http://localhost:5173/wallet-debug
```

The page is only rendered when Vite is in development mode. The normal Driver route and the Insurer app are unchanged.

## Future client handoff

The future `MidnightDriveProofClient` should accept the session returned by the bridge and construct the contract-facing layer around it. The generated client integration still needs these exact artifacts/information from Ashiha:

- generated Compact contract API/client and compiled ZK configuration assets;
- deployed Preprod contract address or equivalent deployment metadata;
- exact policy ID representation;
- exact attestor ID representation;
- attestation serialization and private witness shape;
- exact generated circuit/action names and invocation arguments;
- chosen compatible Midnight.js package versions;
- whether the generated client uses the connector proving provider or HTTP proof provider;
- exact `WalletProvider.balanceTx` and `MidnightProvider.submitTx` expectations;
- returned transaction/result structure and status query behavior.

The expected provider wiring, once those details exist, is conceptually:

```text
MidnightWalletSession.wallet + configuration
  -> publicDataProvider (wallet configuration indexer)
  -> proofProvider (connector proving provider or confirmed HTTP provider)
  -> zkConfigProvider (generated contract assets)
  -> walletProvider (Lace balance/signing adapter)
  -> midnightProvider (Lace transaction submission adapter)
  -> privateStateProvider (contract-specific, securely designed)
```

TODO: do not implement this wiring until the generated contract API, compiled artifacts, deployment metadata, and package matrix are available. No contract address, policy ID, attestor ID, transaction ID, or proof result is stored in this repository by this spike.

## Local proof server

The current ZK Loan README documents this exact local command and target version:

```powershell
docker run --rm -p 6300:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v
```

- Expected port: `6300`, reachable at `http://localhost:6300`.
- Startup indication: verbose server output; the official wallet-dapp Compose reference health-checks `http://localhost:6300/version`.
- Manual health check: `Invoke-WebRequest http://localhost:6300/version` or `curl.exe http://localhost:6300/version`.
- Stop: press `Ctrl+C` in the foreground terminal. Because `--rm` is used, the stopped container is removed automatically. If it was started in another terminal, identify it with `docker ps` and stop that container with `docker stop <container-id>`.

There is a current-source discrepancy to preserve rather than guess around: the ZK Loan README explicitly targets `midnightntwrk/proof-server:8.1.0`, while the current Midnight SDK compatibility matrix lists `proof-server` `8.0.3` for Preprod and its Docker image table. For this Mission 1.5 spike, do not change dependencies or silently substitute a version: use `8.1.0` when following the ZK Loan reference command, and confirm the final proof-server version with the generated contract/client stack before integration.

Sources:

- [`example-zkloan README proof-server command`](https://github.com/midnightntwrk/example-zkloan/blob/main/README.md)
- [`midnight-wallet-dapp compose.yml`](https://github.com/midnightntwrk/midnight-wallet-dapp/blob/main/compose.yml)
- [`midnight-sdk compatibility matrix`](https://github.com/midnightntwrk/midnight-sdk/blob/main/COMPATIBILITY.md)

## Security boundary

This browser spike does not handle wallet seeds, mnemonics, provider secrets, private witnesses, or attestor secrets. In particular, the attestor service owns the persistent `PROVIDER_SECRET_KEY`; it must remain outside browser code, Vite env vars, logs, README files, and committed files.

The browser page proves only that a real Lace connector is discoverable, can be asked to connect to Preprod, and reports a matching connected network/configuration. It does not prove physical telemetry provenance or any DriveProof policy result.
