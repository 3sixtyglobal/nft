// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { requestIotaFromFaucetV0 } from "@iota/iota-sdk/faucet";
import { Guards, Is } from "@twin.org/core";
import { Bip39 } from "@twin.org/crypto";
import { Iota, type ISmartContractDeployments } from "@twin.org/dlt-iota";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { IotaIdentityConnector } from "@twin.org/identity-connector-iota";
import { nameof } from "@twin.org/nameof";
import {
	EntityStorageVaultConnector,
	initSchema,
	type VaultKey,
	type VaultSecret
} from "@twin.org/vault-connector-entity-storage";
import { VaultConnectorFactory } from "@twin.org/vault-models";
import dotenv from "dotenv";
import compiledDeployments from "../src/contracts/smartContractDeployments/smart-contract-deployments.json" with { type: "json" };

console.debug("Setting up test environment from .env and .env.dev files");

dotenv.config({
	path: [path.join(__dirname, ".env.dev"), path.join(__dirname, ".env")],
	quiet: true
});

Guards.stringValue("TestEnv", "TEST_NODE_ENDPOINT", process.env.TEST_NODE_ENDPOINT);
Guards.stringValue("TestEnv", "TEST_COIN_TYPE", process.env.TEST_COIN_TYPE);
Guards.stringValue("TestEnv", "TEST_NETWORK", process.env.TEST_NETWORK);
Guards.stringValue("TestEnv", "TEST_EXPLORER_URL", process.env.TEST_EXPLORER_URL);
Guards.stringValue("TestEnv", "TEST_GAS_STATION_URL", process.env.TEST_GAS_STATION_URL);
Guards.stringValue(
	"TestEnv",
	"TEST_GAS_STATION_AUTH_TOKEN",
	process.env.TEST_GAS_STATION_AUTH_TOKEN
);

export const TEST_NODE_IDENTITY = "test-node-identity";
export const TEST_USER_IDENTITY = "test-user-identity";
export const TEST_USER_IDENTITY_2 = "test-user-identity-2";

/**
 * On-chain IOTA DIDs created during setupTestEnv() for use as controllerIdentity
 * in mint() calls. Populated after setupTestEnv() completes.
 */
export let TEST_USER_DID: string;
export let TEST_USER_DID_2: string;
export const TEST_MNEMONIC_NAME = "test-mnemonic";
export const TEST_NETWORK = process.env.TEST_NETWORK ?? "testnet";
export const TEST_NODE_MNEMONIC = process.env.TEST_NODE_MNEMONIC ?? Bip39.randomMnemonic();
export const TEST_MNEMONIC = process.env.TEST_MNEMONIC ?? Bip39.randomMnemonic();
export const TEST_2_MNEMONIC = process.env.TEST_2_MNEMONIC ?? Bip39.randomMnemonic();
export const TEST_NODE_ENDPOINT = process.env.TEST_NODE_ENDPOINT ?? "https://api.testnet.iota.cafe";
export const TEST_FAUCET_ENDPOINT = process.env.TEST_FAUCET_ENDPOINT;
export const TEST_EXPLORER_URL = process.env.TEST_EXPLORER_URL;
export const TEST_GAS_STATION_URL = process.env.TEST_GAS_STATION_URL;
export const TEST_GAS_STATION_AUTH_TOKEN = process.env.TEST_GAS_STATION_AUTH_TOKEN;
export const TEST_GAS_BUDGET = Number.parseInt(process.env.TEST_GAS_BUDGET ?? "50000000", 10);
export const TEST_COIN_TYPE = Number.parseInt(process.env.TEST_COIN_TYPE, 10);
export const TEST_GAS_STATION_ADDRESS = process.env.TEST_GAS_STATION_ADDRESS;

// Minimum balance required for tests (1 IOTA in nano units)
const MIN_BALANCE_REQUIRED = 1000000000n; // 1 IOTA = 1,000,000,000 nano IOTA

initSchema();

// Setup entity storage connectors
EntityStorageConnectorFactory.register(
	"vault-key",
	() =>
		new MemoryEntityStorageConnector<VaultKey>({
			entitySchema: nameof<VaultKey>(),
			config: { storageKey: "vault-key" }
		})
);

