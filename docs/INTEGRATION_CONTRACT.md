# DriveProof · Cryptographic integration contract

Status: frontend handoff boundary for Mission 01. The product shell is ready, but the genuine Midnight client is not wired until the cryptographic workstream supplies the artifacts below.

## Non-negotiable trust and secret boundary

- The attestor service owns `PROVIDER_SECRET_KEY`.
- `PROVIDER_SECRET_KEY` must persist across attestor service restarts so the registered public key remains stable.
- The corresponding public key is what gets registered on Midnight.
- The frontend/integration layer receives only `attestorId`, the attestor public key, and deployment metadata as needed.
- Never expose `PROVIDER_SECRET_KEY` to browser code, Vite env vars, logs, README files, or committed files.
- The root `.gitignore` preserves the repository’s existing safe rules and covers `.env`, `.env.*`, and `!.env.example`.

## Intended frontend path

```text
Driver PWA
    ↓
DriveProofClient
    ↓
Midnight generated contract client
    ↓
Midnight Preprod
    ↓
Lace browser extension / desktop browser signing
```

The Driver remains a mobile-first PWA. Lace Mobile on Android is not assumed to sign Midnight transactions. The first genuine wallet-connected path is Preprod plus the Lace desktop/browser extension. Local UI development continues to use `MockDriveProofClient`.

## Current frontend boundary

The product currently exposes these TypeScript shapes in `shared/types`:

```ts
type DemoFixture = "safe" | "unsafe" | "tampered";

type TelemetrySample = {
  gridX: number;
  gridY: number;
  speed: number;
  braking: number;
  timeBucket: number;
};

type TripAttestation = {
  attestorId: string;
  attestationId: string;
  samples: TelemetrySample[];
  signature: string;
  fixture: DemoFixture;
};

type ProofResult =
  | { status: "verified"; transactionId: string; nullifier?: string }
  | { status: "rejected"; reason?: "policy" | "integrity" | "replay" | "unknown" };
```

These are not cryptographic truth. They are a replaceable product boundary and may be adapted once the generated API is known. The real serialization, witness shape, signature encoding, nullifier, transaction structure, and result mapping must be implemented behind `DriveProofClient`.

## Required capabilities from Ashiha’s workstream

Please confirm the generated contract/client supports or exposes an equivalent for:

1. a registered trusted attestor;
2. a private signed speed/telemetry witness;
3. policy evaluation;
4. subject binding;
5. a deterministic replay nullifier;
6. a genuine rejected result for policy failure, invalid witness/signature, and replay where the contract can distinguish them.

The frontend should not infer a specific rejection diagnosis. If the real result does not distinguish integrity from a generic prover rejection, the Insurer UI will remain generic.

## Required acceptance cases

These should be demonstrated by contract/client tests and then exposed to the frontend integration adapter:

| Scenario | Expected contract outcome |
| --- | --- |
| Registered attestor signs a safe trip with max speed 67 | Valid compliance proof for `AUTO-SAFE-01` |
| Registered attestor signs a trip containing 112 km/h | Cannot produce a valid compliance proof for `AUTO-SAFE-01` |
| Attestor signs 112; user substitutes 71 but retains original attestation/signature | Cannot produce a valid proof |
| Same valid attestation + same policy submitted twice | First succeeds; second is rejected by deterministic replay protection |

The verifier must not receive raw route, origin, destination, GPS history, or exact speed history in any of these flows.

## Artifact handoff checklist

Please provide the following exact information. Do not fill these with guesses in the frontend:

- [ ] Generated Midnight contract API/client package and version/commit.
- [ ] Deployed Midnight Preprod contract address, network identifier, or equivalent deployment metadata.
- [ ] Exact policy ID representation for `AUTO-SAFE-01` (string, enum, field encoding, or generated type).
- [ ] Exact attestor ID representation.
- [ ] Registered attestor public key representation and serialization.
- [ ] Attestation serialization and signature encoding.
- [ ] Subject-binding input and the frontend-visible subject identifier requirements.
- [ ] Witness/private input shape required by the generated client.
- [ ] Wallet/client functions required to connect Lace and sign on Preprod.
- [ ] Exact invocation needed to prove and submit compliance.
- [ ] Returned transaction/result structure, including how transaction ID, nullifier, and rejection are represented.
- [ ] Contract/client test command and expected output for the four acceptance cases above.

## Integration adapter TODOs

The following must remain TODO until the handoff is complete:

```ts
// TODO(ashiha): import the generated Midnight contract/client package.
// TODO(ashiha): replace TripAttestation serialization with the generated type.
// TODO(ashiha): map AUTO-SAFE-01 to the exact generated policy representation.
// TODO(ashiha): pass the registered attestor ID/public key in the exact required form.
// TODO(ashiha): bind the proof to the exact subject identifier required by contract.
// TODO(ashiha): invoke the genuine private witness/proof submission flow.
// TODO(ashiha): map the real transaction/result structure to ProofResult.
// TODO(ashiha): use the contract’s nullifier/replay result as the source of truth.
```

No substitute cryptography belongs in the product app. `MockDriveProofClient` is permitted only for local UX development and is labeled throughout the Driver and Insurer surfaces as mock-only.
