import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { config as loadEnv } from "dotenv";
import { generateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { deployContract, findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { DriveProof } from "driveproof-contract";
import {
  ENV_PATH,
  PREPROD_FAUCET_URL,
  readPreprodConfig
} from "./config.js";
import {
  ATTESTOR_ID,
  ATTESTOR_PUBLIC_KEY,
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
import { requestAttestorPrivateState } from "./attestor.js";

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

    const attestation = await requestAttestorPrivateState(config.attestorUrl, "safe");
    if (attestation.speed !== 67n) {
      throw new Error(`Expected the safe attestor trip to return speed 67, received ${attestation.speed.toString()}.`);
    }
    console.log("Safe attestation: speed 67");

    const compiledContract = createCompiledDriveProof(config);
    const providers = createDriveProofProviders(wallet, config, storagePassword);
    console.log("Deploying DriveProof to Midnight Preprod.");
    const deployed = await deployContract(providers, {
      compiledContract,
      args: [SPEED_LIMIT, ATTESTOR_ID, ATTESTOR_PUBLIC_KEY],
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
    const stateAfterSafe = await providers.publicDataProvider.queryContractState(deployment.contractAddress);
    if (!stateAfterSafe) throw new Error("The indexer did not return the deployed contract state after the safe proof.");
    const safeCount = DriveProof.ledger(stateAfterSafe.data).complianceCount;
    console.log(`complianceCount: ${safeCount.toString()}`);
    if (safeCount !== 1n) throw new Error(`Expected complianceCount 1 after safe proof, received ${safeCount.toString()}.`);

    const unsafe = await requestAttestorPrivateState(config.attestorUrl, "unsafe");
    if (unsafe.speed !== 112n) throw new Error(`Expected the unsafe attestor trip to return speed 112, received ${unsafe.speed.toString()}.`);
    await providers.privateStateProvider.set(PRIVATE_STATE_ID, unsafe);
    try {
      await joined.callTx.proveCompliance();
      console.log("UNSAFE RESULT: unexpectedly accepted by the real contract.");
    } catch (error) {
      console.log(`UNSAFE RESULT: rejected (${safeError(error)}).`);
    }

    await providers.privateStateProvider.set(PRIVATE_STATE_ID, { ...unsafe, speed: 71n });
    try {
      await joined.callTx.proveCompliance();
      console.log("TAMPER RESULT: unexpectedly accepted by the real contract.");
    } catch (error) {
      console.log(`TAMPER RESULT: rejected (${safeError(error)}).`);
    }
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
