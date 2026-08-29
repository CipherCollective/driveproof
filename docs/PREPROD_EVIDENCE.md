# Real Midnight Preprod Evidence

This is the recorded Phase 1 end-to-end checkpoint for DriveProof. Values below are copied from the confirmed run at commit [`ea14c9f`](https://github.com/CipherCollective/driveproof/commit/ea14c9f), tagged `preprod-e2e-success`.

## Environment

| Item | Confirmed value |
| --- | --- |
| Network | Midnight Preprod |
| Wallet | Lace browser extension |
| Proof server | Local Midnight proof server `8.1.0` at `http://localhost:6300` |
| Attestor | Vehicle Attestor Simulator at `http://localhost:4000` |
| Phase 1 policy | Speed limit `80 km/h` |
| Constructor attestor ID | `1` |

No wallet seed, mnemonic, provider secret, or private witness is included in this document.

## Contract deployment

| Field | Result |
| --- | --- |
| Network | Midnight Preprod |
| Contract address | `5f9f3d256d9beccbff093793e5cd5d886397a51ed41e6b52d7912cc619276d2e` |
| Deployment transaction | `0089fdc7d64e4ec8005118825b86000f57b021f68600072b3c0dadadfcd0b9f089` |
| Status | `SucceedEntirely` |
| Block | `2318666` |

The deployed constructor bound the Phase 1 speed limit `80` and trusted attestor ID `1`. The attestor public key is the registered handoff key used by the harness; its private provider key is never part of the browser or repository.

## Safe proof

1. The Driver requested `POST /attest` with `{ "tripId": "safe" }`.
2. The Vehicle Attestor Simulator returned an issuer-signed speed of `67`.
3. The private state held the speed, Schnorr signature, and attestor ID.
4. The generated `proveCompliance()` circuit evaluated `67 <= 80`.
5. Lace authorized the real transaction.
6. Midnight Preprod returned the following confirmed result:

| Field | Result |
| --- | --- |
| Signed attestor value | `67 km/h` |
| Policy limit | `80 km/h` |
| Proof transaction | `003174c12ab58e357107aa49aeb16f615d7c98ff37ebfbb4fc580a58acdf980119` |
| Status | `SucceedEntirely` |
| Block | `2318673` |
| Observed `complianceCount` | `0 -> 1` |

The public result observed for this Phase 1 proof was `complianceCount = 1`. The raw speed and signature were used as private proving inputs and were not published as raw telemetry.

## Negative acceptance

### Unsafe signed measurement

The attestor-issued unsafe fixture returned `112 km/h`. The Compact proof was rejected with:

```text
Speed exceeds policy limit
```

No successful compliance transaction is claimed for this attempt.

### Tampered private witness

An attestor-signed `112 km/h` witness was locally changed to `71 km/h` while retaining the original signature. The Compact proof was rejected with:

```text
Invalid attestation signature
```

No successful compliance transaction is claimed for this attempt. The negative cases intentionally do not fabricate transaction IDs, block heights, or ledger success.

## What this proves

This checkpoint demonstrates the real Phase 1 path: an authorized simulator-issued signed measurement, private witness handling, generated Compact proof execution, Lace authorization, Midnight Preprod submission, and an indexed public compliance result.

It does not prove physical vehicle sensor provenance. The simulator remains the prototype trust root. Subject binding, deterministic nullifiers/replay protection, and expanded telemetry are not included in this Phase 1 evidence.
