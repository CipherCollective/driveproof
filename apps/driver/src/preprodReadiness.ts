import type { AttestorHealthStatus } from "@driveproof/attestor-client";
import type { ProofServerStatus } from "@driveproof/midnight-runtime";
import type { WalletConnectionState } from "@driveproof/midnight-wallet";

export type ReadinessTone = "good" | "bad" | "neutral";

export type ReadinessPresentation = {
  label: string;
  detail?: string;
  tone: ReadinessTone;
};

export function laceReadiness(detected: boolean): ReadinessPresentation {
  return detected
    ? { label: "DETECTED", tone: "good" }
    : { label: "MISSING", tone: "bad" };
}

export function walletReadiness(connection: WalletConnectionState): ReadinessPresentation {
  if (connection.status === "connected") return { label: "CONNECTED", tone: "good" };
  if (connection.status === "connecting") return { label: "CONNECTING", tone: "neutral" };
  return { label: "DISCONNECTED", tone: "neutral" };
}

export function networkReadiness(
  connection: WalletConnectionState,
  expectedNetwork: string
): ReadinessPresentation {
  const expectedLabel = expectedNetwork.toUpperCase();

  if (connection.status === "connected") {
    return connection.network === expectedNetwork
      ? { label: expectedLabel, tone: "good" }
      : {
          label: "WRONG NETWORK",
          detail: `reported ${connection.network} · expected ${expectedNetwork}`,
          tone: "bad"
        };
  }

  if (connection.status === "wrong-network") {
    return {
      label: "WRONG NETWORK",
      detail: `reported ${connection.network} · expected ${connection.expectedNetwork}`,
      tone: "bad"
    };
  }

  return {
    label: "NOT VALIDATED",
    detail: `connect Lace to validate ${expectedNetwork}`,
    tone: "neutral"
  };
}

export function proofServerReadiness(status: ProofServerStatus | "checking"): ReadinessPresentation {
  if (status === "checking") return { label: "CHECKING", tone: "neutral" };
  if (status.status === "reachable") {
    return { label: `LOCAL ${status.version}`, detail: status.url, tone: "good" };
  }
  if (status.status === "incompatible") {
    return {
      label: "WRONG VERSION",
      detail: `expected ${status.expectedVersion} · actual ${status.version ?? "unknown"}`,
      tone: "bad"
    };
  }
  if (status.status === "unavailable") {
    return { label: "UNAVAILABLE", detail: status.message, tone: "bad" };
  }

  return { label: "UNAVAILABLE", tone: "bad" };
}

export function attestorReadiness(status: AttestorHealthStatus | "checking"): ReadinessPresentation {
  if (status === "checking") return { label: "CHECKING", tone: "neutral" };
  if (status.status === "ready") {
    return {
      label: "READY",
      detail: status.providerId === undefined ? status.url : `provider ${status.providerId} · ${status.url}`,
      tone: "good"
    };
  }
  if (status.status === "unavailable") {
    return { label: "UNAVAILABLE", detail: status.message, tone: "bad" };
  }

  return { label: "UNAVAILABLE", tone: "bad" };
}

export function safeAttestationReadiness(loaded: boolean): ReadinessPresentation {
  return loaded
    ? { label: "LOADED", tone: "good" }
    : { label: "NOT LOADED", tone: "neutral" };
}
