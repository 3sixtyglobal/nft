// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaConfig, ISmartContractDeployments } from "@twin.org/dlt-iota";

/**
 * Configuration for the IOTA NFT Connector.
 */
export interface IIotaNftConnectorConfig extends IIotaConfig {
	/**
	 * The name of the contract to use.
	 * @default "nft"
	 */
	contractName?: string;

	/**
	 * The account address index to use when creating NFT.
	 * @default 0
	 */
	accountAddressIndex?: number;

	/**
	 * The wallet address index to use when creating NFT.
	 * @default 0
	 */
	walletAddressIndex?: number;

	/**
	 * Enable cost logging.
	 * @default false
	 */
	enableCostLogging?: boolean;

	/**
	 * Optional deployment configuration to use instead of the default compiled configuration.
	 * This allows tests and other scenarios to use different contract deployments.
	 * @default Uses compiled smart-contract-deployments.json
	 */
	deploymentConfig?: ISmartContractDeployments;

	/**
	 * Optional deployment package ID to use instead of the one from the deployment configuration.
	 */
	deploymentPkgId?: string;
}
