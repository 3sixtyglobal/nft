// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseRestClient } from "@twin.org/api-core";
import type { IBaseRestClientConfig, ICreatedResponse } from "@twin.org/api-models";
import { Guards, Urn } from "@twin.org/core";
import { nameof } from "@twin.org/nameof";
import type {
	INftBurnRequest,
	INftComponent,
	INftMintRequest,
	INftResolveRequest,
	INftResolveResponse,
	INftTransferRequest,
	INftUpdateRequest
} from "@twin.org/nft-models";
import { HttpMethod } from "@twin.org/web";

/**
 * Client for performing NFT operations via REST endpoints.
 */
export class NftRestClient extends BaseRestClient implements INftComponent {
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<NftRestClient>();

	/**
	 * Create a new instance of NftRestClient.
	 * @param config The configuration for the client.
	 */
	constructor(config: IBaseRestClientConfig) {
		super(nameof<NftRestClient>(), config, "nft");
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name.
	 */
	public className(): string {
		return NftRestClient.CLASS_NAME;
	}

	/**
	 * Mint an NFT.
	 * @param tag The tag for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @param metadata The metadata for the NFT.
	 * @param namespace The namespace of the connector to use for the NFT, defaults to component configured namespace.
	 * @returns The id of the created NFT in urn format.
	 */
	public async mint<T = unknown, U = unknown>(
		tag: string,
		immutableMetadata?: T,
		metadata?: U,
		namespace?: string
	): Promise<string> {
		Guards.stringValue(NftRestClient.CLASS_NAME, nameof(tag), tag);

		const response = await this.fetch<INftMintRequest, ICreatedResponse>("/", HttpMethod.POST, {
			body: {
				tag,
				immutableMetadata,
				metadata,
				namespace
			}
		});

		return HttpHeaderHelper.extractId(response.headers);
	}

	/**
	 * Resolve an NFT.
	 * @param id The id of the NFT to resolve.
	 * @returns The data for the NFT.
	 */
	public async resolve<T = unknown, U = unknown>(
		id: string
	): Promise<{
		issuer: string;
		issuerIdentityId: string;
		tag: string;
		immutableMetadata?: T;
		metadata?: U;
	}> {
		Guards.stringValue(NftRestClient.CLASS_NAME, nameof(id), id);

		const response = await this.fetch<INftResolveRequest, INftResolveResponse>(
			"/:id",
			HttpMethod.GET,
			{
				pathParams: {
					id
				}
			}
		);

		return response.body as {
			issuer: string;
			issuerIdentityId: string;
			tag: string;
			immutableMetadata?: T;
			metadata?: U;
		};
	}

	/**
	 * Burn an NFT.
	 * @param id The id of the NFT to burn in urn format.
	 * @returns A promise that resolves when the NFT has been permanently destroyed.
	 */
	public async burn(id: string): Promise<void> {
		Urn.guard(NftRestClient.CLASS_NAME, nameof(id), id);

		await this.fetch<INftBurnRequest, never>("/:id", HttpMethod.DELETE, {
			pathParams: {
				id
			}
		});
	}

	/**
	 * Transfer an NFT.
	 * @param id The id of the NFT to transfer in urn format.
	 * @param recipientAddress The recipient address for the NFT.
	 * @param metadata Optional mutable data to include during the transfer.
	 * @returns A promise that resolves when the NFT ownership has been transferred.
	 */
	public async transfer<T = unknown>(
		id: string,
		recipientAddress: string,
		metadata?: T
	): Promise<void> {
		Guards.stringValue(NftRestClient.CLASS_NAME, nameof(id), id);
		Guards.stringValue(NftRestClient.CLASS_NAME, nameof(recipientAddress), recipientAddress);

		await this.fetch<INftTransferRequest, never>("/:id/transfer", HttpMethod.POST, {
			pathParams: {
				id
			},
			body: {
				recipientAddress,
				metadata
			}
		});
	}

	/**
	 * Update the mutable data of the NFT.
	 * @param id The id of the NFT to update in urn format.
	 * @param metadata The mutable data to update.
	 * @returns A promise that resolves when the NFT metadata has been updated.
	 */
	public async update<U = unknown>(id: string, metadata: U): Promise<void> {
		Guards.stringValue(NftRestClient.CLASS_NAME, nameof(id), id);
		Guards.object(NftRestClient.CLASS_NAME, nameof(metadata), metadata);

		await this.fetch<INftUpdateRequest, never>("/:id", HttpMethod.PUT, {
			pathParams: {
				id
			},
			body: {
				metadata
			}
		});
	}
}
