// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	HttpContextIdKeys,
	HttpHeaderHelper,
	HttpUrlHelper,
	type ICreatedResponse,
	type IHttpRequestContext,
	type INoContentResponse,
	type IRestRoute,
	type ITag
} from "@3sixty/api-models";
import { ContextIdHelper, ContextIdKeys, ContextIdStore } from "@3sixty/context";
import { ComponentFactory, Guards } from "@3sixty/core";
import { nameof } from "@3sixty/nameof";
import type {
	INftBurnRequest,
	INftComponent,
	INftMintRequest,
	INftResolveRequest,
	INftResolveResponse,
	INftTransferRequest,
	INftUpdateRequest
} from "@3sixty/nft-models";
import { HeaderTypes, HttpStatusCode, type IHttpHeaders } from "@3sixty/web";

/**
 * The source used when communicating about these routes.
 */
const ROUTES_SOURCE = "nftRoutes";

/**
 * The tag to associate with the routes.
 */
export const tagsNft: ITag[] = [
	{
		name: "NFT",
		description: "Endpoints which are modelled to access an NFT contract."
	}
];

/**
 * The REST routes for NFT.
 * @param baseRouteName Prefix to prepend to the paths.
 * @param componentName The name of the component to use in the routes stored in the ComponentFactory.
 * @returns The generated routes.
 */
