import { describe, expect, it } from "vitest";
import { getDriverProofSteps } from "./driverPresentation";

describe("Driver proof step presentation", () => {
  it("gates proof creation until an attested trip is loaded", () => {
    const steps = getDriverProofSteps({ mode: "mock", hasAttestation: false, flowState: "idle" });
    expect(steps.find((step) => step.id === "prepare-trip")?.state).toBe("current");
    expect(steps.find((step) => step.id === "generate-proof")?.state).toBe("upcoming");
    expect(steps.find((step) => step.id === "approve-transaction")?.state).toBe("unavailable");
  });

  it("makes policy review and proving current after an attestation is ready", () => {
    const steps = getDriverProofSteps({ mode: "mock", hasAttestation: true, flowState: "idle" });
    expect(steps.find((step) => step.id === "prepare-trip")?.state).toBe("complete");
    expect(steps.find((step) => step.id === "review-policy")?.state).toBe("complete");
    expect(steps.find((step) => step.id === "generate-proof")?.state).toBe("current");
  });

  it("only marks the final step complete for a verified result", () => {
    const steps = getDriverProofSteps({
      mode: "midnight",
      hasAttestation: true,
      flowState: "verified",
      result: { status: "verified", receipt: { status: "verified", transactionId: "public_tx" } }
    });
    expect(steps.every((step) => step.state === "complete")).toBe(true);
  });
});
