# Midnight Runtime / Provider Handoff

Status: historical Mission 1.6 handoff. This is the reusable provider harness between a real Lace browser session and the product `MidnightDriveProofClient`. The later Phase 1 transaction acceptance is documented in [`PREPROD_EVIDENCE.md`](PREPROD_EVIDENCE.md); this document intentionally describes the provider-only boundary.

## Implemented boundary

```text
Lace injected InitialAPI
  -> InitialAPI.connect("preprod")
  -> ConnectedAPI
  -> getConfiguration() + getConnectionStatus() validation
  -> proof-server /version check (localhost:6300, expected 8.1.0)
  -> createMidnightRuntime(connectedApi, explicit integration inputs)
  -> MidnightProviders bundle
```

The browser bridge remains in [`shared/midnight-wallet/src/index.ts`](../shared/midnight-wallet/src/index.ts). The provider builder and proof-server check are in [`shared/midnight-runtime/src/index.ts`](../shared/midnight-runtime/src/index.ts) and [`shared/midnight-runtime/src/proof-server.ts`](../shared/midnight-runtime/src/proof-server.ts).

## Exact provider bundle

`createMidnightRuntime(connectedApi, options)` returns:

```ts
{
  connectedApi,
  configuration,
  proofServer,
  wallet,
  providers: {
    privateStateProvider,
    publicDataProvider,
    zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider,
  },
}
```

The `providers` object is typed as the official `MidnightProviders` shape from `@midnight-ntwrk/midnight-js-types`.

| Provider | Constructed from | Role and boundary |
| --- | --- | --- |
| `privateStateProvider` | `levelPrivateStateProvider` | Browser-persistent encrypted private state. The account scope defaults to Lace's shielded address, which is public identifier material. The caller must supply a strong `privateStoragePasswordProvider`; this module never creates, logs, persists, or reads that secret from Vite env. |
| `publicDataProvider` | `indexerPublicDataProvider` | Queries public chain data using `indexerUri` and `indexerWsUri` returned by Lace. No endpoint is duplicated in source. |
| `zkConfigProvider` | `FetchZkConfigProvider` | Fetches generated Compact ZKIR/prover/verifier assets from the caller-supplied `zkConfigBaseUrl`. The URL is required because no DriveProof generated artifact exists on this branch. |
| `proofProvider` | `httpClientProofProvider` | Uses the checked local proof server URL (`http://localhost:6300`) and the generated-artifact `zkConfigProvider`. It is a genuine Midnight.js HTTP proof adapter; the harness does not call it. |
| `walletProvider` | local adapter around Lace `ConnectedAPI` | Returns shielded public keys and maps `balanceTx` to Lace `balanceUnsealedTransaction`. It does not contain seed material. |
| `midnightProvider` | local adapter around Lace `ConnectedAPI` | Maps `submitTx` to Lace `submitTransaction` and returns the finalized transaction identifier. This method is never invoked by the spike. |

Midnight.js does not require a separate node provider in `MidnightProviders`. The Lace-returned `substrateNodeUri` is retained in `runtime.configuration` for the eventual generated client or other official network tooling. The returned `proverServerUri`, when present, is retained as `walletProofServerUrl`; this harness intentionally uses the public local proof-server setting for its HTTP provider.

## Fail-closed gates

Before any provider object is constructed, the runtime builder:

1. requires `getConnectionStatus().status === "connected"`;
2. requires both `getConnectionStatus().networkId` and `getConfiguration().networkId` to equal the requested network, defaulting to `preprod`;
3. requests `GET http://localhost:6300/version` (or the explicit public proof-server config);
4. requires a readable proof-server version equal to `8.1.0`.

Wrong network, disconnected Lace, proof-server transport failure, non-2xx `/version`, missing version, and version mismatch all raise a typed `MidnightRuntimeError` or return a typed `ProofServerStatus`. A passing check is only provider-infrastructure readiness. It does not prove contract, transaction, or DriveProof readiness.

