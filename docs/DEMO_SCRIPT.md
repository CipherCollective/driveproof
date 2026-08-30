# DriveProof Demo Script

Target length: 90-110 seconds, never more than two minutes.

The real transaction evidence is from the confirmed Phase 1 run in [`PREPROD_EVIDENCE.md`](PREPROD_EVIDENCE.md). Do not rerun a transaction during recording unless Lace approval is intentional and manual.

| Time | Shot and action | Honest narration |
| --- | --- | --- |
| 0:00-0:10 | Open landing `/`, then move to the mobile Driver view at `/driver`. | **"Built for the Midnight Hackathon — August 2026."** Usage-based insurance should not require surrendering a complete driving and location history just to prove one safe trip. |
| 0:10-0:25 | Driver `/driver`: show the private route/grid, local private state, and raw telemetry disclosure counts. | DriveProof separates the safety result from the journey behind it. The polished Driver surface uses deterministic product fixtures for the demo; the raw route and telemetry are not shown to the insurer or public ledger. |
| 0:25-0:38 | Open the real `/wallet-debug/transaction` harness and request the safe attestation. | The real Phase 1 path starts with the Vehicle Attestor Simulator issuing a signed private speed of `67`. The browser never chooses that speed. |
| 0:38-0:52 | Show providers ready, generated proof flow, and the Lace approval boundary. | The witness is held in private state, the generated Compact circuit checks it against the `80 km/h` policy, and Lace authorizes the Preprod transaction. Never show the signature or any secret. |
| 0:52-1:05 | Show the confirmed Preprod transaction evidence: contract, tx, block, and `complianceCount = 1`. | This is a real Midnight Preprod result: the safe proof finalized successfully and the indexed compliance count moved from `0` to `1`. |
| 1:05-1:18 | Request the unsafe attestation and run the real failure boundary. | An authentic signed `112 km/h` measurement cannot satisfy the `80 km/h` policy. The Compact proof rejects it with `Speed exceeds policy limit`; no successful transaction is claimed. |
| 1:18-1:31 | Run the tamper boundary: signed `112` with private witness changed to `71`. | Changing the private value without changing the issuer signature is rejected with `Invalid attestation signature`. Again, no fabricated transaction or success is shown. |
| 1:31-1:43 | Show the Insurer product surface and its private-data boundary, with the mock disclosure visible. | The Insurer experience is the polished verifier shell and is still explicitly marked mock until the product `MidnightDriveProofClient` is wired. The real public evidence is the Preprod compliance result, not a hidden claim in this UI. |
| 1:43-1:50 | Close on the thesis. | **"Zero knowledge protects privacy. Attestation protects integrity."** |

## Recording guardrails

- Keep the `MOCK ONLY` or `MOCK UX SIMULATION` disclosure visible on the product surfaces.
- Keep the real harness label visible when showing the genuine Preprod evidence.
- Do not narrate the Driver product shell or Insurer shell as a live contract client.
- Do not expose provider secrets, wallet seeds, mnemonics, private signatures, or private witness values.
- Do not auto-submit or silently approve a Lace transaction.
