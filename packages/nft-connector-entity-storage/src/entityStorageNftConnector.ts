// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	Converter,
	GeneralError,
	Guards,
	Is,
	NotFoundError,
	RandomHelper,
	Urn
} from "@3sixty/core";
import {
	EntityStorageConnectorFactory,
	type IEntityStorageConnector
} from "@3sixty/entity-storage-models";
import { nameof } from "@3sixty/nameof";
import type { INftConnector } from "@3sixty/nft-models";
import type { Nft } from "./entities/nft.js";
import type { IEntityStorageNftConnectorConstructorOptions } from "./models/IEntityStorageNftConnectorConstructorOptions.js";

/**
 * Class for performing NFT operations on entity storage.
 */
export class EntityStorageNftConnector implements INftConnector {
	/**
	 * The namespace supported by the nft connector.
	 */
	public static NAMESPACE: string = "entity-storage";

	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<EntityStorageNftConnector>();

	/**
	 * The entity storage for nfts.
	 * @internal
	 */
	private readonly _nftEntityStorage: IEntityStorageConnector<Nft>;

	/**
	 * Create a new instance of EntityStorageNftConnector.
	 * @param options The dependencies for the class.
	 */
	constructor(options?: IEntityStorageNftConnectorConstructorOptions) {
		this._nftEntityStorage = EntityStorageConnectorFactory.get(
			options?.nftEntityStorageType ?? "nft"
		);
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name.
	 */
	public className(): string {
		return EntityStorageNftConnector.CLASS_NAME;
	}

	/**
	 * Mint an NFT.
	 * @param controllerIdentity The controller of the NFT who can make changes.
	 * @param tag The tag for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @param metadata The metadata for the NFT.
	 * @returns The id of the created NFT in urn format.
	 */
	public async mint<T = unknown, U = unknown>(
		controllerIdentity: string,
		tag: string,
		immutableMetadata?: T,
		metadata?: U
	): Promise<string> {
		Guards.stringValue(
			EntityStorageNftConnector.CLASS_NAME,
			nameof(controllerIdentity),
			controllerIdentity
		);
		Guards.stringValue(EntityStorageNftConnector.CLASS_NAME, nameof(tag), tag);

		try {
			const nftId = Converter.bytesToHex(RandomHelper.generate(32));

			const nft: Nft = {
				id: nftId,
				issuer: controllerIdentity,
				owner: controllerIdentity,
				tag,
				immutableMetadata,
				metadata
			};

			await this._nftEntityStorage.set(nft);

			return `nft:${new Urn(EntityStorageNftConnector.NAMESPACE, nftId).toString()}`;
		} catch (error) {
			throw new GeneralError(
				EntityStorageNftConnector.CLASS_NAME,
				"mintingFailed",
				undefined,
				error
			);
		}
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
		Urn.guard(EntityStorageNftConnector.CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== EntityStorageNftConnector.NAMESPACE) {
			throw new GeneralError(EntityStorageNftConnector.CLASS_NAME, "namespaceMismatch", {
				namespace: EntityStorageNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const nftId = urnParsed.namespaceSpecific(1);
			const nft = await this._nftEntityStorage.get(nftId);

			if (Is.empty(nft)) {
				throw new NotFoundError(EntityStorageNftConnector.CLASS_NAME, "nftNotFound");
			}

			return {
				issuer: nft.issuer,
				issuerIdentityId: "",
				tag: nft.tag,
				immutableMetadata: nft.immutableMetadata as T,
				metadata: nft.metadata as U
			};
		} catch (error) {
			throw new GeneralError(
				EntityStorageNftConnector.CLASS_NAME,
				"resolvingFailed",
				undefined,
				error
			);
		}
	}

	/**
	 * Burn an NFT.
	 * @param controllerIdentity The controller of the NFT who can make changes.
	 * @param id The id of the NFT to burn in urn format.
	 * @returns A promise that resolves when the NFT has been permanently destroyed.
	 */
	public async burn(controllerIdentity: string, id: string): Promise<void> {
		Guards.stringValue(
			EntityStorageNftConnector.CLASS_NAME,
			nameof(controllerIdentity),
			controllerIdentity
		);
		Urn.guard(EntityStorageNftConnector.CLASS_NAME, nameof(id), id);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceMethod() !== EntityStorageNftConnector.NAMESPACE) {
			throw new GeneralError(EntityStorageNftConnector.CLASS_NAME, "namespaceMismatch", {
				namespace: EntityStorageNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const nftId = urnParsed.namespaceSpecific(1);
			const nft = await this._nftEntityStorage.get(nftId);

			if (Is.empty(nft)) {
				throw new NotFoundError(EntityStorageNftConnector.CLASS_NAME, "nftNotFound");
			}

			if (nft.issuer !== controllerIdentity) {
				throw new GeneralError(EntityStorageNftConnector.CLASS_NAME, "notControllerBurn");
			}

			await this._nftEntityStorage.remove(nftId);
		} catch (error) {
			throw new GeneralError(
				EntityStorageNftConnector.CLASS_NAME,
				"burningFailed",
				undefined,
				error
			);
		}
	}

	/**
	 * Transfer an NFT.
	 * @param controllerIdentity The controller of the NFT who can make changes.
	 * @param id The id of the NFT to transfer in urn format.
	 * @param recipientAddress The recipient address for the NFT.
	 * @param metadata Optional mutable data to include during the transfer.
	 * @returns A promise that resolves when the NFT ownership has been transferred.
	 */
	public async transfer<T = unknown>(
		controllerIdentity: string,
		id: string,
		recipientAddress: string,
		metadata?: T
	): Promise<void> {
		Guards.stringValue(
			EntityStorageNftConnector.CLASS_NAME,
			nameof(controllerIdentity),
			controllerIdentity
		);
		Urn.guard(EntityStorageNftConnector.CLASS_NAME, nameof(id), id);
		Guards.stringValue(
			EntityStorageNftConnector.CLASS_NAME,
			nameof(recipientAddress),
			recipientAddress
		);
		if (!Is.undefined(metadata)) {
			Guards.object(EntityStorageNftConnector.CLASS_NAME, nameof(metadata), metadata);
		}

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceMethod() !== EntityStorageNftConnector.NAMESPACE) {
			throw new GeneralError(EntityStorageNftConnector.CLASS_NAME, "namespaceMismatch", {
				namespace: EntityStorageNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const nftId = urnParsed.namespaceSpecific(1);
			const nft = await this._nftEntityStorage.get(nftId);

			if (Is.empty(nft)) {
				throw new NotFoundError(EntityStorageNftConnector.CLASS_NAME, "nftNotFound");
			}

			if (nft.issuer !== controllerIdentity) {
				throw new GeneralError(EntityStorageNftConnector.CLASS_NAME, "notControllerTransfer");
			}

			nft.owner = recipientAddress;
			nft.metadata = metadata;

			await this._nftEntityStorage.set(nft);
		} catch (error) {
			throw new GeneralError(
				EntityStorageNftConnector.CLASS_NAME,
				"transferFailed",
				undefined,
				error
			);
		}
	}

	/**
	 * Update the mutable data of the NFT.
	 * @param controllerIdentity The controller of the NFT who can make changes.
	 * @param id The id of the NFT to update in urn format.
	 * @param metadata The mutable data to update.
	 * @returns A promise that resolves when the NFT metadata has been updated.
	 */
	public async update<T = unknown>(
		controllerIdentity: string,
		id: string,
		metadata: T
	): Promise<void> {
		Guards.stringValue(
			EntityStorageNftConnector.CLASS_NAME,
			nameof(controllerIdentity),
			controllerIdentity
		);
		Urn.guard(EntityStorageNftConnector.CLASS_NAME, nameof(id), id);
		Guards.object<T>(EntityStorageNftConnector.CLASS_NAME, nameof(metadata), metadata);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceMethod() !== EntityStorageNftConnector.NAMESPACE) {
			throw new GeneralError(EntityStorageNftConnector.CLASS_NAME, "namespaceMismatch", {
				namespace: EntityStorageNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const nftId = urnParsed.namespaceSpecific(1);
			const nft = await this._nftEntityStorage.get(nftId);

			if (Is.empty(nft)) {
				throw new NotFoundError(EntityStorageNftConnector.CLASS_NAME, "nftNotFound");
			}

			if (nft.issuer !== controllerIdentity) {
				throw new GeneralError(EntityStorageNftConnector.CLASS_NAME, "notControllerUpdate");
			}

			nft.metadata = metadata;

			await this._nftEntityStorage.set(nft);
		} catch (error) {
			throw new GeneralError(
				EntityStorageNftConnector.CLASS_NAME,
				"updateFailed",
				undefined,
				error
			);
		}
	}
}
