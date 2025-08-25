// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { IotaNftConnector } from "../src/iotaNftConnector";
import {
	upgradeToV2,
	buildV1Contract,
	deployV1Contract,
	cleanupDeploymentJson,
	type IContractData,
	type ISmartContractDeployments
} from "./helpers/upgradeTestHelpers";
import {
	TEST_CLIENT_OPTIONS,
	TEST_USER_IDENTITY_ID,
	TEST_NODE_IDENTITY,
	TEST_NETWORK,
	TEST_MNEMONIC_NAME,
	setupTestEnv
} from "./setupTestEnv";

describe("Real NFT Contract Upgrade", () => {
	let v1Connector: IotaNftConnector;
	let v2Connector: IotaNftConnector;
	let v1NftId: string;
	let deployment: IContractData;

	beforeAll(async () => {
		// eslint-disable-next-line no-restricted-syntax
		console.log("[beforeAll] Starting setup process...");

		// Setup test environment and build/deploy V1 contract
		// eslint-disable-next-line no-restricted-syntax
		console.log("[beforeAll] Step 1: Setting up test environment");
		await setupTestEnv();

		// eslint-disable-next-line no-restricted-syntax
		console.log("[beforeAll] Step 2: Cleaning up deployment JSON");
		await cleanupDeploymentJson();

		// eslint-disable-next-line no-restricted-syntax
		console.log("[beforeAll] Step 3: Building V1 contract");
		await buildV1Contract();

		// eslint-disable-next-line no-restricted-syntax
		console.log("[beforeAll] Step 4: Deploying V1 contract");
		deployment = await deployV1Contract();

		// eslint-disable-next-line no-restricted-syntax
		console.log("[beforeAll] Step 5: Initializing V1 connector");

		// Initialize V1 connector
		const dynamicConfig: ISmartContractDeployments = {
			[TEST_NETWORK]: {
				packageId: deployment.packageId,
				packageBytecode: deployment.packageBytecode,
				deployedPackageId: deployment.deployedPackageId,
				upgradeCapabilityId: deployment.upgradeCapabilityId,
				migrationStateId: deployment.migrationStateId
			}
		};

		v1Connector = new IotaNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				enableCostLogging: true
			},
			deploymentConfig: dynamicConfig
		});
		await v1Connector.start(TEST_NODE_IDENTITY);
	});

	afterAll(() => {
		deployment = null as unknown as IContractData;
	});

	describe("V1 Contract Functionality", () => {
		it("should deploy V1 contract with version 1", async () => {
			const version = await v1Connector.getCurrentContractVersion();
			expect(version).toBe(1);
		});

		it("should mint NFT with V1 contract", async () => {
			v1NftId = await v1Connector.mint(
				TEST_USER_IDENTITY_ID,
				"pre-upgrade",
				{ name: "V1 NFT", description: "NFT created before upgrade" },
				{ status: "v1", phase: "pre-upgrade" }
			);
			expect(v1NftId).toBeDefined();

			const nftVersion = await v1Connector.getNftContractVersion(v1NftId);
			expect(nftVersion).toBe(1);
		});
	});

	describe("Package Upgrade", () => {
		it("should perform real V1→V2 upgrade using UpgradeCap", async () => {
			const newPackageId = await upgradeToV2(
				deployment.deployedPackageId ?? "",
				deployment.upgradeCapabilityId ?? ""
			);

			// Update deployment data with new package ID
			deployment.deployedPackageId = newPackageId;

			// Create new connector with updated package ID for V2 operations
			const v2Config: ISmartContractDeployments = {
				[TEST_NETWORK]: {
					packageId: deployment.packageId, // Keep original build packageId
					packageBytecode: deployment.packageBytecode,
					deployedPackageId: newPackageId, // Use new deployed package ID
					upgradeCapabilityId: deployment.upgradeCapabilityId,
					migrationStateId: deployment.migrationStateId
				}
			};

			v2Connector = new IotaNftConnector({
				config: {
					clientOptions: TEST_CLIENT_OPTIONS,
					vaultMnemonicId: TEST_MNEMONIC_NAME,
					network: TEST_NETWORK,
					enableCostLogging: true
				},
				deploymentConfig: v2Config
			});

			// Start the connector to initialize it with the new package ID
			await v2Connector.start(TEST_NODE_IDENTITY);

			// Verify version after upgrade (should now be 2)
			const version = await v2Connector.getCurrentContractVersion();
			expect(version).toBe(2);
		});
	});

	describe("Post-Upgrade V1 NFT Functionality", () => {
		it("should access V1 NFT after upgrade", async () => {
			const nft = await v1Connector.resolve(v1NftId);
			expect(nft).toBeDefined();
			const nftVersion = await v1Connector.getNftContractVersion(v1NftId);
			expect(nftVersion).toBe(1);
		});

		it("should detect V1 NFT needs migration", async () => {
			const nftVersion = await v1Connector.getNftContractVersion(v1NftId);
			const contractVersion = await v2Connector.getCurrentContractVersion();

			expect(nftVersion).toBe(1);
			expect(contractVersion).toBe(2);
			expect(nftVersion).toBeLessThan(contractVersion);
		});

		it("should summarize real upgrade test results", async () => {
			// Validate core upgrade functionality
			const v2ContractVersion = await v2Connector.getCurrentContractVersion();
			expect(v2ContractVersion).toBe(2);

			// Verify V1 NFT still accessible, proving compatibility
			const v1NftVersion = await v1Connector.getNftContractVersion(v1NftId);
			expect(v1NftVersion).toBe(1);
		});
	});
});
