# DriveProof Demo Script

Target length: 90-110 seconds. Use the reliable Vercel URLs for the hosted
product and the real Midnight path. Lace approvals are always manual.

## Timed script

| Time | Screen and action | Narration |
| --- | --- | --- |
| 0:00-0:08 | Open the landing page at / and show the hero. | Built for the Midnight Hackathon - August 2026. Usage-based insurance should not require surrendering a complete driving history just to prove one safe trip. |
| 0:08-0:20 | Select Launch Driver and show /driver at a mobile-sized viewport. | DriveProof proves the policy, not the journey. The Driver sees the private trip; the Insurer does not receive the route or telemetry. |
| 0:20-0:30 | Show the architecture/privacy section or the Driver privacy boundary. | An authorized attestor signs the trip. Compact checks it privately, and Midnight records the minimal public result. |
| 0:30-0:40 | On the real Driver flow, connect Lace and confirm Preprod. | Lace authorizes the wallet action on Midnight Preprod. The current wallet step uses the desktop/browser extension. |
| 0:40-0:50 | Prepare the signed 16-sample trip and show policy limits. | The attestor owns the fixture. The Driver cannot replace the speed, braking flags, coordinates, salt, or attestation ID. |
| 0:50-1:05 | Select Create Private Proof, approve Lace manually, and show the confirmed real receipt. | The private witness satisfies the speed, braking, and allowed-area policy. The public result shows compliance, transaction, block, and contract metadata only. |
| 1:05-1:17 | Open View Insurer Receipt. | The Insurer verifies the public compliance receipt without receiving route, location, speed history, braking history, or raw telemetry. |
| 1:17-1:27 | In the technical evidence surface, run the unsafe speed fixture. | A signed 112 km/h trip exceeds the 80 km/h policy and is rejected. No compliant proof is recorded. |
| 1:27-1:37 | Run the tamper fixture, changing signed 112 to witness 71. | Changing the private witness without changing the issuer signature is rejected as an integrity failure. |
| 1:37-1:46 | If time permits, show geofence and replay expected rejections. | The same attestation cannot be replayed, and every private sample must remain inside the allowed operating area. |
| 1:46-1:50 | Return to the landing page or Driver result. | Zero knowledge protects privacy. Attestation protects integrity. |

## Accurate narration guardrails

- Call the Vehicle Attestor Simulator the prototype trust root.
- Say raw telemetry is not written to public ledger state and is not included
  in the Insurer receipt.
- Do not say telemetry never leaves the device; the hosted proof server is
  remote.
- Do not claim the simulator proves physical vehicle or GPS provenance.
- Do not show or narrate provider secrets, wallet seeds, mnemonics, signatures,
  or private witness values.
- If the live flow is not being run, show only previously confirmed evidence
  and never invent transaction identifiers.
