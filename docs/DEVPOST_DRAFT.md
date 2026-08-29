# DriveProof - Devpost Draft

## Project title

DriveProof

## One-line tagline

Prove you drove safely without revealing where you drove.

## Inspiration

Usage-based insurance can answer a simple question - was a trip safe? - by demanding an unnecessarily complete record of the driver's routes, locations, speeds, and braking behavior. We wanted to separate the compliance signal from the sensitive journey that produced it.

## What it does

DriveProof lets a driver use a signed measurement from an authorized vehicle attestor as a private witness. A Midnight Compact circuit verifies the attestor signature and checks the Phase 1 speed policy without publishing the raw speed. A successful proof is submitted to Midnight Preprod, where the observed public application result is `complianceCount = 1`. The insurer can verify the compliance result without receiving the raw telemetry or route.

The current product shell includes a mobile-first Driver PWA and a separate Insurer verifier experience. Both are clearly marked mock-mode product surfaces until the final product `MidnightDriveProofClient` is connected to the generated contract API. The real transaction evidence is available in the isolated Preprod harness.

## How we built it

- TypeScript, React, and Vite for separate Driver and Insurer web apps.
- A shared `DriveProofClient` boundary keeps UI components independent from blockchain mechanics.
- A Vehicle Attestor Simulator owns the safe `67` and unsafe `112` demo measurements and signs them with its service-side provider key.
- A Phase 1 Compact contract verifies a constructor-registered attestor's Schnorr-on-Jubjub signature and checks `speed <= 80`.
- The Midnight runtime harness combines Lace's ConnectedAPI, encrypted browser private state, generated Compact assets, the local proof server `8.1.0`, and Midnight Preprod providers.
- The real acceptance path uses the Lace browser extension because current Lace Mobile does not support Midnight signing.

## Real Preprod accomplishment

The confirmed Phase 1 run deployed the contract and produced a real safe proof on Midnight Preprod:

- Contract: `5f9f3d256d9beccbff093793e5cd5d886397a51ed41e6b52d7912cc619276d2e`
- Deployment transaction: `0089fdc7d64e4ec8005118825b86000f57b021f68600072b3c0dadadfcd0b9f089`, block `2318666`, status `SucceedEntirely`
- Safe proof transaction: `003174c12ab58e357107aa49aeb16f615d7c98ff37ebfbb4fc580a58acdf980119`, block `2318673`, status `SucceedEntirely`
- Signed speed: `67`; policy limit: `80`; observed `complianceCount`: `0 -> 1`

The same real proof path rejects an attestor-signed `112` with `Speed exceeds policy limit`, and rejects a signed `112` whose private witness is changed to `71` with `Invalid attestation signature`.

## Challenges

The hardest part was keeping a compelling mobile product experience separate from the engineering evidence needed to prove a real wallet path. Lace authorization, Midnight network configuration, browser compatibility shims, private-state setup, proof-server versioning, and manual wallet approval all have distinct failure boundaries. We kept those boundaries visible instead of hiding them behind a simulated success.

The hosted app can connect to a browser wallet, but a local proof server is per-machine and HTTPS-to-localhost browser security can block it. The documented demo path therefore keeps the real proof server local and uses a dedicated engineering harness.

## Accomplishments

- Delivered a restrained, mobile-first Driver experience for the Mobile track.
- Made the private/public boundary legible in under two minutes.
- Preserved real Lace authorization and Midnight Preprod execution.
- Recorded a genuine contract deployment and safe proof transaction.
- Demonstrated policy rejection and signature-integrity rejection without fabricating chain results.
- Kept the Vehicle Attestor Simulator honest as a prototype trust root.

## What we learned

Zero knowledge and attestation solve different problems. The proof can hide a measurement and still show that it satisfies a predicate; the attestation ties that measurement to an authorized issuer. Neither mechanism, by itself, proves that a simulated measurement came from a physical vehicle. That trust boundary needs an OEM, secure vehicle computer, trusted OBD device, or other hardware-backed provider.

## What's next

- Wire the product `MidnightDriveProofClient` to the generated contract API.
- Connect the Insurer view to the exact public fields returned by the completed contract.
- Add the next cryptographic phases for subject binding and deterministic nullifiers/replay protection.
- Expand the witness only when the contract handoff defines the final telemetry, braking, and geofence semantics.
- Replace the simulator with a production hardware-backed telemetry issuer.

## Built with

Midnight Compact, Midnight.js, Midnight Preprod, Lace browser extension, local Midnight proof server `8.1.0`, React, Vite, TypeScript, Vitest, and a Vehicle Attestor Simulator.

## Privacy and security

The intended private data includes telemetry measurements, route/grid locations, speed and braking history, attestation material, and any subject secret required by the final contract. Raw driving telemetry is not revealed to the insurer or public ledger. Public chain data includes the contract state and transaction metadata; the Phase 1 proof call's observed application result is `complianceCount = 1`.

The attestor service owns its persistent provider secret. It never belongs in browser code, Vite environment variables, logs, or committed files. Lace owns wallet signing. No seed, mnemonic, private witness, or signing secret is part of this submission.

## Prototype trust-boundary disclosure

The hackathon prototype simulates the authorized vehicle telemetry issuer. DriveProof proves integrity and policy compliance after that trust boundary; it does not independently prove physical sensor provenance, and it does not claim that the simulator itself cannot lie.

## Mobile-track note

The Driver is a responsive, mobile-first PWA designed for a phone-sized viewport. The final hackathon signing step is performed through the Lace desktop/browser extension because Lace Mobile currently does not support Midnight. The product remains mobile-first even though the wallet approval surface is desktop-based.
