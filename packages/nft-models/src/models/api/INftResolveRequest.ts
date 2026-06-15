// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Request to resolve an NFT by its id.
 */
export interface INftResolveRequest {
	/**
	 * The path parameters for the request.
	 */
	pathParams: {
		/**
		 * The id of the NFT to resolve.
		 */
		id: string;
	};
}
