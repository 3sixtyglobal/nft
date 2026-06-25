// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Request to burn an NFT.
 */
export interface INftBurnRequest {
	/**
	 * The path parameters for the request.
	 */
	pathParams: {
		/**
		 * The id of the NFT to burn.
		 */
		id: string;
	};
}