export function generateRestRoutesNft(baseRouteName: string, componentName: string): IRestRoute[] {
	const mintRoute: IRestRoute<INftMintRequest, ICreatedResponse> = {
		operationId: "nftMint",
		summary: "Mint an NFT",
		tag: tagsNft[0].name,
		method: "POST",
		path: `${baseRouteName}/`,
		handler: async (httpRequestContext, request) =>
			nftMint(httpRequestContext, componentName, request, baseRouteName),
		requestType: {
			type: nameof<INftMintRequest>(),
			examples: [
				{
					id: "nftMintExample",
					request: {
						body: {
							tag: "MY-NFT",
							immutableMetadata: {
								docName: "bill-of-lading",
								mimeType: "application/pdf",
								fingerprint: "0xf0b95a98b3dbc5ce1c9ce59d70af95a97599f100a7296ecdd1eb108bebfa047f"
							},
							metadata: {
								data: "tst1prctjk5ck0dutnsunnje6u90jk5htx03qznjjmkd6843pzltlgz87srjzzv"
							}
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<ICreatedResponse>(),
				examples: [
					{
						id: "nftMintResponseExample",
						response: {
							statusCode: HttpStatusCode.created,
							headers: {
								[HeaderTypes.Location]:
									"nft:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
							}
						}
					}
				]
			}
		]
	};

	const resolveRoute: IRestRoute<INftResolveRequest, INftResolveResponse> = {
		operationId: "nftResolve",
		summary: "Resolve an NFT",
		tag: tagsNft[0].name,
		method: "GET",
		path: `${baseRouteName}/:id`,
		handler: async (httpRequestContext, request) =>
			nftResolve(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<INftResolveRequest>(),
			examples: [
				{
					id: "nftResolveExample",
					request: {
						pathParams: {
							id: "nft:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<INftResolveResponse>(),
				examples: [
					{
						id: "nftResolveResponseExample",
						response: {
							body: {
								issuer: "0x85ef62ea94fc4eeeeeddf6acc3b566e988e613081d0b93cc54ed831ed4c18d44",
								issuerIdentityId:
									"0xa1d80bee7fdb4fd91ae45c6e539209f73cb743b7da9db3e21322ea75af1878c0",
								tag: "MY-NFT",
								immutableMetadata: {
									docName: "bill-of-lading",
									mimeType: "application/pdf",
									fingerprint: "0xf0b95a98b3dbc5ce1c9ce59d70af95a97599f100a7296ecdd1eb108bebfa047f"
								},
								metadata: {
									data: "AAAAA"
								}
							}
						}
					}
				]
			}
		]
	};

	const burnRoute: IRestRoute<INftBurnRequest, INoContentResponse> = {
		operationId: "nftBurn",
		summary: "Burn an NFT",
		tag: tagsNft[0].name,
		method: "DELETE",
		path: `${baseRouteName}/:id`,
		handler: async (httpRequestContext, request) =>
			nftBurn(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<INftBurnRequest>(),
			examples: [
				{
					id: "nftBurnExample",
					request: {
						pathParams: {
							id: "nft:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<INoContentResponse>()
			}
		]
	};

	const transferRoute: IRestRoute<INftTransferRequest, INoContentResponse> = {
		operationId: "nftTransfer",
		summary: "Transfer an NFT",
		tag: tagsNft[0].name,
		method: "POST",
		path: `${baseRouteName}/:id/transfer`,
		handler: async (httpRequestContext, request) =>
			nftTransfer(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<INftTransferRequest>(),
			examples: [
				{
					id: "nftTransferExample",
					request: {
						pathParams: {
							id: "nft:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
						},
						body: {
							recipientAddress: "tst1prctjk5ck0dutnsunnje6u90jk5htx03qznjjmkd6843pzltlgz87srjzzv",
							metadata: {
								data: "AAAAA"
							}
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<INoContentResponse>()
			}
		]
	};

	const updateRoute: IRestRoute<INftUpdateRequest, INoContentResponse> = {
		operationId: "nftUpdate",
		summary: "Update an NFT",
		tag: tagsNft[0].name,
		method: "PUT",
		path: `${baseRouteName}/:id`,
		handler: async (httpRequestContext, request) =>
			nftUpdate(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<INftUpdateRequest>(),
			examples: [
				{
					id: "nftUpdateExample",
					request: {
						pathParams: {
							id: "nft:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
						},
						body: {
							metadata: {
								data: "AAAAA"
							}
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<INoContentResponse>()
			}
		]
	};

	return [mintRoute, resolveRoute, burnRoute, transferRoute, updateRoute];
}

/**
 * Mint an NFT.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @param baseRouteName The base route name for the API.
 * @returns A created response containing the location header with the new NFT id.
 */
export async function nftMint(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: INftMintRequest,
	baseRouteName: string
): Promise<ICreatedResponse> {
	Guards.object<INftMintRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<INftMintRequest["body"]>(ROUTES_SOURCE, nameof(request.body), request.body);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.body.tag), request.body.tag);

	const contextIds = await ContextIdStore.getContextIds();
	ContextIdHelper.guard(contextIds, ContextIdKeys.Organization);

	const component = ComponentFactory.get<INftComponent>(componentName);
	const id = await component.mint(
		request.body.tag,
		request.body.immutableMetadata,
		request.body.metadata,
		request.body.namespace,
		contextIds[ContextIdKeys.Organization]
	);

	const publicOrigin = contextIds?.[HttpContextIdKeys.PublicOrigin];

	const headers: IHttpHeaders = {};
	HttpHeaderHelper.buildId(
		headers,
		id,
		HttpUrlHelper.combineOriginPath(publicOrigin, `${baseRouteName}/users/:id`)
	);

	return {
		statusCode: HttpStatusCode.created,
		headers
	};
}

/**
 * Resolve an NFT.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns A response containing the resolved NFT data.
 */
export async function nftResolve(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: INftResolveRequest
): Promise<INftResolveResponse> {
	Guards.object<INftResolveRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<INftResolveRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const contextIds = await ContextIdStore.getContextIds();
	ContextIdHelper.guard(contextIds, ContextIdKeys.Organization);

	const component = ComponentFactory.get<INftComponent>(componentName);
	const result = await component.resolve(
		request.pathParams.id,
		contextIds[ContextIdKeys.Organization]
	);
	return {
		body: result
	};
}

/**
 * Burn an NFT.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns A no-content response indicating the NFT was burned successfully.
 */
export async function nftBurn(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: INftBurnRequest
): Promise<INoContentResponse> {
	Guards.object<INftBurnRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<INftBurnRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const contextIds = await ContextIdStore.getContextIds();
	ContextIdHelper.guard(contextIds, ContextIdKeys.Organization);

	const component = ComponentFactory.get<INftComponent>(componentName);
	await component.burn(request.pathParams.id, contextIds[ContextIdKeys.Organization]);

	return {
		statusCode: HttpStatusCode.noContent
	};
}

/**
 * Transfer an NFT.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns A no-content response indicating the NFT was transferred successfully.
 */
export async function nftTransfer(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: INftTransferRequest
): Promise<INoContentResponse> {
	Guards.object<INftTransferRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<INftTransferRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);
	Guards.object<INftTransferRequest["body"]>(ROUTES_SOURCE, nameof(request.body), request.body);
	Guards.stringValue(
		ROUTES_SOURCE,
		nameof(request.body.recipientAddress),
		request.body.recipientAddress
	);
	const contextIds = await ContextIdStore.getContextIds();
	ContextIdHelper.guard(contextIds, ContextIdKeys.Organization);

	const component = ComponentFactory.get<INftComponent>(componentName);
	await component.transfer(
		request.pathParams.id,
		request.body.recipientAddress,
		request.body.metadata,
		contextIds[ContextIdKeys.Organization]
	);

	return {
		statusCode: HttpStatusCode.noContent
	};
}

/**
 * Update an NFT.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns A no-content response indicating the NFT metadata was updated successfully.
 */
export async function nftUpdate(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: INftUpdateRequest
): Promise<INoContentResponse> {
	Guards.object<INftUpdateRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<INftUpdateRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);
	Guards.object<INftUpdateRequest["body"]>(ROUTES_SOURCE, nameof(request.body), request.body);
	Guards.object(ROUTES_SOURCE, nameof(request.body.metadata), request.body.metadata);

	const contextIds = await ContextIdStore.getContextIds();
	ContextIdHelper.guard(contextIds, ContextIdKeys.Organization);

	const component = ComponentFactory.get<INftComponent>(componentName);
	await component.update(
		request.pathParams.id,
		request.body.metadata,
		contextIds[ContextIdKeys.Organization]
	);

	return {
		statusCode: HttpStatusCode.noContent
	};
}
