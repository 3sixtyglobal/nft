// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { exec } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { GeneralError } from "@3sixty/core";
import type { ISmartContractDeployments } from "@3sixty/dlt-iota";

const execAsync = promisify(exec);

/**
 * Test contract deployment configuration for isolated test environments instead of using the deployed ones.
 * This interface defines the configuration parameters needed to deploy
 * smart contracts during test execution using test-specific mnemonics.
 */
export interface ITestDeploymentConfig {
	/**
	 * The IOTA network to deploy to (e.g., "testnet", "devnet").
	 */
	network: string;

	/**
	 * The IOTA node endpoint URL for blockchain interactions.
	 */
	nodeEndpoint: string;

	/**
	 * The faucet endpoint URL for requesting test tokens.
	 */
	faucetEndpoint: string;

	/**
	 * The mnemonic phrase for the deployer wallet (from test environment).
	 */
	deployerMnemonic: string;

	/**
	 * The gas budget in IOTA units for contract deployment transactions.
	 */
	gasBudget: number;
}

/**
 * Create temporary environment configuration file for test contract deployment.
 * @param config The test deployment configuration.
 * @returns Promise that resolves to the path of the temporary config file.
 */
export async function createTestEnvConfig(config: ITestDeploymentConfig): Promise<string> {
	console.log("[createTestEnvConfig] Creating temporary test environment config");
	const tempConfigPath = path.join(__dirname, "../temp-test.env");

	const envContent = `# Temporary test environment configuration
                        # This file is auto-generated and should not be committed
                        NETWORK=${config.network}
                        FAUCET_URL=${config.faucetEndpoint}
                        RPC_URL=${config.nodeEndpoint}
                        RPC_TIMEOUT=60000
                        GAS_BUDGET=${config.gasBudget}
                        CONFIRMATION_TIMEOUT=60
                        DEPLOYER_MNEMONIC="${config.deployerMnemonic}"
                        DEPLOYER_ALIAS="test-deployer-${Date.now()}"
                        ADDRESS_INDEX=0
                        `;

	await fs.writeFile(tempConfigPath, envContent, "utf8");
	return tempConfigPath;
}

/**
 * Build test contracts using move-to-json.
 * @param network The network to build for.
 * @param tempConfigPath Path to the temporary config file.
 * @returns Promise that resolves when build is complete.
 */
export async function buildTestContracts(network: string, tempConfigPath: string): Promise<void> {
	try {
		// Clean any existing build artifacts first
		await cleanBuildArtifacts();

		console.log("[buildTestContracts] Building test contracts");

		const buildCommand = `npx move-to-json build "src/contracts/**/*.move" --network ${network} --output tests/temp-deployments.json --load-env ${tempConfigPath}`;

		const timeoutPromise = new Promise<never>((resolve, reject) => {
			setTimeout(
				() => reject(new GeneralError("testContractDeployment", "buildTimeoutReached")),
				600000 // 10 minutes
			);
		});

		// Set environment variables to avoid Rust panic in rayon-core
		const buildEnv = {
			...process.env,
			RAYON_NUM_THREADS: "1",
			RUST_BACKTRACE: "1"
		};

		const buildPromise = execAsync(buildCommand, { env: buildEnv });
		const buildResult = await Promise.race([buildPromise, timeoutPromise]);
		if (buildResult.stderr) {
			console.log("[buildTestContracts] Build stderr:", buildResult.stderr);
		}
	} catch (error) {
		throw new Error("Building test contracts failed", { cause: error });
	}
}

/**
 * Deploy test contracts and return deployment configuration.
 * @param network The network to deploy to.
 * @param tempConfigPath Path to the temporary config file.
 * @returns Promise that resolves to deployment configuration.
 */
