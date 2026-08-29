import { describe, expect, it } from "vitest";
import { classifyExpectedProofRejection } from "./proofErrorPresentation";

describe("classifyExpectedProofRejection", () => {
  it("classifies the known policy assertion", () => {
    expect(classifyExpectedProofRejection(new Error("failed assert: Speed exceeds policy limit"))).toEqual({
      kind: "policy",
      eyebrow: "REJECTED AS EXPECTED",
      heading: "Policy violation",
      description: "The attested telemetry exceeds the insurer's safety policy.",
      technicalDetail: "failed assert: Speed exceeds policy limit"
    });
  });

  it("classifies the known integrity assertion through a nested cause", () => {
    expect(classifyExpectedProofRejection({
      message: "Scoped transaction rejected",
      cause: { message: "Invalid attestation signature" }
    })).toEqual({
      kind: "integrity",
      eyebrow: "REJECTED AS EXPECTED",
      heading: "Integrity violation",
      description: "The private witness no longer matches the authorized issuer's signature.",
      technicalDetail: "failed assert: Invalid attestation signature"
    });
  });

  it("leaves unknown errors unclassified", () => {
    expect(classifyExpectedProofRejection(new Error("Indexer unavailable"))).toBeUndefined();
  });
});
