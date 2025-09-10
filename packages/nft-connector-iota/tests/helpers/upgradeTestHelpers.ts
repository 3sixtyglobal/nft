// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { exec } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { GeneralError } from "@twin.org/core";
import {
	TEST_NETWORK,
	TEST_NODE_ENDPOINT,
	TEST_DEPLOYER_MNEMONIC,
	TEST_FAUCET_ENDPOINT,
	TEST_GAS_BUDGET
} from "../setupTestEnv";
import { createTestEnvConfig, type ITestDeploymentConfig } from "./testContractDeployment";

// Temporary types until @twin.org/move-to-json exports are fixed
/**
 *
 */
export interface IContractData {
	/**
	 *
	 */
	packageId: string;
	/**
	 *
	 */
	packageBytecode: string;
	/**
	 *
	 */
	deployedPackageId: string;
	/**
	 *
	 */
	upgradeCapabilityId: string;
	/**
	 *
	 */
	migrationStateId: string;
}

/**
 *
 */
export interface ISmartContractDeployments {
	[network: string]: IContractData;
}

const execAsync = promisify(exec);

/**
 * Build V1 contract using move-to-json.
 * @returns Promise that resolves when build is complete.
 */
export async function buildV1Contract(): Promise<void> {
	let tempConfigPath: string | undefined;
	try {
		// Create test-specific configuration for V1 build
		const deploymentConfig: ITestDeploymentConfig = {
			network: TEST_NETWORK,
			nodeEndpoint: TEST_NODE_ENDPOINT,
			faucetEndpoint: TEST_FAUCET_ENDPOINT,
			deployerMnemonic: TEST_DEPLOYER_MNEMONIC ?? "",
			gasBudget: TEST_GAS_BUDGET
		};

		tempConfigPath = await createTestEnvConfig(deploymentConfig);

		const buildCommand = `npx move-to-json build "tests/contracts/v1/nft/sources/**/*.move" --network ${TEST_NETWORK} --output tests/contracts/v1/v1-smart-contract-deployments.json --load-env ${tempConfigPath}`;

		// Add timeout of 120 seconds for the build command
		const timeoutPromise = new Promise<never>((resolve, reject) => {
			setTimeout(
				() =>
					reject(
						new GeneralError(
							"upgradeTestHelpers",
							"buildTimeoutReached",
							undefined,
							"Build command timed out after 120 seconds"
						)
					),
				120000
			);
		});

		const buildPromise = execAsync(buildCommand);
		await Promise.race([buildPromise, timeoutPromise]);

		// Clean up temporary config file
		if (tempConfigPath) {
			try {
				await fs.unlink(tempConfigPath);
			} catch {
				console.warn("[buildV1Contract] Failed to clean up temporary config file");
			}
		}
	} catch (error) {
		// Clean up temporary config file on error
		if (tempConfigPath) {
			try {
				await fs.unlink(tempConfigPath);
			} catch {
				console.warn("[buildV1Contract] Failed to clean up temporary config file after error");
			}
		}
		console.error("[buildV1Contract] Error:", error);
		throw new Error("Building V1 contract failed", { cause: error });
	}
}

/**
 * Deploy V1 contract and populate deployment JSON.
 * Will auto-populate: packageId, deployedPackageId, upgradeCapabilityId, migrationStateId.
 * @returns Promise that resolves to deployment result data.
 */
