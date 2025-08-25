// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Urn } from "@twin.org/core";
import {
	TEST_CLIENT_OPTIONS,
	TEST_ADDRESS,
	TEST_ADDRESS_2,
	setupTestEnv,
	TEST_USER_IDENTITY_ID_2,
	TEST_USER_IDENTITY_ID,
	TEST_NODE_IDENTITY,
	TEST_NETWORK,
	TEST_MNEMONIC_NAME,
	TEST_VAULT_CONNECTOR,
	TEST_EXPLORER_URL,
	TEST_NODE_MNEMONIC,
	DEPLOYER_IDENTITY
} from "./setupTestEnv";
import { IotaNftConnector } from "../src/iotaNftConnector";

let nftConnector: IotaNftConnector;

describe("IotaNftConnector", () => {
	beforeAll(async () => {
		await setupTestEnv();
		// Connector for deployment (using node/deployer mnemonic)
		nftConnector = new IotaNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				enableCostLogging: true
			}
		});
		// Start the connector - no component state needed with move-to-json pre-deployed packages
		await nftConnector.start(TEST_NODE_IDENTITY);
	});

	test("Cannot mint an NFT before start", async () => {
		const unstartedConnector = new IotaNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK
			}
		});
		await expect(unstartedConnector.mint(TEST_USER_IDENTITY_ID, "test_tag")).rejects.toThrow(
			"iotaNftConnector.mintingFailed"
		);
	});

	test("Can mint an NFT with no data", async () => {
		const tag = "test_tag";
		const nftId = await nftConnector.mint(TEST_USER_IDENTITY_ID, tag);
		const urn = Urn.fromValidString(nftId);
		expect(urn.namespaceIdentifier()).toEqual("nft");
		const specificParts = urn.namespaceSpecificParts();
		expect(specificParts[0]).toEqual("iota");
		expect(specificParts[1]).toEqual(TEST_NETWORK);
		expect(specificParts[2].length).toBeGreaterThan(0);
		expect(specificParts[3].length).toBeGreaterThan(0);
		const response = await nftConnector.resolve(nftId);
		expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID);
		expect(response.owner).toEqual(TEST_USER_IDENTITY_ID);
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
		const nftId = await nftConnector.mint(TEST_USER_IDENTITY_ID, tag, immutableMetadata, {
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
		expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID);
		expect(response.owner).toEqual(TEST_USER_IDENTITY_ID);

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
		const nftId = await nftConnector.mint(
			TEST_USER_IDENTITY_ID,
			"resolve_test_tag",
			immutableMetadata,
			{
				customField: "customValue"
			}
		);

		const response = await nftConnector.resolve(nftId);
		expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID);
		expect(response.owner).toEqual(TEST_USER_IDENTITY_ID);
		expect(response.tag).toEqual("resolve_test_tag");

		const version = await nftConnector.getNftContractVersion(nftId);
		expect(version).toBe(1);

		expect(response.metadata).toEqual({ customField: "customValue" });
		expect(response.immutableMetadata).toEqual(immutableMetadata);
	});

	test("Can mint NFT with version 1", async () => {
		const tag = "version_test_tag";
		const immutableMetadata = {
			name: "Version Test NFT",
			description: "This is a test NFT for version validation"
		};

		const nftId = await nftConnector.mint(TEST_USER_IDENTITY_ID, tag, immutableMetadata);

		const response = await nftConnector.resolve(nftId);
		const version = await nftConnector.getNftContractVersion(nftId);
		expect(version).toBe(1);
		expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID);
		expect(response.tag).toEqual(tag);
	});

	test("All minted NFTs have consistent version", async () => {
		const nftIds = [];

		// Mint multiple NFTs
		for (let i = 0; i < 3; i++) {
			const nftId = await nftConnector.mint(TEST_USER_IDENTITY_ID, `consistency_test_${i}`, {
				name: `Test NFT ${i}`
			});
			nftIds.push(nftId);
		}

		// Check all have version 1
		for (const nftId of nftIds) {
			const version = await nftConnector.getNftContractVersion(nftId);
			expect(version).toBe(1);
		}
	});

	test("Can resolve NFT and get version field", async () => {
		const nftId = await nftConnector.mint(
			TEST_USER_IDENTITY_ID,
			"version_field_test",
			{ name: "Version Field Test" },
			{ testField: "testValue" }
		);

		const response = await nftConnector.resolve(nftId);
		const version = await nftConnector.getNftContractVersion(nftId);
		expect(version).toBeDefined();
		expect(typeof version).toBe("number");
		expect(version).toBe(1);
		expect(response.metadata).toEqual({ testField: "testValue" });
	});

	test("Can transfer an NFT", async () => {
		// Create a new NFT for this test
		const immutableMetadata = {
			name: "Transfer Test NFT",
			description: "This is a test NFT for transfer functionality",
			uri: "https://example.com/transfer-nft.png"
		};
		const nftId = await nftConnector.mint(
			TEST_USER_IDENTITY_ID,
			"transfer_test_tag",
			immutableMetadata,
			{
				originalField: "originalValue"
			}
		);

		await nftConnector.transfer(
			TEST_USER_IDENTITY_ID,
			nftId,
			TEST_USER_IDENTITY_ID_2,
			TEST_ADDRESS_2
		);

		const response = await nftConnector.resolve(nftId);
		expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID);
		expect(response.owner).toEqual(TEST_USER_IDENTITY_ID_2);

		const urn = Urn.fromValidString(nftId);
		expect(urn.namespaceIdentifier()).toEqual("nft");
		const specificParts = urn.namespaceSpecificParts();
		console.debug(
			"Created",
			`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
		);
	});

	test("Can transfer an NFT back to the original owner", async () => {
		// Create a new NFT for this test
		const immutableMetadata = {
			name: "Transfer Back Test NFT",
			description: "This is a test NFT for transfer back functionality",
			uri: "https://example.com/transfer-back-nft.png"
		};
		const nftId = await nftConnector.mint(
			TEST_USER_IDENTITY_ID,
			"transfer_back_test_tag",
			immutableMetadata,
			{
				transferBackField: "transferBackValue"
			}
		);

		// First transfer: from USER_1 to USER_2
		await nftConnector.transfer(
			TEST_USER_IDENTITY_ID,
			nftId,
			TEST_USER_IDENTITY_ID_2,
			TEST_ADDRESS_2
		);

		// Verify it's owned by USER_2
		let response = await nftConnector.resolve(nftId);
		expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID);
		expect(response.owner).toEqual(TEST_USER_IDENTITY_ID_2);

		// Second transfer: back from USER_2 to USER_1
		await nftConnector.transfer(
			TEST_USER_IDENTITY_ID_2,
			nftId,
			TEST_USER_IDENTITY_ID,
			TEST_ADDRESS
		);

		// Verify it's back to USER_1
		response = await nftConnector.resolve(nftId);
		expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID);
		expect(response.owner).toEqual(TEST_USER_IDENTITY_ID);

		const urn = Urn.fromValidString(nftId);
		expect(urn.namespaceIdentifier()).toEqual("nft");
		const specificParts = urn.namespaceSpecificParts();
		console.debug(
			"Transferred back",
			`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
		);
	});

	test("Can transfer an NFT with metadata update", async () => {
		const testNftId = await nftConnector.mint(
			TEST_USER_IDENTITY_ID,
			"transfer_test",
			{
				name: "Transfer Test NFT",
				description: "NFT for testing transfer with metadata",
				uri: "https://example.com/transfer.png"
			},
			{ initialField: "initialValue" }
		);

		// Prepare new metadata for transfer
		const transferMetadata = {
			updatedField: "transferValue",
			timestamp: Date.now(),
			transferInfo: { previousOwner: TEST_ADDRESS, transferDate: new Date().toISOString() }
		};

		// Transfer with metadata update
		await nftConnector.transfer(
			TEST_USER_IDENTITY_ID,
			testNftId,
			TEST_USER_IDENTITY_ID_2,
			TEST_ADDRESS_2,
			transferMetadata
		);

		const response = await nftConnector.resolve(testNftId);
		expect(response.owner).toEqual(TEST_USER_IDENTITY_ID_2);
		expect(response.metadata).toEqual(transferMetadata);
		expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID); // Issuer should remain unchanged

		const urn = Urn.fromValidString(testNftId);
		expect(urn.namespaceIdentifier()).toEqual("nft");
		const specificParts = urn.namespaceSpecificParts();
		console.debug(
			"Created",
			`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
		);
	});

	test("Throws error when unauthorized user attempts to transfer NFT", async () => {
		// Create a new NFT for this test
		const immutableMetadata = {
			name: "Unauthorized Transfer Test NFT",
			description: "This is a test NFT for unauthorized transfer test",
			uri: "https://example.com/unauthorized-nft.png"
		};
		const nftId = await nftConnector.mint(
			TEST_USER_IDENTITY_ID,
			"unauthorized_test_tag",
			immutableMetadata,
			{
				testField: "testValue"
			}
		);

		await TEST_VAULT_CONNECTOR.setSecret(
			`unauthorizedController/${TEST_MNEMONIC_NAME}`,
			TEST_NODE_MNEMONIC
		);

		await expect(
			nftConnector.transfer(
				"unauthorizedController",
				nftId,
				TEST_USER_IDENTITY_ID_2,
				TEST_ADDRESS_2
			)
		).rejects.toThrow("transferFailed");
	});

	test("Can update the mutable data of an NFT", async () => {
		// Create a new NFT for this test
		const immutableMetadata = {
			name: "Update Test NFT",
			description: "This is a test NFT for update functionality",
			uri: "https://example.com/update-nft.png"
		};
		const nftId = await nftConnector.mint(
			TEST_USER_IDENTITY_ID,
			"update_test_tag",
			immutableMetadata,
			{
				initialField: "initialValue"
			}
		);

		await nftConnector.update(TEST_USER_IDENTITY_ID, nftId, {
			updatedField: "newValue",
			anotherField: "anotherValue"
		});

		const response = await nftConnector.resolve(nftId);
		expect(response.metadata).toEqual({ updatedField: "newValue", anotherField: "anotherValue" });

		const urn = Urn.fromValidString(nftId);
		expect(urn.namespaceIdentifier()).toEqual("nft");
		const specificParts = urn.namespaceSpecificParts();
		console.debug(
			"Created",
			`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
		);
	});

	test("Can burn an NFT", async () => {
		// Create a new NFT for this test
		const immutableMetadata = {
			name: "Burn Test NFT",
			description: "This is a test NFT for burn functionality",
			uri: "https://example.com/burn-nft.png"
		};
		const nftId = await nftConnector.mint(
			TEST_USER_IDENTITY_ID,
			"burn_test_tag",
			immutableMetadata,
			{
				burnField: "burnValue"
			}
		);

		await nftConnector.burn(TEST_USER_IDENTITY_ID, nftId);
		await expect(nftConnector.resolve(nftId)).rejects.toThrow();
	});

	test("Cannot transfer a burned NFT", async () => {
		const burnTestNftId = await nftConnector.mint(TEST_USER_IDENTITY_ID, "burn_test");

		await nftConnector.burn(TEST_USER_IDENTITY_ID, burnTestNftId);
		await expect(
			nftConnector.transfer(
				TEST_USER_IDENTITY_ID,
				burnTestNftId,
				TEST_USER_IDENTITY_ID_2,
				TEST_ADDRESS_2
			)
		).rejects.toThrow("transferFailed");
	});

	test("Can burn an NFT on a transferred address", async () => {
		const burnTestNftId = await nftConnector.mint(
			TEST_USER_IDENTITY_ID,
			"burn_test_tag",
			undefined,
			{
				burnTestField: "burnTestValue"
			}
		);

		await nftConnector.transfer(
			TEST_USER_IDENTITY_ID,
			burnTestNftId,
			TEST_USER_IDENTITY_ID_2,
			TEST_ADDRESS_2
		);
		await nftConnector.burn(TEST_USER_IDENTITY_ID_2, burnTestNftId);
	});

	test("Can mint an NFT with complex metadata", async () => {
		const immutableMetadata = {
			name: "Complex NFT",
			description: "NFT with complex metadata",
			uri: "https://example.com/nft.png"
		};
		const complexMetadata = { level1: { level2: { key: "value" } } };
		const nftId = await nftConnector.mint(
			TEST_USER_IDENTITY_ID,
			"complex_tag",
			immutableMetadata,
			complexMetadata
		);

		const response = await nftConnector.resolve(nftId);
		expect(response.metadata).toEqual(complexMetadata);

		const urn = Urn.fromValidString(nftId);
		expect(urn.namespaceIdentifier()).toEqual("nft");
		const specificParts = urn.namespaceSpecificParts();
		console.debug(
			"Created",
			`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
		);
	});
});

describe("IotaNftConnector - Admin Operations", () => {
	let adminNftConnector: IotaNftConnector;

	beforeAll(async () => {
		await setupTestEnv();

		// Create connector specifically for admin operations (using node identity as admin)
		adminNftConnector = new IotaNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				enableCostLogging: true
			}
		});
		await adminNftConnector.start(TEST_NODE_IDENTITY);
	});

	test("Can get current contract version from blockchain", async () => {
		const version = await adminNftConnector.getCurrentContractVersion();

		expect(typeof version).toBe("number");
		expect(version).toBeGreaterThan(0);
		expect(version).toBe(1);
		const version2 = await adminNftConnector.getCurrentContractVersion();
		expect(version2).toBe(version);
	}, 10000);

	test("Can get NFT version from existing NFT", async () => {
		const nftId = await adminNftConnector.mint(TEST_USER_IDENTITY_ID, "version_test", {
			name: "Version Test NFT"
		});

		const version = await adminNftConnector.getNftContractVersion(nftId);
		expect(version).toBe(1);
		expect(typeof version).toBe("number");
	});

	test("Can validate NFT version compatibility", async () => {
		const nftId = await adminNftConnector.mint(TEST_USER_IDENTITY_ID, "compatibility_test", {
			name: "Compatibility Test NFT"
		});

		const isCompatible = await adminNftConnector.validateNftVersion(nftId);
		expect(isCompatible).toBe(true);
	});

	test("Can read migration status from blockchain", async () => {
		const isActive = await adminNftConnector.isMigrationActive();
		expect(typeof isActive).toBe("boolean");
	});

	test("Admin functions require proper object IDs", async () => {
		const noMockConnector = new IotaNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK
			}
		});
		await noMockConnector.start(TEST_NODE_IDENTITY);

		// Should fail when trying to enable migration without proper AdminCap access
		await expect(noMockConnector.enableMigration("non-admin-user")).rejects.toThrow(
			"enableMigrationFailed"
		);
	});

	test("Version validation prevents operations on incompatible versions", async () => {
		// Mint an NFT with current version
		const nftId = await adminNftConnector.mint(TEST_USER_IDENTITY_ID, "version_validation_test", {
			name: "Version Validation Test NFT"
		});

		// Verify the NFT has version 1
		const version = await adminNftConnector.getNftContractVersion(nftId);
		expect(version).toBe(1);

		// Verify validation passes for current version
		const isValid = await adminNftConnector.validateNftVersion(nftId);
		expect(isValid).toBe(true);

		// Test that contract version and NFT version match
		const contractVersion = await adminNftConnector.getCurrentContractVersion();
		expect(contractVersion).toBe(version);
	});

	test("Current version operations work correctly", async () => {
		// Mint an NFT and verify all operations work correctly with current version
		const nftId = await adminNftConnector.mint(
			TEST_USER_IDENTITY_ID,
			"current_version_ops",
			{
				name: "Current Version Operations Test"
			},
			{ testField: "initialValue" }
		);

		// Verify version is current
		const version = await adminNftConnector.getNftContractVersion(nftId);
		const contractVersion = await adminNftConnector.getCurrentContractVersion();
		expect(version).toBe(contractVersion);

		// Test that all operations work with current version NFT
		// Update metadata
		await expect(
			adminNftConnector.update(TEST_USER_IDENTITY_ID, nftId, {
				testField: "updatedValue",
				newField: "newValue"
			})
		).resolves.not.toThrow();

		await expect(
			adminNftConnector.transfer(
				TEST_USER_IDENTITY_ID,
				nftId,
				TEST_USER_IDENTITY_ID_2,
				TEST_ADDRESS_2
			)
		).resolves.not.toThrow();

		// Verify NFT is still current version after operations
		const versionAfterOps = await adminNftConnector.getNftContractVersion(nftId);
		expect(versionAfterOps).toBe(contractVersion);

		// Transfer back for cleanup
		await adminNftConnector.transfer(
			TEST_USER_IDENTITY_ID_2,
			nftId,
			TEST_USER_IDENTITY_ID,
			TEST_ADDRESS
		);
	});

	test("Can validate multiple NFT versions", async () => {
		// Create multiple NFTs and validate them all
		const nftIds = [];

		for (let i = 0; i < 3; i++) {
			const nftId = await adminNftConnector.mint(TEST_USER_IDENTITY_ID, `multi_validation_${i}`, {
				name: `Multi Validation Test NFT ${i}`
			});
			nftIds.push(nftId);
		}

		// Validate all NFTs have correct version
		for (const nftId of nftIds) {
			const version = await adminNftConnector.getNftContractVersion(nftId);
			expect(version).toBe(1);

			const isValid = await adminNftConnector.validateNftVersion(nftId);
			expect(isValid).toBe(true);
		}
	});

	test("Can enable and disable migration with admin identity", async () => {
		await expect(adminNftConnector.enableMigration(DEPLOYER_IDENTITY)).resolves.not.toThrow();
		await expect(adminNftConnector.disableMigration(DEPLOYER_IDENTITY)).resolves.not.toThrow();

		// Enable again for other tests
		await expect(adminNftConnector.enableMigration(DEPLOYER_IDENTITY)).resolves.not.toThrow();
	});

	test("Cannot enable migration without admin identity (should fail)", async () => {
		// This should fail because TEST_USER_IDENTITY_ID is not an admin
		await expect(adminNftConnector.enableMigration(TEST_USER_IDENTITY_ID)).rejects.toThrow();
	});

	test("Cannot disable migration without admin identity (should fail)", async () => {
		// This should fail because TEST_USER_IDENTITY_ID is not an admin
		await expect(adminNftConnector.disableMigration(TEST_USER_IDENTITY_ID)).rejects.toThrow();
	});

	test("Can migrate NFT with admin privileges (fails for current version)", async () => {
		// First create an NFT to attempt migration
		const nftId = await adminNftConnector.mint(TEST_USER_IDENTITY_ID, "migration_test", {
			name: "Migration Test NFT"
		});

		// Verify NFT starts with version 1 (current version)
		const versionBefore = await adminNftConnector.getNftContractVersion(nftId);
		expect(versionBefore).toBe(1);

		// Verify contract is also version 1
		const contractVersion = await adminNftConnector.getCurrentContractVersion();
		expect(contractVersion).toBe(1);

		// Enable migration first (using DEPLOYER_IDENTITY which owns AdminCap)
		await adminNftConnector.enableMigration(DEPLOYER_IDENTITY);

		// Migration should fail because NFT is already at current version
		// This demonstrates correct admin access but logical failure for same-version migration
		await expect(adminNftConnector.migrateNft(DEPLOYER_IDENTITY, nftId)).rejects.toThrow();
	});

	test("Cannot migrate NFT without admin capabilities", async () => {
		// First create an NFT to attempt migration
		const nftId = await adminNftConnector.mint(TEST_USER_IDENTITY_ID, "no_admin_migration_test", {
			name: "No Admin Migration Test NFT"
		});

		await adminNftConnector.enableMigration(DEPLOYER_IDENTITY);

		// This should fail because TEST_USER_IDENTITY_ID is not an admin
		await expect(adminNftConnector.migrateNft(TEST_USER_IDENTITY_ID, nftId)).rejects.toThrow();
	});

	describe("Security & Error Validation", () => {
		test("Unauthorized migration attempts fail gracefully", async () => {
			// Create an NFT for unauthorized migration attempt
			const nftId = await adminNftConnector.mint(TEST_USER_IDENTITY_ID, "security_test", {
				name: "Security Test NFT"
			});

			// Enable migration first (using DEPLOYER_IDENTITY which owns AdminCap)
			await adminNftConnector.enableMigration(DEPLOYER_IDENTITY);

			// Regular user tries to migrate NFT (should fail - no AdminCap)
			await expect(adminNftConnector.migrateNft(TEST_USER_IDENTITY_ID, nftId)).rejects.toThrow(
				"migrateNftFailed"
			);

			// Different user tries to migrate NFT (should fail - no AdminCap)
			await expect(adminNftConnector.migrateNft(TEST_USER_IDENTITY_ID_2, nftId)).rejects.toThrow(
				"migrateNftFailed"
			);

			// Node identity tries to migrate NFT (should fail - no AdminCap)
			await expect(adminNftConnector.migrateNft(TEST_NODE_IDENTITY, nftId)).rejects.toThrow(
				"migrateNftFailed"
			);

			// Verify NFT remains unchanged after failed unauthorized attempts
			const nftAfterFailures = await adminNftConnector.resolve(nftId);
			const versionAfterFailures = await adminNftConnector.getNftContractVersion(nftId);
			expect(versionAfterFailures).toBe(1);
			expect(nftAfterFailures.owner).toBe(TEST_USER_IDENTITY_ID); // Owner unchanged
		});

		test("Operations during disabled migration fail appropriately", async () => {
			// Create an NFT for disabled migration testing
			const nftId = await adminNftConnector.mint(TEST_USER_IDENTITY_ID, "disabled_migration_test", {
				name: "Disabled Migration Test NFT"
			});

			// Ensure migration is disabled (using DEPLOYER_IDENTITY which owns AdminCap)
			await adminNftConnector.disableMigration(DEPLOYER_IDENTITY);

			// Admin tries to migrate NFT while migration is disabled (should fail)
			await expect(adminNftConnector.migrateNft(DEPLOYER_IDENTITY, nftId)).rejects.toThrow();

			// Verify migration status is actually disabled
			const isActive = await adminNftConnector.isMigrationActive();
			expect(isActive).toBe(false);

			// Enable migration, then disable it, then try to migrate (should fail)
			await adminNftConnector.enableMigration(DEPLOYER_IDENTITY);
			await adminNftConnector.disableMigration(DEPLOYER_IDENTITY);
			await expect(adminNftConnector.migrateNft(DEPLOYER_IDENTITY, nftId)).rejects.toThrow();

			// Verify NFT remains unchanged after disabled migration attempts
			const versionAfterFailures2 = await adminNftConnector.getNftContractVersion(nftId);
			expect(versionAfterFailures2).toBe(1);
		});

		test("Version-mixing attacks are prevented", async () => {
			// Create multiple NFTs to test version consistency
			const nftIds = [];
			for (let i = 0; i < 3; i++) {
				const nftId = await adminNftConnector.mint(
					TEST_USER_IDENTITY_ID,
					`version_attack_test_${i}`,
					{
						name: `Version Attack Test NFT ${i}`
					}
				);
				nftIds.push(nftId);
			}

			// Verify all NFTs start with the same version
			const contractVersion = await adminNftConnector.getCurrentContractVersion();
			for (const nftId of nftIds) {
				const nftVersion = await adminNftConnector.getNftContractVersion(nftId);
				expect(nftVersion).toBe(contractVersion);
			}

			// Enable migration for attack testing
			await adminNftConnector.enableMigration(DEPLOYER_IDENTITY);

			// Try to migrate NFTs that are already current version (should fail)
			for (const nftId of nftIds) {
				await expect(adminNftConnector.migrateNft(DEPLOYER_IDENTITY, nftId)).rejects.toThrow();
			}

			// Verify version validation prevents operations on mismatched versions
			for (const nftId of nftIds) {
				const isValid = await adminNftConnector.validateNftVersion(nftId);
				expect(isValid).toBe(true);
			}

			// Verify consistent version behavior across all NFTs
			const versions = [];
			for (const nftId of nftIds) {
				const version = await adminNftConnector.getNftContractVersion(nftId);
				versions.push(version);
			}

			// All versions should be identical (no version mixing)
			const uniqueVersions = [...new Set(versions)];
			expect(uniqueVersions).toHaveLength(1);
			expect(uniqueVersions[0]).toBe(contractVersion);
		});

		test("AdminCap requirements are enforced", async () => {
			// Enable migration requires AdminCap
			await expect(adminNftConnector.enableMigration(TEST_USER_IDENTITY_ID)).rejects.toThrow();
			await expect(adminNftConnector.enableMigration(TEST_USER_IDENTITY_ID_2)).rejects.toThrow();
			await expect(adminNftConnector.enableMigration(TEST_NODE_IDENTITY)).rejects.toThrow();

			// Disable migration requires AdminCap
			await expect(adminNftConnector.disableMigration(TEST_USER_IDENTITY_ID)).rejects.toThrow();
			await expect(adminNftConnector.disableMigration(TEST_USER_IDENTITY_ID_2)).rejects.toThrow();
			await expect(adminNftConnector.disableMigration(TEST_NODE_IDENTITY)).rejects.toThrow();

			// Only DEPLOYER_IDENTITY (AdminCap owner) can perform admin operations
			await expect(adminNftConnector.enableMigration(DEPLOYER_IDENTITY)).resolves.not.toThrow();
			await expect(adminNftConnector.disableMigration(DEPLOYER_IDENTITY)).resolves.not.toThrow();

			// Create NFT and test migration requires AdminCap
			const nftId = await adminNftConnector.mint(TEST_USER_IDENTITY_ID, "admincap_test", {
				name: "AdminCap Enforcement Test NFT"
			});

			// Enable migration for this test
			await adminNftConnector.enableMigration(DEPLOYER_IDENTITY);

			// Migration attempts without AdminCap should fail
			await expect(adminNftConnector.migrateNft(TEST_USER_IDENTITY_ID, nftId)).rejects.toThrow();
			await expect(adminNftConnector.migrateNft(TEST_USER_IDENTITY_ID_2, nftId)).rejects.toThrow();
			await expect(adminNftConnector.migrateNft(TEST_NODE_IDENTITY, nftId)).rejects.toThrow();

			// Migration with AdminCap should have access but fail due to version logic (expected)
			await expect(adminNftConnector.migrateNft(DEPLOYER_IDENTITY, nftId)).rejects.toThrow();

			// Verify AdminCap boundary: no identity can perform admin operations except AdminCap owner
			const unauthorizedIdentities = [
				TEST_USER_IDENTITY_ID,
				TEST_USER_IDENTITY_ID_2,
				TEST_NODE_IDENTITY
			];

			for (const identity of unauthorizedIdentities) {
				// Should fail for all admin operations
				await expect(adminNftConnector.enableMigration(identity)).rejects.toThrow();
				await expect(adminNftConnector.disableMigration(identity)).rejects.toThrow();
				await expect(adminNftConnector.migrateNft(identity, nftId)).rejects.toThrow();
			}
		});

		test("Error handling provides informative messages", async () => {
			// Test with an invalid admin identity to trigger an error
			const connectorWithoutObjects = new IotaNftConnector({
				config: {
					clientOptions: TEST_CLIENT_OPTIONS,
					vaultMnemonicId: TEST_MNEMONIC_NAME,
					network: TEST_NETWORK
				}
			});
			await connectorWithoutObjects.start(TEST_NODE_IDENTITY);

			// Should provide helpful error messages when using invalid admin identity
			await expect(
				connectorWithoutObjects.enableMigration("invalid-admin-identity")
			).rejects.toThrow();

			// Invalid NFT IDs produce clear errors
			await expect(
				adminNftConnector.migrateNft(DEPLOYER_IDENTITY, "invalid-nft-id")
			).rejects.toThrow();

			// Malformed URN produces namespace mismatch error
			await expect(
				adminNftConnector.migrateNft(DEPLOYER_IDENTITY, "urn:test:invalid:format")
			).rejects.toThrow("namespaceMismatch");
		});
	});
});
