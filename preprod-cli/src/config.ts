import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const CLI_ROOT = path.resolve(currentDir, "..");
export const REPO_ROOT = path.resolve(CLI_ROOT, "..");
export const ENV_PATH = path.join(CLI_ROOT, ".env");
export const PREPROD_FAUCET_URL = "https://midnight-tmnight-preprod.nethermind.dev/";

export type PreprodCliConfig = {
  networkId: "preprod";
  indexer: string;
  indexerWS: string;
  node: string;
  proofServer: string;
  attestorUrl: string;
  zkConfigPath: string;
  privateStateStoreName: string;
  privateStateDbName: string;
  signingKeyStoreName: string;
};

/**
 * These endpoints mirror the current official Midnight Preprod CLI examples.
 * Only the proof server and attestor are local, operator-configurable services.
 */
export function readPreprodConfig(): PreprodCliConfig {
  return {
    networkId: "preprod",
    indexer: "https://indexer.preprod.midnight.network/api/v4/graphql",
    indexerWS: "wss://indexer.preprod.midnight.network/api/v4/graphql/ws",
    node: "wss://rpc.preprod.midnight.network",
    proofServer: process.env.MIDNIGHT_PROOF_SERVER?.trim() || "http://localhost:6300",
    attestorUrl: process.env.DRIVEPROOF_ATTESTOR_URL?.trim() || "http://localhost:4000",
    zkConfigPath: path.join(REPO_ROOT, "contract", "src", "managed", "driveproof"),
    privateStateStoreName: "driveproof-preprod-private-state",
    privateStateDbName: "driveproof-preprod-wallet",
    signingKeyStoreName: "driveproof-preprod-signing-keys"
  };
}
