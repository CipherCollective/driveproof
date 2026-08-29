# DriveProof Client Integration Handoff

Status: the product seam is ready. `MidnightDriveProofClient` is not implemented in this commit and the current product default remains `MockDriveProofClient`.

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

Wire the supplied implementation through the existing `createDriveProofClient("midnight")` branch in `shared/driveproof-client/src/index.ts` (or an equivalent adapter there). Do not change Driver components to call Midnight APIs.

## Driver state transitions

The product state type is `DriverFlowState` in `shared/types/src/index.ts`:

```text
idle -> preparing -> proving -> submitting -> verified
                                      \-> rejected
                                      \-> error
```

Expected policy, integrity, replay, and unknown prover rejections are returned as `ProofResult` with `status: "rejected"`. Unexpected client/runtime failures are thrown and rendered as an error state. The mock-only stage delay is never applied to a future `mode: "midnight"` client.

The current UI does not require a separate `connect()` method. Wallet discovery, authorization, and runtime setup belong inside the real client or its existing integration boundary until a product-level connection surface is explicitly requested.

## Insurer injection point

`apps/insurer/src/main.tsx` is the implementation-selection point and renders `<App client={driveProofClient} />`.

`InsurerExperience` accepts a public result directly:

```tsx
<InsurerExperience
  publicResult={proofResult}
  mode={client.mode}
  displayName={client.displayName}
  onResubmit={optionalPublicResultRefresh}
/>
```

When `publicResult` is supplied, the verifier view renders only `ProofResult`/`PublicProofReceipt` data. It does not need a `TripAttestation`. The current default mock path remains available for the existing fixture demo; replace that adapter at the application boundary when the real public contract/indexer result is ready. Do not make the Insurer fetch raw telemetry from Driver.

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

Once the implementation satisfies the interface and is selected by the existing factory, no Driver/Insurer component changes should be required. The expected integration touch points are the client adapter/factory and, if needed, the application-boundary code that loads a public receipt for the Insurer. Leave these unchanged:

- `apps/driver/src/PreprodTransactionDebugPage.tsx`
- `shared/midnight-runtime/**`
- `shared/midnight-wallet/**`
- `apps/driver/src/App.tsx` product components
- `apps/insurer/src/App.tsx` public-result presentation

This handoff does not define contract addresses, policy serialization, attestor serialization, witness fields, generated APIs, or transaction mechanics. Those remain supplied by the real generated client and contract handoff.