export async function deployTestContracts(
	network: string,
	tempConfigPath: string
): Promise<ISmartContractDeployments> {
	try {
		console.log("[deployTestContracts] Deploying test contracts");
		const contractsPath = "tests/temp-deployments.json";
		const deployCommand = `npx move-to-json deploy --network ${network} --contracts ${contractsPath} --load-env ${tempConfigPath}`;

		const timeoutPromise = new Promise<never>((resolve, reject) => {
			setTimeout(
				() => reject(new GeneralError("testContractDeployment", "deployTimeoutReached")),
				600000 // 10 minutes
			);
		});

		// Set environment variables to avoid Rust panic in rayon-core
		const deployEnv = {
			...process.env,
			RAYON_NUM_THREADS: "1",
			RUST_BACKTRACE: "1"
		};

		const deployPromise = execAsync(deployCommand, { env: deployEnv });
		const deployResult = await Promise.race([deployPromise, timeoutPromise]);
		if (deployResult.stderr) {
			console.log("[deployTestContracts] Deploy stderr:", deployResult.stderr);
		}

		// Load the deployment configuration
		const deploymentData = await loadTestDeploymentConfig();
		const contractData = deploymentData[network as keyof ISmartContractDeployments];

		if (
			!contractData?.deployedPackageId ||
			!contractData?.upgradeCapabilityId ||
			!contractData?.migrationStateId
		) {
			throw new Error(
				`Deployment completed but required data is missing, deployedPackageId: ${contractData?.deployedPackageId}, upgradeCapabilityId: ${contractData?.upgradeCapabilityId}, migrationStateId: ${contractData?.migrationStateId}`
			);
		}

		return deploymentData;
	} catch (error) {
		throw new Error("Deploying test contracts failed", { cause: error });
	}
}

/**
 * Load test deployment configuration from temporary JSON file.
 * @returns Promise that resolves to smart contract deployments configuration.
 */
export async function loadTestDeploymentConfig(): Promise<ISmartContractDeployments> {
	try {
		const jsonPath = path.join(__dirname, "../temp-deployments.json");
		const content = await fs.readFile(jsonPath, "utf8");
		return JSON.parse(content) as ISmartContractDeployments;
	} catch (error) {
		throw new Error("Loading test deployment configuration failed", { cause: error });
	}
}

/**
 * Clean all build artifacts and temporary files.
 * @returns Promise that resolves when cleanup is complete.
 */
async function cleanBuildArtifacts(): Promise<void> {
	const contractPath = path.join(__dirname, "../../src/contracts/nft");

	// Clean Move.lock if it exists
	const moveLockPath = path.join(contractPath, "Move.lock");
	try {
		await fs.unlink(moveLockPath);
	} catch {
		// Move.lock doesn't exist, which is fine
	}

	// Clean build directory if it exists
	const buildPath = path.join(contractPath, "build");
	try {
		await fs.rm(buildPath, { recursive: true, force: true });
	} catch {
		// Build directory doesn't exist, which is fine
	}
}

/**
 * Clean up all temporary test files and artifacts.
 * @returns Promise that resolves when cleanup is complete.
 */
export async function cleanupTestDeployment(): Promise<void> {
	try {
		// Clean temporary config file
		const tempConfigPath = path.join(__dirname, "../temp-test.env");
		try {
			await fs.unlink(tempConfigPath);
		} catch {
			// File doesn't exist, which is fine
		}

		// Clean temporary deployment JSON
		const tempDeploymentPath = path.join(__dirname, "../temp-deployments.json");
		try {
			await fs.unlink(tempDeploymentPath);
		} catch {
			// File doesn't exist, which is fine
		}

		// Clean build artifacts
		await cleanBuildArtifacts();
	} catch (error) {
		console.warn("[cleanupTestDeployment] Cleanup failed:", error);
		// Don't throw here - cleanup failures shouldn't break tests
	}
}

/**
 * Complete test contract deployment process.
 * @param config The test deployment configuration.
 * @returns Promise that resolves to deployment configuration.
 */
export async function deployTestContractsComplete(
	config: ITestDeploymentConfig
): Promise<ISmartContractDeployments> {
	let tempConfigPath: string | undefined;

	try {
		// Create temporary config
		tempConfigPath = await createTestEnvConfig(config);

		// Build contracts
		await buildTestContracts(config.network, tempConfigPath);

		// Deploy contracts
		const deploymentConfig = await deployTestContracts(config.network, tempConfigPath);

		return deploymentConfig;
	} catch (error) {
		// Clean up on error
		if (tempConfigPath) {
			await cleanupTestDeployment();
		}
		throw error;
	}
}