const secretEntityStorage = new MemoryEntityStorageConnector<VaultSecret>({
	entitySchema: nameof<VaultSecret>(),
	config: { storageKey: "vault-secret" }
});
EntityStorageConnectorFactory.register("vault-secret", () => secretEntityStorage);

// Setup vault connector
export const TEST_VAULT_CONNECTOR = new EntityStorageVaultConnector();
VaultConnectorFactory.register("vault", () => TEST_VAULT_CONNECTOR);

// Store mnemonics in vault for node identity
await TEST_VAULT_CONNECTOR.setSecret(
	`${TEST_NODE_IDENTITY}/${TEST_MNEMONIC_NAME}`,
	TEST_NODE_MNEMONIC
);

// Store mnemonics in vault for user identity
await TEST_VAULT_CONNECTOR.setSecret(`${TEST_USER_IDENTITY}/${TEST_MNEMONIC_NAME}`, TEST_MNEMONIC);

// Store mnemonics in vault for user identity 2
await TEST_VAULT_CONNECTOR.setSecret(
	`${TEST_USER_IDENTITY_2}/${TEST_MNEMONIC_NAME}`,
	TEST_2_MNEMONIC
);

// Setup client options
export const TEST_CLIENT_OPTIONS = {
	url: TEST_NODE_ENDPOINT
};

export const TEST_IOTA_CONFIG = {
	clientOptions: TEST_CLIENT_OPTIONS,
	network: TEST_NETWORK,
	coinType: TEST_COIN_TYPE,
	vaultMnemonicId: TEST_MNEMONIC_NAME
};

export const TEST_IDENTITY_CONNECTOR = new IotaIdentityConnector({
	config: {
		clientOptions: TEST_CLIENT_OPTIONS,
		network: TEST_NETWORK,
		vaultMnemonicId: TEST_MNEMONIC_NAME
	},
	vaultConnectorType: "vault"
});

const testAddresses = await Iota.getAddresses(
	TEST_VAULT_CONNECTOR,
	TEST_IOTA_CONFIG,
	TEST_USER_IDENTITY,
	0,
	0,
	1
);
const testAddresses2 = await Iota.getAddresses(
	TEST_VAULT_CONNECTOR,
	TEST_IOTA_CONFIG,
	TEST_USER_IDENTITY_2,
	0,
	0,
	1
);
const nodeAddresses = await Iota.getAddresses(
	TEST_VAULT_CONNECTOR,
	TEST_IOTA_CONFIG,
	TEST_NODE_IDENTITY,
	0,
	0,
	1
);

export const TEST_ADDRESS = testAddresses[0];
export const TEST_ADDRESS_2 = testAddresses2[0];
export const NODE_ADDRESS = nodeAddresses[0];

/**
 * Global variable to store test deployment configuration.
 * @internal
 */
let TEST_DEPLOYMENT_CONFIG: ISmartContractDeployments | undefined;

/**
 * Get the test deployment configuration.
 * @returns The test deployment configuration.
 * @throws When test deployment configuration is not available.
 */
export function getTestDeploymentConfig(): ISmartContractDeployments {
	if (!TEST_DEPLOYMENT_CONFIG) {
		throw new Error(
			"Test deployment configuration not available. Ensure setupTestEnv() has been called."
		);
	}
	return TEST_DEPLOYMENT_CONFIG;
}

/**
 * Setup the test environment.
 */
