import { computeDriverBinding, generateDriverSecret } from "driveproof-contract";

const ATTESTOR_PUBLIC_KEY = {
  x: 24963340820686704563874210959139693074205807300853579178326830224576306549782n,
  y: 13555256131498264457493147271978939536039390820876751212247441513267437911171n
};

function tripMaxSpeed(samples) {
  return Math.max(...samples.map((sample) => Number(sample.speed)));
}

function fail(message) {
  console.error(`VERIFY FAILED: ${message}`);
  process.exit(1);
}

async function readJson(response, endpoint) {
  if (!response.ok) fail(`Attestor ${endpoint} returned HTTP ${response.status}.`);
  return response.json();
}

async function requestTrip(baseUrl, tripId, driverSecretKey) {
  const driverBinding = computeDriverBinding(driverSecretKey);
  const providerInfo = await readJson(await fetch(`${baseUrl}/provider-info`), "/provider-info");
  const attestation = await readJson(
    await fetch(`${baseUrl}/attest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId, driverBinding: driverBinding.toString() })
    }),
    "/attest"
  );
  return { providerInfo, attestation, driverBinding };
}

async function main() {
  const baseUrl = (process.env.DRIVEPROOF_ATTESTOR_URL || "http://localhost:4000").replace(/\/$/, "");
  const health = await fetch(`${baseUrl}/health`);
  if (!health.ok) fail(`Attestor /health returned HTTP ${health.status}.`);

  const { providerInfo, attestation: safeBody, driverBinding } = await requestTrip(
    baseUrl,
    "safe",
    generateDriverSecret()
  );

  const pkX = BigInt(providerInfo.publicKey?.x ?? fail("Missing provider public key x."));
  const pkY = BigInt(providerInfo.publicKey?.y ?? fail("Missing provider public key y."));
  if (pkX !== ATTESTOR_PUBLIC_KEY.x || pkY !== ATTESTOR_PUBLIC_KEY.y) {
    fail("Attestor public key does not match preprod deploy constants.");
  }

  if (!Array.isArray(safeBody.message.samples) || safeBody.message.samples.length !== 16) {
    fail("Safe attestation is missing 16 telemetry samples.");
  }
  if (tripMaxSpeed(safeBody.message.samples) !== 67) {
    fail(`Safe trip max speed ${tripMaxSpeed(safeBody.message.samples)}, expected 67.`);
  }
  if (!safeBody.message.attestationId) fail("Safe attestation is missing attestationId.");
  if (!safeBody.message.salt) fail("Safe attestation is missing salt.");
  if (!safeBody.message.tripCommitment) fail("Safe attestation is missing tripCommitment.");

  const driverSecretKey = generateDriverSecret();
  const unsafe = await requestTrip(baseUrl, "unsafe", driverSecretKey);
  if (tripMaxSpeed(unsafe.attestation.message.samples) !== 112) {
    fail(`Unsafe trip max speed ${tripMaxSpeed(unsafe.attestation.message.samples)}, expected 112.`);
  }
  if (unsafe.attestation.message.attestationId === safeBody.message.attestationId) {
    fail("Attestor reused attestationId across trips.");
  }

  console.log("ATTESTOR VERIFY OK");
  console.log(`url: ${baseUrl}`);
  console.log(`providerId: ${providerInfo.providerId ?? "unknown"}`);
  console.log(`driverBinding: ${driverBinding.toString()}`);
  console.log(`safe attestationId: ${safeBody.message.attestationId}`);
  console.log(`unsafe attestationId: ${unsafe.attestation.message.attestationId}`);
}

main().catch((error) => {
  console.error(`VERIFY FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
