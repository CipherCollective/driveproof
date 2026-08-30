# DriveProof Client Integration Handoff

Status: `MidnightDriveProofClient` now implements the product seam for the current v2 contract. The product default remains `MockDriveProofClient`; real mode is explicit and opt-in.

## Stable client contract

The single product-facing interface lives in `shared/types/src/index.ts`:

```ts
export interface DriveProofClient {
  readonly mode: "mock" | "midnight";
  readonly displayName: string;

  issueDemoTrip(fixture: DemoFixture): Promise<TripAttestation>;

  proveCompliance(
    attestation: TripAttestation,
    policyId: string
  ): Promise<ProofResult>;

  getProofStatus?(transactionId: string): Promise<ProofResult>;

  getConnectionState?(): DriveProofConnectionState;
  connect?(): Promise<DriveProofConnectionState>;
  detect?(): Promise<boolean>;
  getLatestReceipt?(): PublicProofReceipt | undefined;
}
```

This is intentionally the smallest contract the current screens use. It does not expose Lace, `ConnectedAPI`, compiled contracts, witnesses, ZK config, private-state providers, balancing, proving, or submission primitives. A real client may have additional internal methods, but it must satisfy this interface at the product boundary.

The existing `TripAttestation` is a frontend boundary type for the current product shell. Map any generated Compact/private-state shape inside `MidnightDriveProofClient`; do not make React components depend on generated structs.

## Public receipt

Verified results carry a public-only receipt:

```ts
export type PublicProofReceipt = {
  status: "verified";
  network?: string;
  transactionId: string;
  blockHeight?: number;
  contractAddress?: string;
  complianceStatus?: "satisfied";
  policyId?: string;
  attestorId?: string;
  nullifier?: string;
};

export type ProofResult =
  | { status: "verified"; receipt: PublicProofReceipt }
  | {
      status: "rejected";
      reason?: "policy" | "integrity" | "replay" | "unknown";
    };
```

Every receipt field other than `transactionId` is optional because the final generated contract/indexer response is not frozen. Populate a field only when the real public response provides it. Never add telemetry, route/grid samples, speed, braking, signatures, subject secrets, or other private witness data to this receipt.

`MockDriveProofClient` uses visibly mock values. Its receipt must not be described as a chain receipt.

## Driver injection point

Implementation selection happens at the application entrypoint:

- `apps/driver/src/main.tsx` creates the configured client and renders `<App client={driveProofClient} />`.
- `apps/driver/src/App.tsx` passes that client to `DriverExperience`.
- `DriverExperience` consumes only `DriveProofClient`; it does not construct a client or call wallet/attestor APIs directly.

`shared/driveproof-client/src/index.ts` now selects `MidnightDriveProofClient` for `createDriveProofClient("midnight")`. The two app entrypoints select that explicit mode from `VITE_DRIVEPROOF_CLIENT_MODE`; no Driver component imports Midnight APIs.

## Driver state transitions

The product state type is `DriverFlowState` in `shared/types/src/index.ts`:

```text
idle -> preparing -> proving -> submitting -> verified
                                      \-> rejected
                                      \-> error
```

Expected policy, integrity, replay, and unknown prover rejections are returned as `ProofResult` with `status: "rejected"`. Unexpected client/runtime failures are thrown and rendered as an error state. The mock-only stage delay is never applied to a future `mode: "midnight"` client.

The polished Driver uses the optional connection hooks when `mode` is `"midnight"`: connect first, request an attested trip, then prove. The debug transaction harness remains a separate real evidence surface.

## Insurer injection point

`apps/insurer/src/main.tsx` is the implementation-selection point and renders `<App client={driveProofClient} publicResult={publicResult} />`. It accepts only a URL-encoded public receipt produced by the Driver link; it never requests an attestation or proof in real mode.

`InsurerExperience` accepts a public result directly:

```tsx
<InsurerExperience
  publicResult={proofResult}
  mode={client.mode}
  displayName={client.displayName}
  onResubmit={optionalPublicResultRefresh}
/>
```

When `publicResult` is supplied, the verifier view renders only `ProofResult`/`PublicProofReceipt` data. It does not need a `TripAttestation`. In real mode with no receipt it shows `NO PROOF LOADED`; the mock path remains available for the fixture demo. Do not make the Insurer fetch raw telemetry from Driver.

## Expected rejection shape

Return narrow results for expected contract outcomes:

- policy assertion: `{ status: "rejected", reason: "policy" }`
- signature/integrity assertion: `{ status: "rejected", reason: "integrity" }`
- replay/nullifier assertion: `{ status: "rejected", reason: "replay" }`
- undifferentiated genuine prover rejection: `{ status: "rejected", reason: "unknown" }`

Do not convert runtime failures, missing artifacts, wrong network, wallet rejection, or provider errors into a fabricated rejection or success.

## What must remain private

Keep telemetry samples, route/grid positions, speed and braking history, attestation signatures/private material, subject secrets, wallet seeds/mnemonics, and `PROVIDER_SECRET_KEY` behind the client/attestor boundaries. Only the public receipt/result crosses into the Insurer presentation layer.

## Frontend files Ashiha should not need to modify

The current implementation satisfies the interface and is selected by the existing factory. Future contract phases should stay inside the client adapter and generated-artifact mapping; no Driver/Insurer component changes should be required for private-state or circuit changes. Leave these unchanged:

- `apps/driver/src/PreprodTransactionDebugPage.tsx`
- `shared/midnight-runtime/**`
- `shared/midnight-wallet/**`
- `apps/driver/src/App.tsx` product components
- `apps/insurer/src/App.tsx` public-result presentation

This handoff does not define contract addresses, policy serialization, attestor serialization, witness fields, generated APIs, or transaction mechanics. Those remain supplied by the real generated client and contract handoff.

## Current real adapter

`shared/driveproof-client/src/midnight.ts` is the current v2 adapter. It owns the Lace session, browser-generated session subject, attestor request, generated contract compilation, runtime/provider construction, deploy-on-first-proof, contract join, and public receipt mapping. Its circuit call is `proveCompliance()` with no caller-supplied policy namespace; `policyId` is retained only as product metadata.

Enable the real product flow explicitly with `VITE_DRIVEPROOF_CLIENT_MODE=midnight`. It requires Lace on Midnight Preprod, the local proof server at `http://localhost:6300`, the local attestor at `http://localhost:4000`, and the generated assets served at `/contract/compiled/driveproof`. The app does not fall back to mock mode when any prerequisite fails.
