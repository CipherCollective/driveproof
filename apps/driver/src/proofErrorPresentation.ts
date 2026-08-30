export type ExpectedProofRejection = {
  kind: "policy" | "integrity" | "replay";
  eyebrow: "REJECTED AS EXPECTED";
  heading: "Policy violation" | "Integrity violation" | "Replay protection";
  description: string;
  technicalDetail: string;
};

const POLICY_ASSERTION = "Speed exceeds policy limit";
const BRAKING_ASSERTION = "Harsh braking exceeds policy limit";
const GEOFENCE_ASSERTION = "Sample outside policy geofence";
const INTEGRITY_ASSERTION = "Invalid attestation signature";
const REPLAY_ASSERTION = "Attestation already used";

const policyRejection: ExpectedProofRejection = {
  kind: "policy",
  eyebrow: "REJECTED AS EXPECTED",
  heading: "Policy violation",
  description: "The attested telemetry exceeds the insurer's safety policy.",
  technicalDetail: `failed assert: ${POLICY_ASSERTION}`
};

const integrityRejection: ExpectedProofRejection = {
  kind: "integrity",
  eyebrow: "REJECTED AS EXPECTED",
  heading: "Integrity violation",
  description: "The private witness no longer matches the authorized issuer's signature.",
  technicalDetail: `failed assert: ${INTEGRITY_ASSERTION}`
};

const replayRejection: ExpectedProofRejection = {
  kind: "replay",
  eyebrow: "REJECTED AS EXPECTED",
  heading: "Replay protection",
  description: "This attestation has already been used.",
  technicalDetail: `failed assert: ${REPLAY_ASSERTION}`
};

const brakingRejection: ExpectedProofRejection = {
  kind: "policy",
  eyebrow: "REJECTED AS EXPECTED",
  heading: "Policy violation",
  description: "The attested trip contains more harsh-braking events than the policy allows.",
  technicalDetail: `failed assert: ${BRAKING_ASSERTION}`
};

const geofenceRejection: ExpectedProofRejection = {
  kind: "policy",
  eyebrow: "REJECTED AS EXPECTED",
  heading: "Policy violation",
  description: "The attested trip leaves the policy's allowed operating area.",
  technicalDetail: `failed assert: ${GEOFENCE_ASSERTION}`
};

function collectMessages(value: unknown, messages: string[], visited: Set<object>, depth = 0): void {
  if (depth > 5 || value === null || value === undefined) return;

  if (typeof value === "string") {
    if (value.length > 0) messages.push(value);
    return;
  }

  if (typeof value !== "object") return;
  if (visited.has(value)) return;
  visited.add(value);

  const record = value as Record<string, unknown>;
  if (typeof record.message === "string" && record.message.length > 0) {
    messages.push(record.message);
  }

  collectMessages(record.cause, messages, visited, depth + 1);
  collectMessages(record.error, messages, visited, depth + 1);
}

/**
 * Classifies only the contract assertions intentionally exercised by the demo.
 * Unknown runtime errors remain unclassified and should stay visible.
 */
export function classifyExpectedProofRejection(error: unknown): ExpectedProofRejection | undefined {
  const messages: string[] = [];
  collectMessages(error, messages, new Set<object>());

  if (messages.some((message) => message.includes(POLICY_ASSERTION))) {
    return policyRejection;
  }

  if (messages.some((message) => message.includes(BRAKING_ASSERTION))) {
    return brakingRejection;
  }

  if (messages.some((message) => message.includes(GEOFENCE_ASSERTION))) {
    return geofenceRejection;
  }

  if (messages.some((message) => message.includes(INTEGRITY_ASSERTION))) {
    return integrityRejection;
  }

  if (messages.some((message) => message.includes(REPLAY_ASSERTION))) {
    return replayRejection;
  }

  return undefined;
}