export async function setupTestEnv(): Promise<void> {
	await testFundGasStation();

	console.debug(
		"Test Address",
		`${TEST_EXPLORER_URL}address/${TEST_ADDRESS}?network=${TEST_NETWORK}`
	);
	console.debug(
		"Test Address 2",
		`${TEST_EXPLORER_URL}address/${TEST_ADDRESS_2}?network=${TEST_NETWORK}`
	);
	console.debug(
		"Node Address",
		`${TEST_EXPLORER_URL}address/${NODE_ADDRESS}?network=${TEST_NETWORK}`
	);

	console.debug("[setupTestEnv] Ensuring test addresses have sufficient funds");
	await ensureFundsForAddress(TEST_NODE_IDENTITY, NODE_ADDRESS);
	await ensureFundsForAddress(TEST_USER_IDENTITY, TEST_ADDRESS);
	await ensureFundsForAddress(TEST_USER_IDENTITY_2, TEST_ADDRESS_2);

	// Create on-chain IOTA Identities for test users. The vault already has the
	// mnemonic stored under TEST_USER_IDENTITY_ID, so createDocument() can derive
	// the signing keypair. We then also store the mnemonic under the DID key
	console.debug("[setupTestEnv] Creating on-chain IOTA Identities for test users");
	const userDoc = await TEST_IDENTITY_CONNECTOR.createDocument(TEST_USER_IDENTITY);
	TEST_USER_DID = userDoc.id;
	await TEST_VAULT_CONNECTOR.setSecret(`${TEST_USER_DID}/${TEST_MNEMONIC_NAME}`, TEST_MNEMONIC);
	console.debug("[setupTestEnv] TEST_USER_DID:", TEST_USER_DID);

	const user2Doc = await TEST_IDENTITY_CONNECTOR.createDocument(TEST_USER_IDENTITY_2);
	TEST_USER_DID_2 = user2Doc.id;
	await TEST_VAULT_CONNECTOR.setSecret(`${TEST_USER_DID_2}/${TEST_MNEMONIC_NAME}`, TEST_2_MNEMONIC);
	console.debug("[setupTestEnv] TEST_USER_DID_2:", TEST_USER_DID_2);

	TEST_DEPLOYMENT_CONFIG = compiledDeployments;
}

/**
 * Cleanup test environment and temporary files.
 */
export async function cleanupTestEnv(): Promise<void> {
	TEST_DEPLOYMENT_CONFIG = undefined;
}

/**
 * Ensure an address has sufficient funds for testing.
 * Only requests from faucet if current balance is below minimum required.
 * @param identity The identity to use for wallet operations.
 * @param address The address to ensure funds for.
 * @returns Promise that resolves when funds are ensured.
 */
async function ensureFundsForAddress(identity: string, address: string): Promise<void> {
	try {
		// Use ensureBalance which will automatically request from faucet if needed
		const success = await Iota.ensureBalance(
			TEST_IOTA_CONFIG,
			TEST_FAUCET_ENDPOINT,
			identity,
			address,
			MIN_BALANCE_REQUIRED,
			30
		);

		const currentBalance = await Iota.getBalance(TEST_IOTA_CONFIG, address);
		console.debug(
			`[ensureFundsForAddress] Address ${TEST_EXPLORER_URL}address/${address}?network=${TEST_NETWORK} has balance: ${currentBalance}`
		);

		if (!success) {
			console.warn(
				`Failed to ensure funds from faucet for address ${address}, requiredBalance: ${MIN_BALANCE_REQUIRED}, currentBalance: ${currentBalance}`
			);
		}
	} catch (error) {
		console.warn(
			`[setupTestEnv] Ignoring faucet error while funding ${address}. Continuing test setup.`,
			error
		);
	}
}

/**
 * Fund the gas station address from the faucet if the address is provided in the environment variables.
 */
async function testFundGasStation(): Promise<void> {
	// Fund the gas station if its address is provided
	if (Is.stringValue(TEST_GAS_STATION_ADDRESS) && Is.stringValue(TEST_FAUCET_ENDPOINT)) {
		try {
			const balance = await Iota.getBalance(
				{
					clientOptions: TEST_CLIENT_OPTIONS,
					network: TEST_NETWORK
				},
				TEST_GAS_STATION_ADDRESS
			);

			if (balance < 2000000000) {
				console.debug(
					"Requesting IOTA from faucet to fund gas station address:",
					`${TEST_EXPLORER_URL}address/${TEST_GAS_STATION_ADDRESS}?network=${TEST_NETWORK}`
				);
				const response = await requestIotaFromFaucetV0({
					host: TEST_FAUCET_ENDPOINT,
					recipient: TEST_GAS_STATION_ADDRESS
				});
				console.debug("Funded gas station address from faucet:", response);
			}
		} catch (error) {
			console.error("Failed to request IOTA from faucet:", error);
		}
		console.debug(
			"Gas station balance",
			await Iota.getBalance(
				{
					clientOptions: TEST_CLIENT_OPTIONS,
					network: TEST_NETWORK
				},
				TEST_GAS_STATION_ADDRESS
			)
		);
	}
}
