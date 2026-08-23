// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The span attribute keys for the NFT domain.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const NftSpanAttributes = {
	/**
	 * The id of the NFT the operation is for.
	 */
	Id: "nft.id",

	/**
	 * The tag of the NFT.
	 */
	Tag: "nft.tag"
} as const;

/**
 * Union type of all NFT span attribute key string values.
 */
export type NftSpanAttributes = (typeof NftSpanAttributes)[keyof typeof NftSpanAttributes];