The `/wallet-debug` page runs the Lace connection and proof-server check. It is DEV-only by default; a hosted acceptance deployment may explicitly opt in with `VITE_ENABLE_WALLET_DEBUG=true`. It does not claim `CONTRACT READY`. Full `MidnightProviders` construction is shown as gated until the two explicit inputs below exist: generated ZK assets and an app-owned private-state password callback.

## Configuration and endpoints

Public app configuration in `.env.example`:

```dotenv
VITE_MIDNIGHT_NETWORK=preprod
VITE_MIDNIGHT_PROOF_SERVER=http://localhost:6300
```

The indexer and node URLs are not configured independently in DriveProof. Once Lace is connected, `getConfiguration()` is the authoritative source for:

- `indexerUri`;
- `indexerWsUri`;
- `substrateNodeUri`;
- `networkId`;
- optional wallet-advertised `proverServerUri`.

The current official ZK Loan Preprod configuration uses:

```text
indexer: https://indexer.preprod.midnight.network/api/v4/graphql
indexerWS: wss://indexer.preprod.midnight.network/api/v4/graphql/ws
node: wss://rpc.preprod.midnight.network
proofServer: http://127.0.0.1:6300
networkId: preprod
```

Those are reference values, not hard-coded DriveProof deployment metadata. The runtime uses the Lace-returned indexer/node values when available.

## Local proof server

The current official ZK Loan README command, matching the requested harness target, is:

```powershell
docker run --rm -p 6300:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v
```

- Port: `6300` (`http://localhost:6300`).
- Startup/health: verbose logs; official Compose checks `http://localhost:6300/version`.
- Manual check: `Invoke-WebRequest http://localhost:6300/version` or `curl.exe http://localhost:6300/version`.
- Stop: `Ctrl+C` in the foreground terminal. With `--rm`, Docker removes the stopped container.

