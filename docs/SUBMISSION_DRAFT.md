# DriveProof Submission Draft

## One-line pitch

> Prove you drove safely without revealing where you drove.

## Technical thesis

> DriveProof proves that telemetry issued by an authorized attestor satisfies an insurer's safety policy without revealing the telemetry.

> Zero knowledge protects privacy. Attestation protects integrity.

## Problem

Usage-based insurance normally requires detailed route/location history, speed
history, braking history, and trip telemetry. The insurer usually needs only
to know whether a signed trip satisfied its safety policy.

## Solution

An authorized Vehicle Attestor Simulator signs a private 16-sample trip
commitment. The Driver keeps the witness behind the proving boundary. Compact
checks the registered issuer, subject binding, commitment integrity, speed,
braking, allowed operating area, and replay state. Midnight records only the
public compliance result and approved transaction metadata. The Insurer does
not receive the raw trip.

## Why Midnight

Ordinary hashing commits to a value but does not let an insurer evaluate
predicates over hidden telemetry. A traditional backend would need to receive
and retain the raw trip. Midnight supplies private witnesses, ZK policy
predicates, registered-attestor verification, minimal disclosure, and
contract-local replay protection.

The final implementation includes these capabilities. Exact public field
serialization remains defined by the generated contract and receipt mapping;
this document does not invent fields or transaction identifiers.

## Prototype trust boundary

The hackathon prototype simulates the authorized vehicle telemetry issuer.
DriveProof proves integrity and policy compliance after that trust boundary; it
does not independently prove physical sensor provenance.

Production replacements could include an OEM telematics control unit, trusted
OBD hardware, a secure vehicle computer, or a hardware-backed telemetry
provider.

## Private versus public

| Private intended witness | Public receipt / ledger categories |
| --- | --- |
| 16 telemetry samples | Compliant result |
| Route/grid positions | Policy identifier, where supplied by the public receipt |
| Speed and braking history | Attestor identifier, where public |
| Time buckets | Transaction and block metadata |
| Salt and signature witness | Contract/public state required by the protocol |
| Client-side driver secret | Exact final fields are governed by the generated contract and receipt mapping |

The Insurer view receives a public receipt/result. It does not receive
samples, coordinates, speed, braking, time buckets, salt, signature
internals, driver binding, or driver secrets.

## Demo

The strict recording plan is in docs/FINAL_VIDEO_SHOTLIST.md:

1. explain the privacy problem;
2. open the mobile-first Driver;
3. connect Lace on Preprod;
4. load the signed 16-sample trip;
5. show the private witness boundary and policy;
6. create the real private proof;
7. approve the real transaction in Lace;
8. show the public receipt in the Insurer view; and
9. show expected speed, tamper, geofence, and replay rejections where time
   permits.

## Technical judge Q&A

### How do you know the telemetry is genuine?

The prototype attestor is the authorized signing root. Compact verifies its
registered public key and the signature over the committed trip. Production
would replace the simulator with a trusted hardware or OEM telemetry issuer.
DriveProof does not claim physical sensor provenance.

### What exactly does zero knowledge prove?

It proves that the private signed trip is bound to the subject and satisfies
the configured speed, braking, and allowed-area predicates without exposing the
samples to the Insurer or public ledger.

### What prevents changing 112 to 71?

The signed commitment binds the telemetry. Changing a sample while retaining
the issuer signature causes an integrity rejection.

### What prevents replay?

The contract derives and consumes a contract-local attestation nullifier.
The same attestation cannot be accepted again.

### Why not just hash the route?

A hash proves consistency only to someone who knows the preimage. It does not
let an insurer verify hidden policy predicates or establish the registered
issuer signature without disclosure.

### Why is the attestor trusted?

It is the trust root for the prototype's telemetry claim. That is explicit,
not hidden. Production would move the trust root to an OEM, secure vehicle
computer, OBD device, or hardware-backed service.

### Does DriveProof prove physical GPS provenance?

No. The prototype uses a Vehicle Attestor Simulator and synthetic/private grid
telemetry. It proves signed-data integrity and policy compliance after the
issuer trust boundary.

### Why Midnight?

Midnight combines private witnesses, Compact ZK circuits, registered-attestor
verification, private policy evaluation, minimal public state, and replay
protection in one contract path.

### What remains private?

The samples, grid positions, speed and braking history, time buckets, salt,
signature witness, subject binding, and driver secret remain outside the public
receipt.

### Why is this Mobile Track relevant despite Lace Mobile not supporting Midnight?

The Driver product is a mobile-first PWA and its privacy experience is
designed for phone-sized screens. The current wallet constraint is honest:
Preprod signing uses the Lace desktop/browser extension.

### Why is final wallet signing done through Lace desktop/browser?

That is the current supported Midnight wallet path for this Preprod
prototype. The product is mobile-first; wallet authorization is currently
performed from a desktop browser with Lace.

### What would production architecture change?

Replace the simulator with a trusted telemetry source, keep proving local or
otherwise minimize witness exposure, add operational key management and
monitoring, and complete production wallet/mobile support. The core privacy
boundary remains the same.

## Current status

Done: final 16-sample Compact stack, braking and allowed-area policy, subject
binding, replay protection, real Midnight Preprod path, hosted Driver/Insurer/
Attestor surfaces, and product documentation.

The Vehicle Attestor Simulator remains a prototype trust root. Production
physical telemetry integration is outside this hackathon submission.
