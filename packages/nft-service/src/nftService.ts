// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	HealthCategory,
	HealthStatus,
	type HealthApplicationCallback,
	type IHealth,
	type IHealthProviderComponent
} from "@twin.org/api-models";
import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import { BaseError, ComponentFactory, GeneralError, Guards, Is, Urn } from "@twin.org/core";
import { nameof } from "@twin.org/nameof";
import {
	NftConnectorFactory,
	NftMetricIds,
	NftMetrics,
	type INftComponent,
	type INftConnector
} from "@twin.org/nft-models";
import { MetricHelper, type ITelemetryComponent } from "@twin.org/telemetry-models";
import type { INftServiceConstructorOptions } from "./models/INftServiceConstructorOptions.js";

/**
 * Service for performing NFT operations to a connector.
 */
export class NftService implements INftComponent, IHealthProviderComponent {
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
	 * The optional telemetry component for recording metrics.
	 * @internal
	 */
	private readonly _telemetryComponent?: ITelemetryComponent;

	/**
	 * Create a new instance of NftService.
	 * @param options The options for the service.
	 * @throws GeneralError If no NFT connectors are registered.
	 */
	constructor(options?: INftServiceConstructorOptions) {
		const names = NftConnectorFactory.names();
		if (names.length === 0) {
			throw new GeneralError(NftService.CLASS_NAME, "noConnectors");
		}

		this._defaultNamespace = options?.config?.defaultNamespace ?? names[0];
		this._telemetryComponent = ComponentFactory.getIfExists<ITelemetryComponent>(
			options?.telemetryComponentType
		);
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name.
	 */
	public className(): string {
		return NftService.CLASS_NAME;
	}

	/**
	 * Registers the NFT metrics with the telemetry component.
	 */
	public async start(): Promise<void> {
		if (Is.undefined(this._telemetryComponent)) {
			return;
		}
		await MetricHelper.createMetrics(this._telemetryComponent, NftMetrics);
	}

	/**
	 * Returns the application health status by running a full NFT lifecycle (mint, resolve, burn)
	 * using the organisation identity from the current context.
	 * @param callback The callback to invoke when a deferred health result is ready.
	 * @returns The health status of the service.
	 */
	public async healthApplication(
		callback: HealthApplicationCallback
	): Promise<IHealth[] | undefined> {
		const contextIds = (await ContextIdStore.getContextIds()) ?? {};
		const orgId = contextIds[ContextIdKeys.Organization];

		if (!Is.stringValue(orgId)) {
			return [];
		}

		try {
			const connector = NftConnectorFactory.get<INftConnector>(this._defaultNamespace);
			const nftId = await connector.mint(orgId, "TWIN-HEALTH", { type: "HealthCheck" }, undefined);
			const resolved = await connector.resolve(nftId);
			await connector.burn(orgId, nftId);
			return [
				{
					source: NftService.CLASS_NAME,
					category: HealthCategory.Application,
					status: Is.object(resolved) ? HealthStatus.Ok : HealthStatus.Error,
					description: "healthDescription",
					message: Is.object(resolved) ? undefined : "resolveNftFailed"
				}
			];
		} catch (error) {
			return [
				{
					source: NftService.CLASS_NAME,
					category: HealthCategory.Application,
					status: HealthStatus.Error,
					description: "healthDescription",
					message: "resolveNftFailed",
					error: BaseError.fromError(error)
				}
			];
		}
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

			await MetricHelper.metricIncrement(this._telemetryComponent, NftMetricIds.TokensMinted, {
				namespace: connectorNamespace
			});

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

			await MetricHelper.metricIncrement(this._telemetryComponent, NftMetricIds.TokensResolved);

			return result;
		} catch (error) {
			throw new GeneralError(NftService.CLASS_NAME, "resolveFailed", undefined, error);
		}
	}

	/**
	 * Burn an NFT.
	 * @param id The id of the NFT to burn in urn format.
	 * @param controllerIdentity The identity to perform the nft operation with.
	 * @returns A promise that resolves when the NFT has been permanently destroyed.
	 */
	public async burn(id: string, controllerIdentity?: string): Promise<void> {
		Urn.guard(NftService.CLASS_NAME, nameof(id), id);
		Guards.stringValue(NftService.CLASS_NAME, nameof(controllerIdentity), controllerIdentity);

		try {
			const nftConnector = this.getConnector(id);
			await nftConnector.burn(controllerIdentity, id);

			await MetricHelper.metricIncrement(this._telemetryComponent, NftMetricIds.TokensBurned);
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
	 * @returns A promise that resolves when the NFT ownership has been transferred.
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

			await MetricHelper.metricIncrement(this._telemetryComponent, NftMetricIds.TokensTransferred);
		} catch (error) {
			throw new GeneralError(NftService.CLASS_NAME, "transferFailed", undefined, error);
		}
	}

	/**
	 * Update the mutable data of the NFT.
	 * @param id The id of the NFT to update in urn format.
	 * @param metadata The mutable data to update.
	 * @param controllerIdentity The identity to perform the nft operation with.
	 * @returns A promise that resolves when the NFT metadata has been updated.
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

			await MetricHelper.metricIncrement(this._telemetryComponent, NftMetricIds.TokensUpdated);
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
