// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Request to update the mutable metadata of an NFT.
 */
export interface INftUpdateRequest {
	/**
	 * The path parameters for the request.
	 */
	pathParams: {
		/**
		 * The id of the NFT to update in urn format.
		 */
		id: string;
	};

	/**
	 * The request body containing update parameters.
	 */
	body: {
		/**
		 * The metadata for the NFT.
		 */
		metadata?: unknown;
	};
}