export async function deployV1Contract(): Promise<IContractData> {
	let tempConfigPath: string | undefined;
	try {
		// Clean V1 build artifacts before deployment to avoid conflicts
		await cleanV1BuildArtifacts();

		// Create test-specific configuration for V1 deployment
		const deploymentConfig: ITestDeploymentConfig = {
			network: TEST_NETWORK,
			nodeEndpoint: TEST_NODE_ENDPOINT,
			faucetEndpoint: TEST_FAUCET_ENDPOINT,
			deployerMnemonic: TEST_DEPLOYER_MNEMONIC ?? "",
			gasBudget: TEST_GAS_BUDGET
		};

		tempConfigPath = await createTestEnvConfig(deploymentConfig);

		const contractsPath = "tests/contracts/v1/v1-smart-contract-deployments.json";

		const deployCommand = `npx move-to-json deploy --network ${TEST_NETWORK} --contracts ${contractsPath} --load-env ${tempConfigPath}`;

		// Add timeout of 180 seconds for the deploy command (longer than build)
		const timeoutPromise = new Promise<never>((resolve, reject) => {
			setTimeout(
				() =>
					reject(
						new GeneralError(
							"upgradeTestHelpers",
							"deployTimeoutReached",
							undefined,
							"Deploy command timed out after 180 seconds"
						)
					),
				180000
			);
		});

		const deployPromise = execAsync(deployCommand);
		await Promise.race([deployPromise, timeoutPromise]);

		// Load and return populated deployment data
		const deploymentData = await loadDeploymentConfig();
		const contractData = deploymentData[TEST_NETWORK as keyof ISmartContractDeployments];

		if (
			!contractData?.deployedPackageId ||
			!contractData?.upgradeCapabilityId ||
			!contractData?.migrationStateId
		) {
			throw new Error(
				`Deployment completed but required data is missing, deployedPackageId: ${contractData?.deployedPackageId}, upgradeCapabilityId: ${contractData?.upgradeCapabilityId}, migrationStateId: ${contractData?.migrationStateId}`
			);
		}

		const result = {
			packageId: contractData.packageId,
			packageBytecode: contractData.packageBytecode,
			deployedPackageId: contractData.deployedPackageId,
			upgradeCapabilityId: contractData.upgradeCapabilityId,
			migrationStateId: contractData.migrationStateId
		};

		// Clean up temporary config file
		if (tempConfigPath) {
			try {
				await fs.unlink(tempConfigPath);
			} catch {
				console.warn("[deployV1Contract] Failed to clean up temporary config file");
			}
		}

		return result;
	} catch (error) {
		// Clean up temporary config file on error
		if (tempConfigPath) {
			try {
				await fs.unlink(tempConfigPath);
			} catch {
				console.warn("[deployV1Contract] Failed to clean up temporary config file after error");
			}
		}
		throw new Error("Deploying V1 contract failed", { cause: error });
	}
}

/**
 * Update V2 Move.toml with the deployed V1 package ID.
 * @param packageId The package ID to set as published-at in V2 Move.toml.
 * @param v2Path Path to the V2 contract directory.
 * @returns Promise that resolves when update is complete.
 */
async function updateV2MoveToml(packageId: string, v2Path: string): Promise<void> {
	const moveTomlPath = path.join(v2Path, "Move.toml");
	const moveTomlContent = `[package]
							name = "nft"
							version = "0.0.2"
							edition = "2024.beta"
							published-at = "${packageId}"

							[dependencies]
							Iota = { git = "https://github.com/iotaledger/iota.git", subdir = "crates/iota-framework/packages/iota-framework", rev = "mainnet" }

							[addresses]
							nft = "0x0"
							`;

	await fs.writeFile(moveTomlPath, moveTomlContent, "utf8");
}

/**
 * Clean V1 build artifacts (Move.lock and build directory).
 * @returns Promise that resolves when cleanup is complete.
 */
async function cleanV1BuildArtifacts(): Promise<void> {
	// Clean artifacts from the test contracts directory
	const v1TestContractPath = path.join(__dirname, "../contracts/v1/nft");
	await cleanBuildArtifactsInPath(v1TestContractPath);

	// Clean artifacts from the src contracts directory (where deployment actually happens)
	const srcContractPath = path.join(__dirname, "../../src/contracts/nft");
	await cleanBuildArtifactsInPath(srcContractPath);
}

/**
 * Helper function to clean build artifacts in a specific path.
 * @param contractPath Path to the contract directory to clean.
 * @returns Promise that resolves when cleanup is complete.
 */
async function cleanBuildArtifactsInPath(contractPath: string): Promise<void> {
	// Clean Move.lock if it exists
	const moveLockPath = path.join(contractPath, "Move.lock");
	try {
		await fs.unlink(moveLockPath);
	} catch {
		// Move.lock doesn't exist, which is expected
	}

	// Clean build directory if it exists
	const buildPath = path.join(contractPath, "build");
	try {
		await fs.rm(buildPath, { recursive: true, force: true });
	} catch {
		// Build directory doesn't exist, which is expected
	}
}

