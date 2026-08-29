import { describe, expect, it } from "vitest";
import { deploymentStageLabel } from "./preprodPresentation";

describe("deploymentStageLabel", () => {
  it("shows confirmed Preprod after deployment succeeds", () => {
    expect(deploymentStageLabel(true, undefined, "WAITING FOR CONTRACT")).toBe("CONFIRMED ON PREPROD");
  });

  it("preserves failure detail before a deployment is confirmed", () => {
    expect(deploymentStageLabel(false, "AWAITING LACE SUBMISSION", "AWAITING LACE SUBMISSION")).toBe(
      "FAILED AT: AWAITING LACE SUBMISSION"
    );
  });
});
