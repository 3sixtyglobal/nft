// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { entity, property } from "@3sixty/entity";

/**
 * Class describing an NFT entity stored in entity storage.
 */
@entity()
export class Nft {
	/**
	 * The identity of the NFT.
	 */
	@property({ type: "string", isPrimary: true, maxLength: 255 })
	public id!: string;

	/**
	 * The issuer of the NFT.
	 */
	@property({ type: "string", maxLength: 255 })
	public issuer!: string;

	/**
	 * The owner of the NFT.
	 */
	@property({ type: "string", maxLength: 255 })
	public owner!: string;

	/**
	 * The tag for the NFT.
	 */
	@property({ type: "string", maxLength: 128 })
	public tag!: string;

	/**
	 * The immutable metadata.
	 */
	@property({ type: "object", optional: true })
	public immutableMetadata?: unknown;

	/**
	 * The mutable metadata.
	 */
	@property({ type: "object", optional: true })
	public metadata?: unknown;
}
