// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { GeneralError, Guards, Urn } from "@twin.org/core";
import { nameof } from "@twin.org/nameof";
import { NftConnectorFactory, type INftComponent, type INftConnector } from "@twin.org/nft-models";
import type { INftServiceConstructorOptions } from "./models/INftServiceConstructorOptions.js";

/**
 * Service for performing NFT operations to a connector.
 */
export class NftService implements INftComponent {
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<NftService>();

	/**
	 * The namespace supported by the nft service.
	 * @internal
	 */
	private static readonly _NAMESPACE: string = "nft";

	/**
	 * The default namespace for the connector to use.
	 * @internal
	 */
	private readonly _defaultNamespace: string;

	/**
	 * Create a new instance of NftService.
	 * @param options The options for the service.
	 */
	constructor(options?: INftServiceConstructorOptions) {
		const names = NftConnectorFactory.names();
		if (names.length === 0) {
			throw new GeneralError(NftService.CLASS_NAME, "noConnectors");
		}

		this._defaultNamespace = options?.config?.defaultNamespace ?? names[0];
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return NftService.CLASS_NAME;
	}

	/**
	 * Mint an NFT.
	 * @param tag The tag for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @param metadata The metadata for the NFT.
	 * @param namespace The namespace of the connector to use for the NFT, defaults to service configured namespace.
	 * @param controllerIdentity The identity to perform the nft operation with.
	 * @returns The id of the created NFT in urn format.
	 */
	public async mint<T = unknown, U = unknown>(
		tag: string,
		immutableMetadata?: T,
		metadata?: U,
		namespace?: string,
		controllerIdentity?: string
	): Promise<string> {
		Guards.stringValue(NftService.CLASS_NAME, nameof(tag), tag);
		Guards.stringValue(NftService.CLASS_NAME, nameof(controllerIdentity), controllerIdentity);

		try {
			const connectorNamespace = namespace ?? this._defaultNamespace;

			const nftConnector = NftConnectorFactory.get<INftConnector>(connectorNamespace);

			const nftUrn = await nftConnector.mint(controllerIdentity, tag, immutableMetadata, metadata);

			return nftUrn;
		} catch (error) {
			throw new GeneralError(NftService.CLASS_NAME, "mintFailed", undefined, error);
		}
	}

	/**
	 * Resolve an NFT.
	 * @param id The id of the NFT to resolve.
	 * @param controllerIdentity The identity to perform the nft operation with.
	 * @returns The data for the NFT.
	 */
	public async resolve<T = unknown, U = unknown>(
		id: string,
		controllerIdentity?: string
	): Promise<{
		issuer: string;
		issuerIdentityId: string;
		tag: string;
		immutableMetadata?: T;
		metadata?: U;
	}> {
		Urn.guard(NftService.CLASS_NAME, nameof(id), id);

		try {
			const nftConnector = this.getConnector(id);
			const result = await nftConnector.resolve<T, U>(id);
			return result;
		} catch (error) {
			throw new GeneralError(NftService.CLASS_NAME, "resolveFailed", undefined, error);
		}
	}

	/**
	 * Burn an NFT.
	 * @param id The id of the NFT to burn in urn format.
	 * @param controllerIdentity The identity to perform the nft operation with.
	 * @returns Nothing.
	 */
	public async burn(id: string, controllerIdentity?: string): Promise<void> {
		Urn.guard(NftService.CLASS_NAME, nameof(id), id);
		Guards.stringValue(NftService.CLASS_NAME, nameof(controllerIdentity), controllerIdentity);

		try {
			const nftConnector = this.getConnector(id);
			await nftConnector.burn(controllerIdentity, id);
		} catch (error) {
			throw new GeneralError(NftService.CLASS_NAME, "burnFailed", undefined, error);
		}
	}

	/**
	 * Transfer an NFT.
	 * @param id The id of the NFT to transfer in urn format.
	 * @param recipientAddress The recipient address for the NFT.
	 * @param metadata Optional mutable data to include during the transfer.
	 * @param controllerIdentity The identity to perform the nft operation with.
	 * @returns Nothing.
	 */
	public async transfer<U = unknown>(
		id: string,
		recipientAddress: string,
		metadata?: U,
		controllerIdentity?: string
	): Promise<void> {
		Urn.guard(NftService.CLASS_NAME, nameof(id), id);
		Guards.stringValue(NftService.CLASS_NAME, nameof(recipientAddress), recipientAddress);
		Guards.stringValue(NftService.CLASS_NAME, nameof(controllerIdentity), controllerIdentity);

		try {
			const nftConnector = this.getConnector(id);
			await nftConnector.transfer(controllerIdentity, id, recipientAddress, metadata);
		} catch (error) {
			throw new GeneralError(NftService.CLASS_NAME, "transferFailed", undefined, error);
		}
	}

	/**
	 * Update the data of the NFT.
	 * @param id The id of the NFT to update in urn format.
	 * @param metadata The mutable data to update.
	 * @param controllerIdentity The identity to perform the nft operation with.
	 * @returns Nothing.
	 */
	public async update<U = unknown>(
		id: string,
		metadata: U,
		controllerIdentity?: string
	): Promise<void> {
		Urn.guard(NftService.CLASS_NAME, nameof(id), id);
		Guards.object(NftService.CLASS_NAME, nameof(metadata), metadata);
		Guards.stringValue(NftService.CLASS_NAME, nameof(controllerIdentity), controllerIdentity);

		try {
			const nftConnector = this.getConnector(id);
			await nftConnector.update(controllerIdentity, id, metadata);
		} catch (error) {
			throw new GeneralError(NftService.CLASS_NAME, "updateFailed", undefined, error);
		}
	}

	/**
	 * Get the connector from the uri.
	 * @param id The id of the NFT in urn format.
	 * @returns The connector.
	 * @throws GeneralError If the namespace does not match.
	 * @internal
	 */
	private getConnector(id: string): INftConnector {
		const idUri = Urn.fromValidString(id);

		if (idUri.namespaceIdentifier() !== NftService._NAMESPACE) {
			throw new GeneralError(NftService.CLASS_NAME, "namespaceMismatch", {
				namespace: NftService._NAMESPACE,
				id
			});
		}

		return NftConnectorFactory.get<INftConnector>(idUri.namespaceMethod());
	}
}
