// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Interface representing the storage fields of an NFT.
 */
export interface INftFields {
	/**
	 * The ID of the NFT.
	 */
	id: {
		/**
		 * The ID of the NFT.
		 */
		id: string; // UID is an object with an 'id' field
	};
	/**
	 * The version of the NFT contract that created this NFT.
	 */
	version: string;
	/**
	 * The immutable metadata of the NFT.
	 */
	immutable_metadata: string;
	/**
	 * The tag of the NFT.
	 */
	tag: string;
	/**
	 * The metadata of the NFT.
	 */
	metadata: string;
	/**
	 * The issuer of the NFT — the wallet address that signed the mint transaction.
	 */
	issuer: string;
	/**
	 * The on-chain Object ID (as hex address string) of the verified IOTA Identity that minted
	 * this NFT. "0x0000...0000" when minted via the unverified mint() function.
	 */
	issuerIdentityId: string;
}
