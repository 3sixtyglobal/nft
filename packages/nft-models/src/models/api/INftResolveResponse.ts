// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Response to resolving the NFT.
 */
export interface INftResolveResponse {
	/**
	 * The data that was resolved.
	 */
	body: {
		/**
		 * The issuer of the NFT.
		 */
		issuer: string;

		/**
		 * The on-chain Object ID of the verified IOTA Identity that minted this NFT.
		 * Empty string when not minted with identity verification.
		 */
		issuerIdentityId: string;

		/**
		 * The tag data for the NFT.
		 */
		tag: string;

		/**
		 * The immutable data for the NFT.
		 */
		immutableMetadata?: unknown;

		/**
		 * The metadata for the NFT.
		 */
		metadata?: unknown;
	};
}
