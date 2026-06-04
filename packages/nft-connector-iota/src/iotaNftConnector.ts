// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IotaObjectResponse } from "@iota/iota-sdk/client";
import {
	BaseError,
	ComponentFactory,
	GeneralError,
	Guards,
	Is,
	NotFoundError,
	StringHelper,
	Urn
} from "@twin.org/core";
import {
	type IContractData,
	type ISmartContractDeployments,
	type NetworkTypes,
	Iota,
	IotaIdentityUtils,
	type IIotaClient
} from "@twin.org/dlt-iota";
import type { ILoggingComponent } from "@twin.org/logging-models";
import { nameof } from "@twin.org/nameof";
import type { INftConnector } from "@twin.org/nft-models";
import { VaultConnectorFactory, type IVaultConnector } from "@twin.org/vault-models";
import compiledModulesJson from "./contracts/smartContractDeployments/smart-contract-deployments.json" with { type: "json" };
import { IotaNftUtils } from "./iotaNftUtils.js";
import type { IIotaNftConnectorConfig } from "./models/IIotaNftConnectorConfig.js";
import type { IIotaNftConnectorConstructorOptions } from "./models/IIotaNftConnectorConstructorOptions.js";
import type { INftFields } from "./models/INftFields.js";

/**
 * Class for performing NFT operations on IOTA.
 */
export class IotaNftConnector implements INftConnector {
	/**
	 * The namespace supported by the nft connector.
	 */
	public static readonly NAMESPACE: string = "iota";

	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<IotaNftConnector>();

	/**
	 * Gas budget for transactions.
	 * @internal
	 */
	private readonly _gasBudget: number;

	/**
	 * Connector for vault operations.
	 * @internal
	 */
	private readonly _vaultConnector: IVaultConnector;

	/**
	 * The configuration for the connector.
	 * @internal
	 */
	private readonly _config: IIotaNftConnectorConfig;

	/**
	 * The IOTA client.
	 * @internal
	 */
	private readonly _client: IIotaClient;

	/**
	 * The name of the contract to use.
	 * @internal
	 */
	private readonly _contractName: string;

	/**
	 * The package ID of the deployed NFT Move module.
	 * @internal
	 */
	private _deployedPackageId?: string;

	/**
	 * The logging component.
	 * @internal
	 */
	private readonly _logging?: ILoggingComponent;

	/**
	 * The deployment configuration to use for contract interactions.
	 * @internal
	 */
	private readonly _deploymentConfig: ISmartContractDeployments;

	/**
	 * Create a new instance of IotaNftConnector.
	 * @param options The options for the connector.
	 */
	constructor(options: IIotaNftConnectorConstructorOptions) {
		Guards.object(IotaNftConnector.CLASS_NAME, nameof(options), options);
		Guards.object<IIotaNftConnectorConfig>(
			IotaNftConnector.CLASS_NAME,
			nameof(options.config),
			options.config
		);
		Guards.object<IIotaNftConnectorConfig["clientOptions"]>(
			IotaNftConnector.CLASS_NAME,
			nameof(options.config.clientOptions),
			options.config.clientOptions
		);
		this._vaultConnector = VaultConnectorFactory.get(options.vaultConnectorType ?? "vault");

		this._logging = ComponentFactory.getIfExists(options?.loggingComponentType ?? "logging");

		this._config = options.config;

		this._deploymentConfig = options.deploymentConfig ?? compiledModulesJson;

		this._contractName = this._config.contractName ?? "nft";
		Guards.stringValue(IotaNftConnector.CLASS_NAME, nameof(this._contractName), this._contractName);

		this._gasBudget = this._config.gasBudget ?? 1_000_000_000;
		Guards.number(IotaNftConnector.CLASS_NAME, nameof(this._gasBudget), this._gasBudget);
		if (this._gasBudget <= 0) {
			throw new GeneralError(IotaNftConnector.CLASS_NAME, "invalidGasBudget", {
				gasBudget: this._gasBudget
			});
		}

		Iota.populateConfig(this._config);
		this._client = Iota.createClient(this._config);
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return IotaNftConnector.CLASS_NAME;
	}

