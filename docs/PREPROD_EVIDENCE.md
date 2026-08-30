# Real Midnight Preprod Evidence

This document separates the final-stack acceptance record from the exact transaction
identifiers preserved from an earlier confirmed Preprod checkpoint. No transaction
identifier is inferred or invented.

## Final-stack acceptance

The final 16-sample stack has been accepted against real Midnight Preprod:

- constructor-bound DriveProof deployment succeeded;
- a safe 16-sample proof succeeded through Lace and Midnight Preprod;
- the resulting public compliance result was observed;
- the same attestation was rejected on replay with the assertion
  "Attestation already used";
- a signed unsafe trip containing speed 112 was rejected with
  "Speed exceeds policy limit";
- an out-of-geofence trip was rejected with
  "Sample outside policy geofence";
- a telemetry value changed after signing was rejected with
  "Invalid attestation signature"; and
- the contract acceptance suite covers excessive harsh braking, coordinate
  tampering, and the fact that failed policy/integrity attempts do not consume
  the replay nullifier.

Raw samples, route/grid positions, speed history, braking history, time buckets,
salt, signatures, and subject secrets are not part of the public receipt.

## Exact recorded transaction evidence

The following values are the exact real Preprod values already recorded in this
repository at the earlier preprod-e2e-success checkpoint. They remain useful
evidence of the real Lace/runtime path, but they are not relabeled as final
16-sample transaction identifiers.

| Field | Recorded value |
| --- | --- |
| Network | Midnight Preprod |
| Wallet | Lace browser extension |
| Contract address | 5f9f3d256d9beccbff093793e5cd5d886397a51ed41e6b52d7912cc619276d2e |
| Deployment transaction | 0089fdc7d64e4ec8005118825b86000f57b021f68600072b3c0dadadfcd0b9f089 |
| Deployment status | SucceedEntirely |
| Deployment block | 2318666 |
| Safe signed speed | 67 km/h |
| Policy speed limit | 80 km/h |
| Safe proof transaction | 003174c12ab58e357107aa49aeb16f615d7c98ff37ebfbb4fc580a58acdf980119 |
| Safe proof status | SucceedEntirely |
| Safe proof block | 2318673 |
| Observed complianceCount | 0 -> 1 |

These values were recorded from the confirmed run at commit ea14c9f,
tagged preprod-e2e-success. The final stack acceptance above is the current
cryptographic state; use a newly captured final-stack transaction record when
quoting final 16-sample transaction IDs.

## What the evidence demonstrates

DriveProof's real path combines:

1. an authorized Vehicle Attestor Simulator issuing the private signed input;
2. client-side subject binding;
3. private 16-sample witness handling;
4. Compact signature, commitment, policy, geofence, and replay checks;
5. Lace authorization;
6. Midnight Preprod submission; and
7. a public compliance result that can be rendered by the Insurer surface.

The Vehicle Attestor Simulator is the prototype trust root. This evidence does
not independently prove physical vehicle, GPS, or sensor provenance.

## Evidence boundaries

The public ledger and Insurer receipt expose only the protocol's public result
and safe transaction metadata. Exact final public fields remain governed by the
generated contract and receipt mapping; this document does not add fields that
were not observed.
