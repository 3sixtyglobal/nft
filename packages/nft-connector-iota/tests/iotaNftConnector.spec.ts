// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Urn } from "@twin.org/core";
import {
	TEST_CLIENT_OPTIONS,
	TEST_ADDRESS,
	TEST_ADDRESS_2,
	setupTestEnv,
	getTestDeploymentConfig,
	cleanupTestEnv,
	TEST_USER_DID,
	TEST_USER_DID_2,
	TEST_NETWORK,
	TEST_MNEMONIC_NAME,
	TEST_EXPLORER_URL
} from "./setupTestEnv.js";
import { IotaNftConnector } from "../src/iotaNftConnector.js";

let nftConnector: IotaNftConnector;

describe("IotaNftConnector", () => {
	beforeAll(async () => {
		await setupTestEnv();

		// Get the dynamically deployed test contracts
		const deploymentConfig = getTestDeploymentConfig();
		// Connector for deployment (using node/deployer mnemonic)
		nftConnector = new IotaNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				enableCostLogging: true,
				deploymentConfig
			}
		});
		// Start the connector with test-deployed packages
		await nftConnector.start();
	});

	afterAll(async () => {
		await cleanupTestEnv();
	});

	test("Cannot mint an NFT before start", async () => {
		const deploymentConfig = getTestDeploymentConfig();
		const unstartedConnector = new IotaNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				deploymentConfig
			}
		});
		await expect(unstartedConnector.mint(TEST_USER_DID, "test_tag")).rejects.toThrow(
			"iotaNftConnector.mintingFailed"
		);
	});

	test("Can mint an NFT with no data", async () => {
		const tag = "test_tag";
		const nftId = await nftConnector.mint(TEST_USER_DID, tag);
		const urn = Urn.fromValidString(nftId);
		expect(urn.namespaceIdentifier()).toEqual("nft");
		const specificParts = urn.namespaceSpecificParts();
		expect(specificParts[0]).toEqual("iota");
		expect(specificParts[1]).toEqual(TEST_NETWORK);
		expect(specificParts[2].length).toBeGreaterThan(0);
		expect(specificParts[3].length).toBeGreaterThan(0);
		const response = await nftConnector.resolve(nftId);
		expect(response.issuerIdentityId).toMatch(/^0x[\da-f]+$/);
		expect(response.immutableMetadata).toBeUndefined();

		console.debug(
			"Created",
			`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
		);
	});

	test("Can mint an NFT", async () => {
		const immutableMetadata = {
			name: "Test NFT",
			description: "This is a test NFT",
			uri: "https://example.com/nft.png"
		};
		const tag = "test_tag";
		const nftId = await nftConnector.mint(TEST_USER_DID, tag, immutableMetadata, {
			customField: "customValue"
		});
		const urn = Urn.fromValidString(nftId);
		expect(urn.namespaceIdentifier()).toEqual("nft");
		const specificParts = urn.namespaceSpecificParts();
		expect(specificParts[0]).toEqual("iota");
		expect(specificParts[1]).toEqual(TEST_NETWORK);
		expect(specificParts[2].length).toBeGreaterThan(0);
		expect(specificParts[3].length).toBeGreaterThan(0);
		const response = await nftConnector.resolve(nftId);
		expect(response.issuerIdentityId).toMatch(/^0x[\da-f]+$/);

		console.debug(
			"Created",
			`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
		);
	});

	test("Can resolve an NFT", async () => {
		// Create a new NFT for this test
		const immutableMetadata = {
			name: "Resolve Test NFT",
			description: "This is a test NFT for resolve functionality",
			uri: "https://example.com/resolve-nft.png"
		};
		const nftId = await nftConnector.mint(TEST_USER_DID, "resolve_test_tag", immutableMetadata, {
			customField: "customValue"
		});

		const response = await nftConnector.resolve(nftId);
		expect(response.issuerIdentityId).toMatch(/^0x[\da-f]+$/);
		expect(response.tag).toEqual("resolve_test_tag");
		expect(response.metadata).toEqual({ customField: "customValue" });
		expect(response.immutableMetadata).toEqual(immutableMetadata);
	});

	test("Can transfer an NFT", async () => {
		// Create a new NFT for this test
		const immutableMetadata = {
			name: "Transfer Test NFT",
			description: "This is a test NFT for transfer functionality",
			uri: "https://example.com/transfer-nft.png"
		};
		const nftId = await nftConnector.mint(TEST_USER_DID, "transfer_test_tag", immutableMetadata, {
			customField: "customValue"
		});

		// Transfer the NFT to a new owner
		await nftConnector.transfer(TEST_USER_DID, nftId, TEST_ADDRESS_2);

		// Resolve to verify the new ownership
		const response = await nftConnector.resolve(nftId);
		expect(response.issuerIdentityId).toMatch(/^0x[\da-f]+$/);
		expect(response.tag).toEqual("transfer_test_tag");
	});

	test("Can transfer NFT with metadata update", async () => {
		// Create a new NFT for this test
		const immutableMetadata = {
			name: "Transfer with Metadata Test NFT",
			description: "This is a test NFT for transfer with metadata functionality",
			uri: "https://example.com/transfer-metadata-nft.png"
		};
		const initialMetadata = { initialField: "initialValue" };
		const nftId = await nftConnector.mint(
			TEST_USER_DID,
			"transfer_metadata_test_tag",
			immutableMetadata,
			initialMetadata
		);

		const newMetadata = { updatedField: "updatedValue", newField: "newValue" };

		// Transfer with metadata update
		await nftConnector.transfer(TEST_USER_DID, nftId, TEST_ADDRESS_2, newMetadata);

		// Verify ownership and metadata changes
		const response = await nftConnector.resolve(nftId);
		expect(response.issuerIdentityId).toMatch(/^0x[\da-f]+$/);
		expect(response.tag).toEqual("transfer_metadata_test_tag");
		expect(response.metadata).toEqual(newMetadata);
		expect(response.immutableMetadata).toEqual(immutableMetadata);
	});

	test("Can update NFT metadata", async () => {
		// Create a new NFT for this test
		const immutableMetadata = {
			name: "Update Test NFT",
			description: "This is a test NFT for update functionality",
			uri: "https://example.com/update-nft.png"
		};
		const initialMetadata = { initialField: "initialValue" };
		const nftId = await nftConnector.mint(
			TEST_USER_DID,
			"update_test_tag",
			immutableMetadata,
			initialMetadata
		);

		const updatedMetadata = { updatedField: "updatedValue", newField: "newValue" };

		// Update the metadata
		await nftConnector.update(TEST_USER_DID, nftId, updatedMetadata);

		// Verify the metadata was updated
		const response = await nftConnector.resolve(nftId);
		expect(response.issuerIdentityId).toMatch(/^0x[\da-f]+$/);
		expect(response.tag).toEqual("update_test_tag");
		expect(response.metadata).toEqual(updatedMetadata);
		expect(response.immutableMetadata).toEqual(immutableMetadata);
	});

	test("Can burn an NFT", async () => {
		// Create a new NFT for this test
		const immutableMetadata = {
			name: "Burn Test NFT",
			description: "This is a test NFT for burn functionality",
			uri: "https://example.com/burn-nft.png"
		};
		const nftId = await nftConnector.mint(TEST_USER_DID, "burn_test_tag", immutableMetadata, {
			customField: "customValue"
		});

		// Verify the NFT exists before burning
		const responseBefore = await nftConnector.resolve(nftId);
		expect(responseBefore.issuerIdentityId).toMatch(/^0x[\da-f]+$/);

		// Burn the NFT
		await nftConnector.burn(TEST_USER_DID, nftId);

		// Verify the NFT no longer exists
		await expect(nftConnector.resolve(nftId)).rejects.toThrow();
	});

	test("Cannot transfer NFT without proper ownership", async () => {
		const nftId = await nftConnector.mint(TEST_USER_DID, "ownership_test", {
			name: "Ownership Test"
		});

		// Should fail when trying to transfer from wrong owner
		await expect(nftConnector.transfer(TEST_USER_DID_2, nftId, TEST_ADDRESS)).rejects.toThrow(
			"transferFailed"
		);
	});

	test("Cannot update NFT metadata without proper ownership", async () => {
		const nftId = await nftConnector.mint(TEST_USER_DID, "update_ownership_test", {
			name: "Update Ownership Test"
		});

		// Should fail when trying to update from wrong owner
		await expect(nftConnector.update(TEST_USER_DID_2, nftId, { newData: "test" })).rejects.toThrow(
			"iotaNftConnector.updateFailed"
		);
	});

	test("Cannot burn NFT without proper ownership", async () => {
		const nftId = await nftConnector.mint(TEST_USER_DID, "burn_ownership_test", {
			name: "Burn Ownership Test"
		});

		// Should fail when trying to burn from wrong owner
		await expect(nftConnector.burn(TEST_USER_DID_2, nftId)).rejects.toThrow(
			"iotaNftConnector.burningFailed"
		);
	});
});
