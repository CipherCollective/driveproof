import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { config as loadEnv } from "dotenv";
import { generateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { deployContract, findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { DriveProof, generateDriverSecret } from "driveproof-contract";
import {
  ENV_PATH,
  PREPROD_FAUCET_URL,
  readPreprodConfig
} from "./config.js";
import {
  ATTESTOR_ID,
  ATTESTOR_PUBLIC_KEY,
  BRAKING_LIMIT,
  GEOFENCE_MAX_X,
  GEOFENCE_MAX_Y,
  GEOFENCE_MIN_X,
  GEOFENCE_MIN_Y,
  PRIVATE_STATE_ID,
  SPEED_LIMIT,
  createCompiledDriveProof,
  createDriveProofProviders
} from "./providers.js";
import {
  readWalletBalances,
  registerNightForDust,
  startPreprodWallet,
  waitForDust,
  walletAddress,
  walletMaterialFromMnemonic
} from "./wallet.js";
import { requestAttestorPrivateState, maxSampleSpeed } from "./attestor.js";

function readLocalEnvValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function generatedStoragePassword(): string {
  return `DriveProof!${randomBytes(24).toString("base64url")}9`;
}

async function prepareWallet(): Promise<void> {
  if (existsSync(ENV_PATH)) {
    const current = readFileSync(ENV_PATH, "utf8");
    if (/^WALLET_MNEMONIC=\S/m.test(current)) {
      throw new Error(`Refusing to overwrite an existing wallet secret at ${ENV_PATH}.`);
    }
    throw new Error(`Remove or move the existing ${ENV_PATH} manually, then rerun wallet preparation.`);
  }

  const config = readPreprodConfig();
  const mnemonic = generateMnemonic(wordlist, 256);
  const material = await walletMaterialFromMnemonic(mnemonic, config.networkId);
  const address = material.unshieldedKeystore.getBech32Address().asString();
  const contents = [
    "# Generated locally by @driveproof/preprod-cli. This file is gitignored.",
    `WALLET_MNEMONIC=${mnemonic}`,
    `MIDNIGHT_STORAGE_PASSWORD=${generatedStoragePassword()}`,
    "DRIVEPROOF_ATTESTOR_URL=http://localhost:4000",
    "MIDNIGHT_PROOF_SERVER=http://localhost:6300",
    ""
  ].join("\n");

  writeFileSync(ENV_PATH, contents, { encoding: "utf8", flag: "wx", mode: 0o600 });
  console.log("PREPARED FRESH MIDNIGHT PREPROD WALLET");
  console.log(`Wallet address: ${address}`);
  console.log(`Funding source: ${PREPROD_FAUCET_URL}`);
  console.log("Fund this address with tNIGHT and tDUST. If only tNIGHT is funded, the CLI can register it for tDUST generation.");
  console.log(`Secret material is stored only in ${path.relative(process.cwd(), ENV_PATH)} (gitignored); the mnemonic was not printed.`);
  console.log("Resume with: npm run preprod --workspace @driveproof/preprod-cli");
}

function requireSecret(name: string): string {
  const value = readLocalEnvValue(name);
  if (!value) throw new Error(`${name} is missing. Run npm run prepare-wallet --workspace @driveproof/preprod-cli first.`);
  return value;
}

async function runRealPath(): Promise<void> {
  const config = readPreprodConfig();
  setNetworkId(config.networkId);

  const mnemonic = requireSecret("WALLET_MNEMONIC");
  const storagePassword = requireSecret("MIDNIGHT_STORAGE_PASSWORD");
  const material = await walletMaterialFromMnemonic(mnemonic, config.networkId);
  const wallet = await startPreprodWallet(material, config);

  try {
    const address = walletAddress(wallet);
    let balances = await readWalletBalances(wallet);
    console.log("MIDNIGHT PREPROD CLI WALLET");
    console.log(`Wallet address: ${address}`);
    console.log(`tNIGHT balance: ${balances.night.toString()}`);
    console.log(`tDUST balance: ${balances.dust.toString()}`);

    if (balances.night === 0n && balances.dust === 0n) {
      console.log("MANUAL ACTION REQUIRED");
      console.log(`- wallet address: ${address}`);
      console.log(`- faucet: ${PREPROD_FAUCET_URL}`);
      console.log("- fund this fresh address with tNIGHT and tDUST, or tNIGHT sufficient for the official dust-registration step");
      console.log("- after funding, rerun: npm run preprod --workspace @driveproof/preprod-cli");
      return;
    }

    if (balances.dust === 0n) {
      console.log("tDUST is empty; registering available tNIGHT UTxOs for dust generation.");
      const registrationTx = await registerNightForDust(wallet);
      if (registrationTx) console.log(`Dust registration tx: ${registrationTx}`);
      balances = { ...balances, dust: await waitForDust(wallet) };
      console.log(`tDUST balance after registration: ${balances.dust.toString()}`);
    }

    const driverSecretKey = generateDriverSecret();
    const attestation = await requestAttestorPrivateState(config.attestorUrl, "safe", driverSecretKey);
    if (maxSampleSpeed(attestation.samples) !== 67) {
      throw new Error(`Expected the safe attestor trip max speed 67, received ${maxSampleSpeed(attestation.samples)}.`);
    }
    console.log("Safe attestation: 16 samples, max speed 67");

    const compiledContract = createCompiledDriveProof(config);
    const providers = createDriveProofProviders(wallet, config, storagePassword);
    console.log("Deploying DriveProof to Midnight Preprod.");
    const deployed = await deployContract(providers, {
      compiledContract,
      args: [
        SPEED_LIMIT,
        BRAKING_LIMIT,
        GEOFENCE_MIN_X,
        GEOFENCE_MIN_Y,
        GEOFENCE_MAX_X,
        GEOFENCE_MAX_Y,
        ATTESTOR_ID,
        ATTESTOR_PUBLIC_KEY,
      ],
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: attestation
    });
    const deployment = deployed.deployTxData.public;
    console.log(`Contract address: ${deployment.contractAddress}`);
    console.log(`Deployment tx: ${deployment.txId}`);
    console.log(`Deployment status: ${deployment.status}`);
    if (deployment.blockHeight !== undefined) console.log(`Deployment block: ${deployment.blockHeight}`);

    const joined = await findDeployedContract(providers, {
      compiledContract,
      contractAddress: deployment.contractAddress,
      privateStateId: PRIVATE_STATE_ID
    });
    await providers.privateStateProvider.set(PRIVATE_STATE_ID, attestation);
    console.log("Proving and submitting safe compliance proof.");
    const proof = await joined.callTx.proveCompliance();
    console.log(`Safe proof tx: ${proof.public.txId}`);
    const safeCount = await readComplianceCount(providers, deployment.contractAddress, "After safe proof");
    if (safeCount !== 1n) throw new Error(`Expected complianceCount 1 after safe proof, received ${safeCount.toString()}.`);

    const unsafe = await requestAttestorPrivateState(config.attestorUrl, "unsafe", driverSecretKey);
    if (maxSampleSpeed(unsafe.samples) !== 112) {
      throw new Error(`Expected the unsafe attestor trip max speed 112, received ${maxSampleSpeed(unsafe.samples)}.`);
    }
    await providers.privateStateProvider.set(PRIVATE_STATE_ID, unsafe);
    await expectProofRejection(
      "UNSAFE RESULT",
      () => joined.callTx.proveCompliance(),
      "Speed exceeds policy limit",
    );
    const countAfterUnsafe = await readComplianceCount(providers, deployment.contractAddress, "After unsafe rejection");
    if (countAfterUnsafe !== 1n) {
      throw new Error(`Expected complianceCount 1 after unsafe rejection, received ${countAfterUnsafe.toString()}.`);
    }

    const outOfGeofence = await requestAttestorPrivateState(config.attestorUrl, "out-of-geofence", driverSecretKey);
    if (outOfGeofence.samples[7]?.gridX !== 400n) {
      throw new Error("Expected out-of-geofence trip sample 7 gridX 400.");
    }
    await providers.privateStateProvider.set(PRIVATE_STATE_ID, outOfGeofence);
    await expectProofRejection(
      "GEOFENCE RESULT",
      () => joined.callTx.proveCompliance(),
      "Sample outside policy geofence",
    );
    const countAfterGeofence = await readComplianceCount(providers, deployment.contractAddress, "After geofence rejection");
    if (countAfterGeofence !== 1n) {
      throw new Error(`Expected complianceCount 1 after geofence rejection, received ${countAfterGeofence.toString()}.`);
    }

    await providers.privateStateProvider.set(PRIVATE_STATE_ID, {
      ...unsafe,
      samples: unsafe.samples.map((sample, index) =>
        index === 6 ? { ...sample, speed: 71n } : sample,
      ),
    });
    await expectProofRejection(
      "TAMPER RESULT",
      () => joined.callTx.proveCompliance(),
      "Invalid attestation signature",
    );
    const countAfterTamper = await readComplianceCount(providers, deployment.contractAddress, "After tamper rejection");
    if (countAfterTamper !== 1n) {
      throw new Error(`Expected complianceCount 1 after tamper rejection, received ${countAfterTamper.toString()}.`);
    }

    const wrongDriverSecret = generateDriverSecret();
    await providers.privateStateProvider.set(PRIVATE_STATE_ID, {
      ...attestation,
      driverSecretKey: wrongDriverSecret,
    });
    await expectProofRejection(
      "WRONG BINDING RESULT",
      () => joined.callTx.proveCompliance(),
      "Invalid attestation signature",
    );
    const countAfterWrongBinding = await readComplianceCount(providers, deployment.contractAddress, "After wrong-binding rejection");
    if (countAfterWrongBinding !== 1n) {
      throw new Error(`Expected complianceCount 1 after wrong-binding rejection, received ${countAfterWrongBinding.toString()}.`);
    }

    await providers.privateStateProvider.set(PRIVATE_STATE_ID, attestation);
    await expectProofRejection(
      "REPLAY RESULT",
      () => joined.callTx.proveCompliance(),
      "Attestation already used",
    );
    const countAfterReplay = await readComplianceCount(providers, deployment.contractAddress, "After replay rejection");
    if (countAfterReplay !== 1n) {
      throw new Error(`Expected complianceCount 1 after replay rejection, received ${countAfterReplay.toString()}.`);
    }

    console.log("PREPROD CRYPTO ACCEPTANCE PASSED");
    console.log("- safe proof succeeded");
    console.log("- replay rejected without incrementing complianceCount");
    console.log("- wrong driver binding rejected");
    console.log("- unsafe rejected without consuming nullifier");
    console.log("- geofence violation rejected without consuming nullifier");
    console.log("- tamper rejected without consuming nullifier");
  } finally {
    await wallet.facade.stop();
  }
}

function safeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const tag = typeof record.tag === "string" ? record.tag : undefined;
    const message = typeof record.message === "string" ? record.message : undefined;
    if (tag && message) return `${tag}: ${message}`;
    if (message) return message;
    if (tag) return tag;
  }
  return "Unknown error";
}

