// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Configuration for the NFT Service.
 */
export interface INftServiceConfig {
	/**
	 * The default connector namespace to use for NFT operations; defaults to the first registered connector.
	 */
	defaultNamespace?: string;
}
