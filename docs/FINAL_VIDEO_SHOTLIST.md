# Final DriveProof Video Shot List

Target length: 90-110 seconds. The video should be understandable with the
sound muted: private trip, authorized signature, Compact proof, Midnight result,
and Insurer receipt.

## Recording setup

Primary reliable hosted URLs:

- Driver: https://driveproof-driver-atharv.vercel.app/driver
- Insurer: https://driveproof-insurer-atharv.vercel.app
- Attestor health: https://driveproof-attestor-atharv.vercel.app/health

Use a phone-sized Driver viewport for the product shots and a desktop viewport
for the Insurer and Lace approval. The production Driver is real Midnight mode.
Do not auto-connect Lace or auto-submit a transaction.

## Shot list

| Time | URL/page | Action | Expected state | Narration |
| --- | --- | --- | --- | --- |
| 0:00-0:05 | Landing / | Hold on the DriveProof hero. | The headline reads: Prove you drove safely. Not where you drove. | Built for the Midnight Hackathon - August 2026. |
| 0:05-0:15 | Landing / | Show the privacy contrast, then select Launch Driver. | Private telemetry stays on the Driver side; the public result is minimal. | Usage-based insurance normally means surrendering sensitive driving data to prove a narrow policy result. |
| 0:15-0:25 | Driver /driver | Show the mobile-first workspace and private journey preview. | 16 private samples, speed/braking history, and route/grid positions are clearly on the private side. | DriveProof keeps the journey private while proving the policy. |
| 0:25-0:35 | Driver /driver or landing architecture section | Show authorized attestor -> private witness -> Compact ZK proof -> Midnight -> Insurer. | The Vehicle Attestor Simulator is labeled as the prototype trust root. | The issuer signs the trip, Compact evaluates it privately, and Midnight records the compliance result. |
| 0:35-0:43 | Driver real flow | Click Connect Lace and confirm Midnight Preprod manually. | REAL · MIDNIGHT PREPROD; Lace connected; Preprod confirmed. | The real wallet authorization happens through Lace on Preprod. |
| 0:43-0:53 | Driver real flow | Load the attested safe trip. | Signed 16-sample trip is ready; policy shows speed 80, braking at most 2, and the allowed private area. | The browser requests the trip from the authorized attestor; it does not choose the telemetry values. |
| 0:53-1:08 | Driver real flow | Click Create Private Proof and approve Lace manually. | Verified on Midnight Preprod with the real receipt metadata and no raw telemetry in the receipt. | Compact proves compliance over the private witness. The public result is the only result the Insurer needs. |
| 1:08-1:20 | Insurer / | Click View Insurer Receipt. | Public receipt shows compliant result, network, transaction, block, contract, and attestor; NOT SHARED lists route, location, speed, braking, and raw telemetry. | The Insurer verifies the result, not the route. |
| 1:20-1:30 | Technical evidence page | Run unsafe speed 112. | REJECTED AS EXPECTED; Speed exceeds policy limit; no successful transaction recorded. | An attested unsafe trip cannot produce a compliant proof. |
| 1:30-1:40 | Technical evidence page | Run telemetry tamper 112 -> 71. | REJECTED AS EXPECTED; Invalid attestation signature; no successful transaction recorded. | The signed commitment prevents changing the private witness. |
| 1:40-1:50 | Technical evidence page or landing / | If time permits, show geofence and same-attestation replay rejection, then close on the thesis. | Expected rejection states remain rejection states; no fake receipt appears. | Zero knowledge protects privacy. Attestation protects integrity. Prove you drove safely without revealing where you drove. |

## Editorial guardrails

- Show only real values returned by the current run or values already recorded
  in docs/PREPROD_EVIDENCE.md.
- Do not fabricate final-stack transaction IDs, blocks, or contract addresses.
- Do not expose private samples, signatures, subject secrets, provider secrets,
  wallet seeds, or mnemonics.
- Keep the Vehicle Attestor Simulator trust-boundary disclosure visible.
- If a live transaction is not practical during recording, use the confirmed
  evidence page and narrate it as recorded evidence, not as a new transaction.