	/**
	 * Bootstrap the NFT contract.
	 * @param nodeLoggingComponentType The node logging component type.
	 * @returns void.
	 */
	public async start(nodeLoggingComponentType?: string): Promise<void> {
		const nodeLogging = ComponentFactory.getIfExists<ILoggingComponent>(nodeLoggingComponentType);

		try {
			let deploymentPackageId: string | undefined = this._config.deploymentPkgId;

			if (!Is.stringValue(deploymentPackageId)) {
				const contractData = this._deploymentConfig[this._config.network as NetworkTypes];

				if (!Is.objectValue<IContractData>(contractData)) {
					throw new GeneralError(IotaNftConnector.CLASS_NAME, "contractDataNotFound", {
						network: this._config.network,
						availableNetworks: Object.keys(this._deploymentConfig)
					});
				}

				deploymentPackageId = contractData.deployedPackageId;
			}

			if (!Is.stringValue(deploymentPackageId)) {
				throw new GeneralError(IotaNftConnector.CLASS_NAME, "deployedPackageIdRequired", {
					network: this._config.network
				});
			}

			this._deployedPackageId = deploymentPackageId;

			if (!this._deployedPackageId) {
				throw new GeneralError(IotaNftConnector.CLASS_NAME, "packageIdNotFound", {
					network: this._config.network
				});
			}

			const packageExists = await Iota.packageExistsOnNetwork(
				this._client,
				this._deployedPackageId
			);

			if (!packageExists) {
				throw new GeneralError(IotaNftConnector.CLASS_NAME, "packageNotFoundOnNetwork", {
					network: this._config.network,
					deployedPackageId: this._deployedPackageId
				});
			}

			await nodeLogging?.log({
				level: "info",
				source: IotaNftConnector.CLASS_NAME,
				ts: Date.now(),
				message: "contractReady",
				data: {
					network: this._config.network,
					deployedPackageId: this._deployedPackageId
				}
			});
		} catch (error) {
			await nodeLogging?.log({
				level: "error",
				source: IotaNftConnector.CLASS_NAME,
				ts: Date.now(),
				message: "startFailed",
				error: BaseError.fromError(error),
				data: { network: this._config.network }
			});

			throw error;
		}
	}

