// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Request to transfer an NFT to a new owner.
 */
export interface INftTransferRequest {
	/**
	 * The path parameters for the request.
	 */
	pathParams: {
		/**
		 * The id of the NFT to transfer in urn format.
		 */
		id: string;
	};

	/**
	 * The request body containing transfer parameters.
	 */
	body: {
		/**
		 * The recipient address for the NFT.
		 */
		recipientAddress: string;

		/**
		 * The metadata for the NFT.
		 */
		metadata?: unknown;
	};
}
