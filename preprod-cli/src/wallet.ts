import { WebSocket } from "ws";
import * as ledger from "@midnight-ntwrk/midnight-js-protocol/ledger";
import {
  DustWallet,
  HDWallet,
  InMemoryTransactionHistoryStorage,
  Roles,
  ShieldedWallet,
  UnshieldedWallet,
  WalletEntrySchema,
  WalletFacade,
  createKeystore,
  PublicKey as UnshieldedPublicKey,
  type UnshieldedKeystore
} from "@midnight-ntwrk/wallet-sdk";
import type { UnboundTransaction } from "@midnight-ntwrk/midnight-js-types";
import type { PreprodCliConfig } from "./config.js";

const globalWithWebSocket = globalThis as typeof globalThis & { WebSocket: typeof WebSocket };
// The wallet SDK's Apollo transport needs the Node ws implementation. Its
// constructor is intentionally not identical to the browser DOM WebSocket.
// @ts-expect-error Node ws is the runtime WebSocket implementation for this CLI.
globalWithWebSocket.WebSocket = WebSocket;

export type WalletMaterial = {
  shieldedSecretKeys: ledger.ZswapSecretKeys;
  dustSecretKey: ledger.DustSecretKey;
  unshieldedKeystore: UnshieldedKeystore;
};

export type PreprodWallet = WalletMaterial & {
  facade: WalletFacade;
};

export type WalletBalances = {
  night: bigint;
  dust: bigint;
};

export function deriveWalletMaterial(seed: Uint8Array, networkId: string): WalletMaterial {
  const hdResult = HDWallet.fromSeed(seed);
  if (hdResult.type !== "seedOk") {
    throw new Error("The wallet seed could not be decoded.");
  }

  try {
    const keyResult = hdResult.hdWallet
      .selectAccount(0)
      .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust] as const)
      .deriveKeysAt(0);
    if (keyResult.type !== "keysDerived") {
      throw new Error("The fresh wallet key derivation was out of bounds.");
    }

    return {
      shieldedSecretKeys: ledger.ZswapSecretKeys.fromSeed(keyResult.keys[Roles.Zswap]),
      dustSecretKey: ledger.DustSecretKey.fromSeed(keyResult.keys[Roles.Dust]),
      unshieldedKeystore: createKeystore(
        keyResult.keys[Roles.NightExternal],
        networkId as Parameters<typeof createKeystore>[1]
      )
    };
  } finally {
    hdResult.hdWallet.clear();
  }
}

export async function walletMaterialFromMnemonic(
  mnemonic: string,
  networkId: string
): Promise<WalletMaterial> {
  const { mnemonicToSeed, validateMnemonic } = await import("@scure/bip39");
  const { wordlist } = await import("@scure/bip39/wordlists/english.js");
  const normalizedMnemonic = mnemonic.trim().replace(/\s+/g, " ");
  if (!validateMnemonic(normalizedMnemonic, wordlist)) {
    throw new Error("WALLET_MNEMONIC is not a valid English BIP-39 mnemonic.");
  }
  return deriveWalletMaterial(await mnemonicToSeed(normalizedMnemonic), networkId);
}

function createWalletConfigurations(config: PreprodCliConfig) {
  const relayURL = new URL(config.node.replace(/^http/, "ws"));
  const indexerClientConnection = {
    indexerHttpUrl: config.indexer,
    indexerWsUrl: config.indexerWS
  };
  const shielded = {
    networkId: config.networkId,
    indexerClientConnection,
    provingServerUrl: new URL(config.proofServer),
    relayURL,
    txHistoryStorage: new InMemoryTransactionHistoryStorage(WalletEntrySchema)
  };
  const unshielded = {
    networkId: config.networkId,
    indexerClientConnection,
    txHistoryStorage: new InMemoryTransactionHistoryStorage(WalletEntrySchema)
  };
  const dust = {
    networkId: config.networkId,
    costParameters: {
      additionalFeeOverhead: 300_000_000_000_000n,
      feeBlocksMargin: 5
    },
    indexerClientConnection,
    provingServerUrl: new URL(config.proofServer),
    relayURL,
    txHistoryStorage: new InMemoryTransactionHistoryStorage(WalletEntrySchema)
  };

  return { shielded, unshielded, dust, unified: { ...shielded, ...unshielded, ...dust } };
}

