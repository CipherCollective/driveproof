# DriveProof Final Video Shot List

Target length: 90–110 seconds. The real transaction shots use the DEV-only
harness and must retain its real-state labels. Do not manufacture a status,
transaction ID, block, or ledger value to fit the edit.

## Recording setup

- Driver product: `http://localhost:5173/driver`
- Real evidence harness: `http://localhost:5173/wallet-debug/transaction?recording=1`
- Insurer product: `http://localhost:5174/`
- Product homepage and Insurer public-receipt shots are **PLACEHOLDER** while
  the product default is still `MockDriveProofClient`.
- The real Phase 1 results and previously confirmed values are recorded in
  [`PREPROD_EVIDENCE.md`](PREPROD_EVIDENCE.md). The recording must show values
  returned by the current run or clearly use that evidence as evidence; never
  replace them with invented data.

## Shot list

| Time | Page / URL | Action | Expected screen state | Narration |
| --- | --- | --- | --- | --- |
| 0:00–0:05 | Landing `/` or a simple title card | Open on the DriveProof mark. | Clean title: `DRIVEPROOF`; no wallet or mock claim hidden. | “Built for the Midnight Hackathon — August 2026.” |
| 0:05–0:15 | Driver `/driver` **[PLACEHOLDER — product shell is mock]** | Show the private-trip view and its deterministic route/grid. | Driver sees the journey and private-state panel; `MOCK ONLY` remains visible. | “Usage-based insurance normally means surrendering sensitive driving data just to prove one safe trip.” |
| 0:15–0:25 | Driver `/driver` **[PLACEHOLDER — product shell is mock]** | Hold on the privacy boundary and thesis copy. | Raw telemetry disclosure counts remain visible; do not describe the mock flow as a chain transaction. | “Zero knowledge protects privacy. Attestation protects integrity.” |
| 0:25–0:35 | Prepared architecture card or README architecture diagram | Show the simple flow: Driver → authorized attestor → private witness → Compact ZK proof → Midnight → insurer result. | Raw telemetry is labeled private; the attestor is the trust boundary. | “The issuer signs a private measurement. Compact evaluates the policy, and Midnight records the minimal public result.” |
| 0:35–1:05 | Real harness `/wallet-debug/transaction?recording=1` | Confirm readiness, click `CONNECT LACE`, request safe, build providers, deploy if this tab has no deployed contract, approve Lace manually, then prove safe and approve Lace manually. | Readiness shows real `DETECTED`, `CONNECTED`, `PREPROD`, `LOCAL 8.1.0`, and `READY`; final evidence shows `MIDNIGHT PREPROD`, returned contract/transaction data, `SucceedEntirely`, block, and observed `complianceCount = 1`. | “This is the real Phase 1 path: the simulator issues signed 67, the witness stays private to proving, Lace authorizes, and Midnight Preprod returns the verified result.” |
| 1:05–1:18 | Real harness, same tab | Click `TRY UNSAFE · 112` after the safe proof. | `REJECTED AS EXPECTED`; `Policy violation`; exact technical assertion `Speed exceeds policy limit`; no successful transaction recorded. | “A signed 112 exceeds the 80 policy limit, so no compliant proof is recorded.” |
| 1:18–1:30 | Real harness, same tab | Click `TRY TAMPER · 112 → 71`. | `REJECTED AS EXPECTED`; `Integrity violation`; exact technical assertion `Invalid attestation signature`; no successful transaction recorded. | “Changing the private value without changing the issuer signature is rejected.” |
| 1:30–1:42 | Insurer `/` **[PLACEHOLDER — awaits MidnightDriveProofClient]** | Show the Insurer information boundary with the mock disclosure intact. | Insurer sees public-result presentation only; it must not be narrated as live contract/indexer data until the real client is injected. | “The insurer needs the compliance result, not the route, origin, destination, or speed history.” |
| 1:42–1:50 | Landing `/` or title card | End on the thesis. | Final line on screen. | “Prove you drove safely without revealing where you drove.” |

The table above is 110 seconds or less. If the live Lace approval takes longer
than the edit window, do not speed through it by implying approval; pause the
recording and resume once the genuine result is visible.

## Supported contract reuse

The current harness safely reuses a deployed contract only within the same
open page session: after `deployContract()` returns, `findDeployedContract()`
uses the returned address for the proof and failure-boundary actions. The
harness does not yet hydrate a contract address after a reload or offer a
manual address-entry flow. Therefore the shortest supported recording is one
fresh real deployment followed by safe, unsafe, and tamper actions in the same
tab. `RESET UI ONLY` does not make chain state fresh and should be used only
before the recording flow begins.
