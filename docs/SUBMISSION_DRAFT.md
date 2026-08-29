# DriveProof Submission Draft

This index replaces the pre-Preprod submission notes with the current Mission 4C material. It keeps the distinction between the real Phase 1 transaction evidence and the still-mock product verifier explicit.

## Start here

- [README](../README.md) - concise project explanation, privacy boundary, architecture, and status.
- [Real Preprod evidence](PREPROD_EVIDENCE.md) - exact confirmed contract, transactions, blocks, and negative acceptance.
- [Demo script](DEMO_SCRIPT.md) - honest 110-second recording plan.
- [Devpost draft](DEVPOST_DRAFT.md) - submission-ready narrative.
- [Judge quickstart](JUDGE_QUICKSTART.md) - hosted inspection and optional local reproduction.

## Current claim

DriveProof proves that telemetry issued by an authorized attestor satisfies an insurer's safety policy without revealing the telemetry.

The confirmed Phase 1 Preprod path proves one attestor-signed speed value (`67`) satisfies a public `80 km/h` limit. The product Driver and Insurer surfaces remain explicitly mock-mode until the product `MidnightDriveProofClient` is wired to the generated contract API.

## Honest boundary

The hackathon prototype simulates the authorized vehicle telemetry issuer. DriveProof proves integrity and policy compliance after that trust boundary; it does not independently prove physical sensor provenance. Subject binding, deterministic nullifiers/replay protection, and expanded telemetry remain pending phases.
