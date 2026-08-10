// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The metric IDs for the NFT domain.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const NftMetricIds = {
	/**
	 * Number of NFT tokens minted.
	 */
	TokensMinted: "nft_tokens_minted",
	/**
	 * Number of NFT tokens burned.
	 */
	TokensBurned: "nft_tokens_burned",
	/**
	 * Number of NFT tokens transferred.
	 */
	TokensTransferred: "nft_tokens_transferred",
	/**
	 * Number of NFT tokens resolved.
	 */
	TokensResolved: "nft_tokens_resolved",
	/**
	 * Number of NFT tokens updated.
	 */
	TokensUpdated: "nft_tokens_updated"
} as const;

/**
 * Union type of all NFT metric ID string values.
 */
export type NftMetricIds = (typeof NftMetricIds)[keyof typeof NftMetricIds];
