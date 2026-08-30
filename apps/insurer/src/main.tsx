import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createDriveProofClient } from "@driveproof/driveproof-client";
import type { ProofResult, PublicProofReceipt } from "@driveproof/types";
import App from "./App";
import "../../../shared/styles.css";

const requestedMode = import.meta.env.VITE_DRIVEPROOF_CLIENT_MODE === "midnight" ? "midnight" : "mock";
const driveProofClient = createDriveProofClient(requestedMode);

function readPublicReceiptResult(): ProofResult | undefined {
  const encodedReceipt = new URLSearchParams(window.location.search).get("receipt");
  if (!encodedReceipt) return undefined;

  try {
    const candidate: unknown = JSON.parse(encodedReceipt);
    if (!candidate || typeof candidate !== "object") return undefined;
    const record = candidate as Record<string, unknown>;
    if (record.status !== "verified" || typeof record.transactionId !== "string" || !record.transactionId) return undefined;

    const receipt: PublicProofReceipt = {
      status: "verified",
      transactionId: record.transactionId,
      ...(typeof record.network === "string" ? { network: record.network } : {}),
      ...(typeof record.blockHeight === "number" ? { blockHeight: record.blockHeight } : {}),
      ...(typeof record.contractAddress === "string" ? { contractAddress: record.contractAddress } : {}),
      ...(record.complianceStatus === "satisfied" ? { complianceStatus: "satisfied" as const } : {}),
      ...(typeof record.policyId === "string" ? { policyId: record.policyId } : {}),
      ...(typeof record.attestorId === "string" ? { attestorId: record.attestorId } : {}),
      ...(typeof record.nullifier === "string" ? { nullifier: record.nullifier } : {})
    };
    return { status: "verified", receipt };
  } catch {
    return undefined;
  }
}

const publicResult = readPublicReceiptResult();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App client={driveProofClient} publicResult={publicResult} />
  </StrictMode>
);