async function expectProofRejection(
  label: string,
  action: () => Promise<unknown>,
  expectedFragment: string,
): Promise<void> {
  try {
    await action();
    throw new Error(`${label}: unexpectedly accepted by the real contract.`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("unexpectedly accepted")) {
      throw error;
    }
    const message = safeError(error);
    console.log(`${label}: rejected (${message}).`);
    if (!message.includes(expectedFragment)) {
      throw new Error(`${label}: expected rejection containing "${expectedFragment}", received "${message}".`);
    }
  }
}

async function readComplianceCount(
  providers: Awaited<ReturnType<typeof createDriveProofProviders>>,
  contractAddress: string,
  label: string,
): Promise<bigint> {
  const state = await providers.publicDataProvider.queryContractState(contractAddress);
  if (!state) throw new Error(`The indexer did not return contract state for ${label}.`);
  const count = DriveProof.ledger(state.data).complianceCount;
  console.log(`${label} complianceCount: ${count.toString()}`);
  return count;
}

async function main(): Promise<void> {
  loadEnv({ path: ENV_PATH });
  if (process.argv.includes("--prepare-wallet")) {
    setNetworkId("preprod");
    await prepareWallet();
    return;
  }
  await runRealPath();
}

main().catch((error) => {
  console.error(`Preprod CLI stopped: ${safeError(error)}`);
  process.exitCode = 1;
});