	/**
	 * Mint an NFT.
	 * @param controllerIdentity The identity of the user to access the vault keys.
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
		Guards.stringValue(IotaNftConnector.CLASS_NAME, nameof(controllerIdentity), controllerIdentity);
		Guards.stringValue(IotaNftConnector.CLASS_NAME, nameof(tag), tag);

		try {
			const packageId = this.getPackageId();

			const txb = Iota.createTransaction();
			txb.setGasBudget(this._gasBudget);

			const address = await Iota.getAddress(
				this._vaultConnector,
				this._config,
				controllerIdentity,
				this._config.accountAddressIndex ?? 0,
				this._config.walletAddressIndex ?? 0
			);

			const metadataString = metadata ? JSON.stringify(metadata) : "";
			const immutableMetadataString = immutableMetadata ? JSON.stringify(immutableMetadata) : "";

			const moduleName = this.getModuleName();

			const capInfo = await IotaIdentityUtils.getControllerCapInfo(
				controllerIdentity,
				address,
				this._client
			);

			txb.moveCall({
				target: `${packageId}::${moduleName}::mint_with_identity`,
				arguments: [
					txb.pure.string(immutableMetadataString),
					txb.pure.string(tag),
					txb.pure.string(metadataString),
					txb.object(capInfo.identityObjectId),
					txb.object(capInfo.controllerCapObjectId)
				]
			});

			const result = await Iota.prepareAndPostTransaction(
				this._config,
				this._vaultConnector,
				this._logging,
				controllerIdentity,
				this._client,
				address,
				txb,
				{
					dryRunLabel: this._config.enableCostLogging ? "mint" : undefined
				}
			);

			const createdObjectId = result.effects?.created?.[0]?.reference?.objectId;

			if (!Is.stringValue(createdObjectId)) {
				throw new GeneralError(IotaNftConnector.CLASS_NAME, "failedToGetNftId", undefined);
			}

			const urn = new Urn(
				"nft",
				`${IotaNftConnector.NAMESPACE}:${this._config.network}:${this._deployedPackageId}:${createdObjectId}`
			);

			return urn.toString();
		} catch (error) {
			throw new GeneralError(
				IotaNftConnector.CLASS_NAME,
				"mintingFailed",
				undefined,
				Iota.extractPayloadError(error)
			);
		}
	}

	/**
	 * Resolve an NFT to get its details.
	 * @param nftId The id of the NFT to resolve.
	 * @returns The NFT details.
	 */
	public async resolve<T = unknown, U = unknown>(
		nftId: string
	): Promise<{
		issuer: string;
		issuerIdentityId: string;
		tag: string;
		immutableMetadata?: T;
		metadata?: U;
	}> {
		Guards.stringValue(IotaNftConnector.CLASS_NAME, nameof(nftId), nftId);

		try {
			const objectId = IotaNftUtils.nftIdToObjectId(nftId);
			const object = await this._client.getObject({
				id: objectId,
				options: { showContent: true, showType: true, showOwner: true }
			});

			if (!object.data?.content) {
				throw new NotFoundError(IotaNftConnector.CLASS_NAME, "nftNotFound", nftId);
			}

			// Because object.data.content is of type IotaParsedData
			const parsedData = object.data.content as unknown as { fields: INftFields };

			const content = parsedData.fields;

			let immutableMetadata: T | undefined;
			if (content.immutable_metadata) {
				try {
					immutableMetadata = JSON.parse(content.immutable_metadata) as T;
				} catch (error) {
					throw new GeneralError(
						IotaNftConnector.CLASS_NAME,
						"invalidImmutableMetadata",
						{ nftId },
						error
					);
				}
			}

			// Parse mutable metadata if it's JSON
			let metadata: U | undefined;
			if (content.metadata) {
				try {
					metadata = JSON.parse(content.metadata) as U;
				} catch (error) {
					throw new GeneralError(IotaNftConnector.CLASS_NAME, "invalidMetadata", { nftId }, error);
				}
			}

			return {
				issuer: content.issuer?.toString(),
				issuerIdentityId: content.issuerIdentityId?.toString(),
				tag: content.tag?.toString(),
				immutableMetadata,
				metadata
			};
		} catch (error) {
			throw new GeneralError(
				IotaNftConnector.CLASS_NAME,
				"resolvingFailed",
				undefined,
				Iota.extractPayloadError(error)
			);
		}
	}

	/**
	 * Burn an NFT.
	 * @param controllerIdentity The controller of the NFT who can make changes.
	 * @param id The id of the NFT to burn in urn format.
	 * @returns void.
	 */
	public async burn(controllerIdentity: string, id: string): Promise<void> {
		Guards.stringValue(IotaNftConnector.CLASS_NAME, nameof(controllerIdentity), controllerIdentity);
		Urn.guard(IotaNftConnector.CLASS_NAME, nameof(id), id);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceMethod() !== IotaNftConnector.NAMESPACE) {
			throw new GeneralError(IotaNftConnector.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const txb = Iota.createTransaction();
			txb.setGasBudget(this._gasBudget);

			const objectId = IotaNftUtils.nftIdToObjectId(id);
			const packageId = IotaNftUtils.nftIdToPackageId(id);
			const moduleName = this.getModuleName();

			txb.moveCall({
				target: `${packageId}::${moduleName}::burn`,
				arguments: [txb.object(objectId)]
			});

			const object = await this._client.getObject({
				id: objectId,
				options: { showContent: true, showType: true, showOwner: true }
			});

			const ownerAddress = this.getOwnerAddress(id, object);

			const result = await Iota.prepareAndPostTransaction(
				this._config,
				this._vaultConnector,
				this._logging,
				controllerIdentity,
				this._client,
				ownerAddress,
				txb,
				{
					dryRunLabel: this._config.enableCostLogging ? "burn" : undefined
				}
			);

			if (result.effects?.status?.status !== "success") {
				throw new GeneralError(IotaNftConnector.CLASS_NAME, "burningFailed", {
					error: result.effects?.status?.error
				});
			}
		} catch (error) {
			throw new GeneralError(
				IotaNftConnector.CLASS_NAME,
				"burningFailed",
				undefined,
				Iota.extractPayloadError(error)
			);
		}
	}