/**
 * Clean V2 build artifacts (Move.lock and build directory).
 * @param v2Path Path to the V2 contract directory.
 * @returns Promise that resolves when cleanup is complete.
 */
async function cleanV2BuildArtifacts(v2Path: string): Promise<void> {
	// Clean Move.lock if it exists
	const moveLockPath = path.join(v2Path, "Move.lock");
	try {
		await fs.unlink(moveLockPath);
	} catch {
		// Move.lock doesn't exist, which is expected
	}

	// Clean build directory if it exists
	const buildPath = path.join(v2Path, "build");
	try {
		await fs.rm(buildPath, { recursive: true, force: true });
	} catch {
		// Build directory doesn't exist, which is expected
	}
}

/**
 * Rebuild V2 contract to ensure latest changes are included.
 * @param v2Path Path to the V2 contract directory.
 * @returns Promise that resolves when rebuild is complete.
 */
async function rebuildV2Contract(v2Path: string): Promise<void> {
	try {
		await execAsync("iota move build", { cwd: v2Path });
	} catch (error) {
		throw new Error("Failed to rebuild V2 contract with updated configuration", { cause: error });
	}
}

/**
 * Execute the upgrade command and extract the new package ID.
 * @param upgradeCap The upgrade capability ID.
 * @param v2Path Path to the V2 contract directory.
 * @returns Promise that resolves to the new package ID after upgrade.
 */
async function executeUpgrade(upgradeCap: string, v2Path: string): Promise<string> {
	const upgradeCommand = `iota client upgrade --upgrade-capability ${upgradeCap} ${v2Path} --json`;
	const { stdout } = await execAsync(upgradeCommand);

	// Parse the upgrade result to extract the new package ID
	const result = JSON.parse(stdout);
	const newPackageId = result.objectChanges?.find(
		(change: { type: string; packageId?: string }) => change.type === "published"
	)?.packageId;

	if (!newPackageId) {
		throw new Error(`New package ID not found result: ${result}, stdout: ${stdout}`);
	}

	return newPackageId;
}

/**
 * Perform upgrade using iota client.
 * @param packageId The package ID to upgrade - will be set as published-at in V2 Move.toml.
 * @param upgradeCap The upgrade capability ID.
 * @returns Promise that resolves to the new package ID after upgrade.
 */
export async function upgradeToV2(packageId: string, upgradeCap: string): Promise<string> {
	try {
		const v2Path = path.join(__dirname, "../contracts/v2/nft");

		await updateV2MoveToml(packageId, v2Path);
		await cleanV2BuildArtifacts(v2Path);
		await rebuildV2Contract(v2Path);
		return await executeUpgrade(upgradeCap, v2Path);
	} catch (error) {
		throw new Error(
			`Failed to upgrade contract to V2, packageId: ${packageId}, upgradeCap: ${upgradeCap}`,
			{ cause: error }
		);
	}
}

/**
 * Load deployment configuration from JSON.
 * @returns Promise that resolves to smart contract deployments configuration.
 */
export async function loadDeploymentConfig(): Promise<ISmartContractDeployments> {
	try {
		const jsonPath = path.join(__dirname, "../contracts/v1/v1-smart-contract-deployments.json");
		const content = await fs.readFile(jsonPath, "utf8");
		return JSON.parse(content) as ISmartContractDeployments;
	} catch (error) {
		throw new Error("Loading deployment configuration failed", { cause: error });
	}
}

/**
 * Clean deployment JSON for next test run.
 * @returns Promise that resolves when cleanup is complete.
 */
export async function cleanupDeploymentJson(): Promise<void> {
	try {
		const jsonPath = path.join(__dirname, "../contracts/v1/v1-smart-contract-deployments.json");
		const cleanConfig: ISmartContractDeployments = {
			testnet: {
				packageId: "",
				packageBytecode: "",
				deployedPackageId: "",
				upgradeCapabilityId: "",
				migrationStateId: ""
			}
		};
		await fs.writeFile(jsonPath, JSON.stringify(cleanConfig, null, "\t"));
	} catch (error) {
		throw new Error("Cleaning deployment JSON failed", { cause: error });
	}
}
