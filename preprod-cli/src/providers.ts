import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import type { Contract as MidnightContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import type { MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import { DriveProof, witnesses, type DriveProofPrivateState } from "driveproof-contract";
import type { PreprodCliConfig } from "./config.js";
import { createMidnightWalletProviders, type PreprodWallet } from "./wallet.js";

export const PRIVATE_STATE_ID = "driveproofPrivateState" as const;
export const SPEED_LIMIT = 80n;
export const ATTESTOR_ID = 1n;
/** On-chain policy identifier passed to proveCompliance(policyId). */
export const ON_CHAIN_POLICY_ID = 1n;
export const ATTESTOR_PUBLIC_KEY = {
  x: 24963340820686704563874210959139693074205807300853579178326830224576306549782n,
  y: 13555256131498264457493147271978939536039390820876751212247441513267437911171n
} as const;

export type DriveProofContract = DriveProof.Contract<DriveProofPrivateState>;
export type DriveProofCircuitId = MidnightContract.ProvableCircuitId<DriveProofContract>;
export type DriveProofProviders = MidnightProviders<
  DriveProofCircuitId,
  typeof PRIVATE_STATE_ID,
  DriveProofPrivateState
>;

export function createCompiledDriveProof(config: PreprodCliConfig) {
  return CompiledContract.make<DriveProofContract, DriveProofPrivateState>("DriveProof", DriveProof.Contract).pipe(
    CompiledContract.withWitnesses(witnesses),
    CompiledContract.withCompiledFileAssets(config.zkConfigPath)
  );
}

export function createDriveProofProviders(
  wallet: PreprodWallet,
  config: PreprodCliConfig,
  storagePassword: string
): DriveProofProviders {
  const walletProviders = createMidnightWalletProviders(wallet);
  const zkConfigProvider = new NodeZkConfigProvider<DriveProofCircuitId>(config.zkConfigPath);
  return {
    privateStateProvider: levelPrivateStateProvider<typeof PRIVATE_STATE_ID, DriveProofPrivateState>({
      midnightDbName: config.privateStateDbName,
      privateStateStoreName: config.privateStateStoreName,
      signingKeyStoreName: config.signingKeyStoreName,
      privateStoragePasswordProvider: () => storagePassword,
      accountId: walletAddressForStorage(wallet)
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: walletProviders.walletProvider,
    midnightProvider: walletProviders.midnightProvider
  };
}

function walletAddressForStorage(wallet: PreprodWallet): string {
  return wallet.unshieldedKeystore.getBech32Address().asString();
}