	/**
	 * Transfer an NFT to a new owner.
	 * @param controller The identity of the user to access the vault keys.
	 * @param nftId The id of the NFT to transfer.
	 * @param recipientAddress The recipient address for the NFT.
	 * @param metadata Optional metadata to update during transfer.
	 * @returns void.
	 */
	public async transfer<U = unknown>(
		controller: string,
		nftId: string,
		recipientAddress: string,
		metadata?: U
	): Promise<void> {
		Guards.stringValue(IotaNftConnector.CLASS_NAME, nameof(controller), controller);
		Guards.stringValue(IotaNftConnector.CLASS_NAME, nameof(nftId), nftId);
		Guards.stringValue(IotaNftConnector.CLASS_NAME, nameof(recipientAddress), recipientAddress);
		if (!Is.undefined(metadata)) {
			Guards.object(IotaNftConnector.CLASS_NAME, nameof(metadata), metadata);
		}

		const urnParsed = Urn.fromValidString(nftId);
		if (urnParsed.namespaceMethod() !== IotaNftConnector.NAMESPACE) {
			throw new GeneralError(IotaNftConnector.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaNftConnector.NAMESPACE,
				id: nftId
			});
		}

		try {
			const txb = Iota.createTransaction();
			txb.setGasBudget(this._gasBudget);

			const objectId = IotaNftUtils.nftIdToObjectId(nftId);
			const packageId = IotaNftUtils.nftIdToPackageId(nftId);
			const moduleName = this.getModuleName();

			const object = await this._client.getObject({
				id: objectId,
				options: { showContent: true, showType: true, showOwner: true }
			});

			const ownerAddress = this.getOwnerAddress(nftId, object);

			// Verify ownership — compare on-chain owner address against the controller's wallet address
			const controllerAddress = await Iota.getAddress(
				this._vaultConnector,
				this._config,
				controller,
				this._config.accountAddressIndex ?? 0,
				this._config.walletAddressIndex ?? 0
			);
			if (ownerAddress !== controllerAddress) {
				throw new GeneralError(IotaNftConnector.CLASS_NAME, "transferFailed", {
					currentOwner: ownerAddress,
					controller
				});
			}

			if (!Is.undefined(metadata)) {
				// If metadata is provided, use transfer_with_metadata
				const metadataString = JSON.stringify(metadata);
				txb.moveCall({
					target: `${packageId}::${moduleName}::transfer_with_metadata`,
					arguments: [
						txb.object(objectId),
						txb.pure.address(recipientAddress),
						txb.pure.string(metadataString)
					]
				});
			} else {
				txb.moveCall({
					target: `${packageId}::${moduleName}::transfer`,
					arguments: [txb.object(objectId), txb.pure.address(recipientAddress)]
				});
			}

			const result = await Iota.prepareAndPostTransaction(
				this._config,
				this._vaultConnector,
				this._logging,
				controller,
				this._client,
				ownerAddress,
				txb,
				{
					dryRunLabel: this._config.enableCostLogging ? "transfer" : undefined
				}
			);

			if (result.effects?.status?.status !== "success") {
				throw new GeneralError(IotaNftConnector.CLASS_NAME, "transferFailed", {
					error: result.effects?.status?.error
				});
			}
		} catch (error) {
			throw new GeneralError(
				IotaNftConnector.CLASS_NAME,
				"transferFailed",
				undefined,
				Iota.extractPayloadError(error)
			);
		}
	}

	/**
	 * Update the mutable data of an NFT.
	 * @param controllerIdentity The controller of the NFT who can make changes.
	 * @param id The id of the NFT to update in urn format.
	 * @param metadata The new metadata for the NFT.
	 * @returns void.
	 */
	public async update<U = unknown>(
		controllerIdentity: string,
		id: string,
		metadata: U
	): Promise<void> {
		Guards.stringValue(IotaNftConnector.CLASS_NAME, nameof(controllerIdentity), controllerIdentity);
		Urn.guard(IotaNftConnector.CLASS_NAME, nameof(id), id);
		Guards.object(IotaNftConnector.CLASS_NAME, nameof(metadata), metadata);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceMethod() !== IotaNftConnector.NAMESPACE) {
			throw new GeneralError(IotaNftConnector.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const packageId = this.getPackageId();

			const txb = Iota.createTransaction();
			txb.setGasBudget(this._gasBudget);

			const objectId = IotaNftUtils.nftIdToObjectId(id);

			// Convert metadata to string for storage
			const metadataString = JSON.stringify(metadata);

			const moduleName = this.getModuleName();

			txb.moveCall({
				target: `${packageId}::${moduleName}::update_metadata`,
				arguments: [txb.object(objectId), txb.pure.string(metadataString)]
			});

			const object = await this._client.getObject({
				id: objectId,
				options: { showContent: true, showType: true, showOwner: true }
			});

			const ownerAddress = this.getOwnerAddress(id, object);

			const result = await Iota.prepareAndPostTransaction(
				this._config,
				this._vaultConnector,
				this._logging,
				controllerIdentity,
				this._client,
				ownerAddress,
				txb,
				{
					dryRunLabel: this._config.enableCostLogging ? "update" : undefined
				}
			);

			if (result.effects?.status?.status !== "success") {
				throw new GeneralError(IotaNftConnector.CLASS_NAME, "updateFailed", {
					error: result.effects?.status?.error
				});
			}
		} catch (error) {
			throw new GeneralError(
				IotaNftConnector.CLASS_NAME,
				"updateFailed",
				undefined,
				Iota.extractPayloadError(error)
			);
		}
	}

	/**
	 * Get the package ID for the smart contract.
	 * @returns The package ID.
	 * @throws GeneralError if the package ID is not initialized.
	 * @internal
	 */
	private getPackageId(): string {
		if (!Is.stringValue(this._deployedPackageId)) {
			throw new GeneralError(IotaNftConnector.CLASS_NAME, "packageIdNotInitialised");
		}
		return this._deployedPackageId;
	}

	/**
	 * Get the module name based on the contract name.
	 * @returns The module name in snake_case.
	 * @internal
	 */
	private getModuleName(): string {
		return StringHelper.snakeCase(this._contractName);
	}

	/**
	 * Get the owner address of an NFT.
	 * @param nftId The id of the NFT.
	 * @param object The object to get the owner from.
	 * @returns The owner address.
	 * @throws GeneralError If the owner address cannot be found.
	 * @internal
	 */
	private getOwnerAddress(nftId: string, object?: IotaObjectResponse): string {
		const owner = object?.data?.owner;

		if (Is.object(owner)) {
			if ("AddressOwner" in owner) {
				return owner.AddressOwner;
			} else if ("ObjectOwner" in owner) {
				return owner.ObjectOwner;
			}
			// Shared ownership is handled as null
		}

		throw new GeneralError(IotaNftConnector.CLASS_NAME, "nftOwnerNftFound", { nftId });
	}
}
