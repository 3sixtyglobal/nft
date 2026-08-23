// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The span names for the NFT domain.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const NftSpanNames = {
	/**
	 * Mint an NFT.
	 */
	Mint: "nft/mint",

	/**
	 * Resolve an NFT.
	 */
	Resolve: "nft/resolve",

	/**
	 * Burn an NFT.
	 */
	Burn: "nft/burn",

	/**
	 * Transfer an NFT.
	 */
	Transfer: "nft/transfer",

	/**
	 * Update an NFT.
	 */
	Update: "nft/update"
} as const;

/**
 * Union type of all NFT span name string values.
 */
export type NftSpanNames = (typeof NftSpanNames)[keyof typeof NftSpanNames];