Current-source discrepancy: the current ZK Loan README and its UI package target proof-server `8.1.0`, while the current [`midnight-sdk/COMPATIBILITY.md`](https://github.com/midnightntwrk/midnight-sdk/blob/main/COMPATIBILITY.md) matrix lists `8.0.3` for deployed networks and its Docker image table. This harness follows the ZK Loan target `8.1.0` and checks it at runtime; the final generated-client package/deployment stack must resolve the discrepancy before transaction work begins.

## Package compatibility

The existing connector boundary remains pinned to `@midnight-ntwrk/dapp-connector-api@4.0.1`, which is the version used by the current official ZK Loan UI and wallet-dapp package. The provider harness uses the current official example package set:

```text
@midnight-ntwrk/midnight-js-types                         4.1.1
@midnight-ntwrk/midnight-js-fetch-zk-config-provider      4.1.1
@midnight-ntwrk/midnight-js-http-client-proof-provider    4.1.1
@midnight-ntwrk/midnight-js-indexer-public-data-provider  4.1.1
@midnight-ntwrk/midnight-js-level-private-state-provider  4.1.1
@midnight-ntwrk/ledger-v8                                 8.1.0
```

These versions were added only in the isolated `shared/midnight-runtime` workspace. No generated contract package or contract-specific artifact was added.

## Still needed from Ashiha

The generated contract integration remains blocked on these exact inputs:

- generated Compact contract API/client package and compiled ZKIR/prover/verifier assets;
- the artifact hosting/base URL and exact circuit-key representation;
- generated circuit IDs and private-state type/private-state ID;
- exact `privateStoragePasswordProvider` ownership and secure UX/storage decision (never Vite env);
- deployed Preprod contract address or equivalent deployment metadata;
- exact policy ID representation and attestor ID representation;
- attestation serialization/private witness shape;
- generated invocation name, arguments, and returned result structure;
- confirmation whether the final generated stack uses the local HTTP proof provider or Lace's `getProvingProvider(keyMaterialProvider)` path;
- final compatible package/version matrix and proof-server version.

This provider-only handoff did not record contract values at the time. Current
contract evidence and public product fields are maintained in
[`PREPROD_EVIDENCE.md`](PREPROD_EVIDENCE.md) and the final integration
boundary; this historical handoff intentionally does not duplicate them.

## Security boundary

The runtime module never contains or accepts a wallet seed, mnemonic, signing key, `PROVIDER_SECRET_KEY`, or private telemetry witness. The Lace extension owns wallet key material and signing. The attestor service owns the persistent `PROVIDER_SECRET_KEY`; it is not frontend configuration. The private-state provider accepts only a callback supplied by the future app integration and keeps that secret out of source, Vite env, logs, and this diagnostic UI.

## Official sources used

- [`midnightntwrk/example-zkloan` README](https://github.com/midnightntwrk/example-zkloan/blob/main/README.md)  Preprod/Lace workflow and proof-server `8.1.0` command.
- [`example-zkloan` UI package manifest](https://github.com/midnightntwrk/example-zkloan/blob/main/zkloan-credit-scorer-ui/package.json)  connector `4.0.1` and Midnight.js `4.1.1` package set.
- [`example-zkloan` `ZKLoanContext.tsx`](https://github.com/midnightntwrk/example-zkloan/blob/main/zkloan-credit-scorer-ui/src/contexts/ZKLoanContext.tsx)  current wallet discovery/connect and provider construction path.
- [`example-zkloan` CLI `config.ts`](https://github.com/midnightntwrk/example-zkloan/blob/main/zkloan-credit-scorer-cli/src/config.ts)  current Preprod service reference values.
- [`midnight-wallet-dapp` `src/hooks/useWalletDetection.ts`](https://github.com/midnightntwrk/midnight-wallet-dapp/blob/main/src/hooks/useWalletDetection.ts)  injected API detection and delayed extension injection handling.
- [`midnight-wallet-dapp` `src/lib/providers.ts`](https://github.com/midnightntwrk/midnight-wallet-dapp/blob/main/src/lib/providers.ts)  official provider bundle construction.
- [`midnight-wallet-dapp` `src/lib/walletAdapter.ts`](https://github.com/midnightntwrk/midnight-wallet-dapp/blob/main/src/lib/walletAdapter.ts)  ConnectedAPI to Midnight.js wallet/midnight provider adapters.
- [`midnight-wallet-dapp` package manifest](https://github.com/midnightntwrk/midnight-wallet-dapp/blob/main/package.json)  official package compatibility reference.
- [`midnight-wallet-dapp` `compose.yml`](https://github.com/midnightntwrk/midnight-wallet-dapp/blob/main/compose.yml)  proof-server `/version` health check and local service ports.
- [`dapp-connector-api` `InitialAPI`](https://github.com/midnightntwrk/midnight-dapp-connector-api/blob/main/docs/api/type-aliases/InitialAPI.md), [`ConnectedAPI`](https://github.com/midnightntwrk/midnight-dapp-connector-api/blob/main/docs/api/type-aliases/ConnectedAPI.md), [`Configuration`](https://github.com/midnightntwrk/midnight-dapp-connector-api/blob/main/docs/api/type-aliases/Configuration.md), [`ConnectionStatus`](https://github.com/midnightntwrk/midnight-dapp-connector-api/blob/main/docs/api/type-aliases/ConnectionStatus.md), and [`ProvingProvider`](https://github.com/midnightntwrk/midnight-dapp-connector-api/blob/main/docs/api/type-aliases/ProvingProvider.md)  current connector surface.
- [`midnight-js` README](https://github.com/midnightntwrk/midnight-js/blob/main/README.md)  `MidnightProviders` architecture.
- [`midnight-sdk` compatibility matrix](https://github.com/midnightntwrk/midnight-sdk/blob/main/COMPATIBILITY.md)  current network/package matrix and proof-server discrepancy.
- [`midnight-js-dapp-connector-proof-provider` package](https://www.npmjs.com/package/@midnight-ntwrk/midnight-js-dapp-connector-proof-provider)  later connector-proving-provider option using Lace `getProvingProvider`.