export async function startPreprodWallet(
  material: WalletMaterial,
  config: PreprodCliConfig
): Promise<PreprodWallet> {
  const configurations = createWalletConfigurations(config);
  const unshieldedPublicKey = UnshieldedPublicKey.fromKeyStore(material.unshieldedKeystore);
  const facade = await WalletFacade.init({
    configuration: configurations.unified,
    shielded: () => ShieldedWallet(configurations.shielded).startWithSecretKeys(material.shieldedSecretKeys),
    unshielded: () => UnshieldedWallet(configurations.unshielded).startWithPublicKey(unshieldedPublicKey),
    dust: () => DustWallet(configurations.dust).startWithSecretKey(
      material.dustSecretKey,
      ledger.LedgerParameters.initialParameters().dust
    )
  });

  await facade.start(material.shieldedSecretKeys, material.dustSecretKey);
  return { ...material, facade };
}

export function walletAddress(wallet: PreprodWallet): string {
  return wallet.unshieldedKeystore.getBech32Address().asString();
}

export async function waitForSyncedWallet(wallet: PreprodWallet) {
  return wallet.facade.waitForSyncedState();
}

export async function readWalletBalances(wallet: PreprodWallet): Promise<WalletBalances> {
  const state = await waitForSyncedWallet(wallet);
  const nativeToken = ledger.nativeToken().raw;
  return {
    night: (state.unshielded.balances[nativeToken] ?? 0n) + (state.shielded.balances[nativeToken] ?? 0n),
    dust: state.dust.balance(new Date())
  };
}

export function createMidnightWalletProviders(wallet: PreprodWallet) {
  return {
    walletProvider: {
      getCoinPublicKey: () => wallet.shieldedSecretKeys.coinPublicKey,
      getEncryptionPublicKey: () => wallet.shieldedSecretKeys.encryptionPublicKey,
      balanceTx: async (tx: UnboundTransaction, ttl = new Date(Date.now() + 30 * 60 * 1000)) => {
        const recipe = await wallet.facade.balanceUnboundTransaction(
          tx,
          {
            shieldedSecretKeys: wallet.shieldedSecretKeys,
            dustSecretKey: wallet.dustSecretKey
          },
          { ttl }
        );
        return wallet.facade.finalizeRecipe(recipe);
      }
    },
    midnightProvider: {
      submitTx: (tx: ledger.FinalizedTransaction) => wallet.facade.submitTransaction(tx)
    }
  };
}

export async function registerNightForDust(wallet: PreprodWallet): Promise<string | undefined> {
  const state = await waitForSyncedWallet(wallet);
  const currentDust = state.dust.balance(new Date());
  if (currentDust > 0n) return undefined;

  const nightUtxos = state.unshielded.availableCoins.filter(
    ({ meta }) => !meta.registeredForDustGeneration
  );
  if (nightUtxos.length === 0) {
    throw new Error("No unregistered tNIGHT UTxO is available to register for tDUST generation.");
  }

  const recipe = await wallet.facade.registerNightUtxosForDustGeneration(
    nightUtxos,
    wallet.unshieldedKeystore.getPublicKey(),
    (payload) => wallet.unshieldedKeystore.signData(payload)
  );
  const finalized = await wallet.facade.finalizeRecipe(recipe);
  return wallet.facade.submitTransaction(finalized);
}

export async function waitForDust(wallet: PreprodWallet, timeoutMs = 120_000): Promise<bigint> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const balances = await readWalletBalances(wallet);
    if (balances.dust > 0n) return balances.dust;
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  throw new Error(`Timed out waiting for tDUST generation after ${timeoutMs} ms.`);
}
