// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { GuardError } from "@twin.org/core";
import type { IIrc27Metadata } from "@twin.org/nft-models";
import { HttpMethod } from "@twin.org/web";
import { NftRestClient } from "../src/nftRestClient.js";
import {
	createdResponse,
	jsonResponse,
	noContentResponse,
	setupFetchMock,
	teardownFetchMock
} from "./helpers/restClientTestHelpers.js";

// OpenAPI spec: ../../nft-service/docs/open-api/spec.json
const ENDPOINT = "http://localhost:8080";
const PREFIX = "nft";

const NFT_URN = "urn:nft:iota:test-nft-001";
const NFT_LOCATION = `${ENDPOINT}/${PREFIX}/${NFT_URN}`;

const TEST_IRC27_METADATA: IIrc27Metadata = {
	standard: "IRC27",
	version: "v1.0",
	type: "image/png",
	uri: "https://example.com/nft-image.png",
	name: "Test NFT"
};

const TEST_MUTABLE_METADATA = {
	description: "A test NFT mutable description",
	// eslint-disable-next-line camelcase
	attributes: [{ trait_type: "color", value: "blue" }]
};

const TEST_RESOLVE_RESPONSE = {
	issuer: "issuer-address-001",
	issuerIdentityId: "did:iota:test-identity-001",
	tag: "test-tag",
	immutableMetadata: TEST_IRC27_METADATA,
	metadata: TEST_MUTABLE_METADATA
};

const fetchMock = vi.fn();

describe("NftRestClient", () => {
	let client: NftRestClient;

	beforeEach(() => {
		setupFetchMock(fetchMock);
		client = new NftRestClient({ endpoint: ENDPOINT });
	});

	afterEach(() => {
		teardownFetchMock(fetchMock);
	});

	describe("mint", () => {
		test("throws when tag is empty", async () => {
			await expect(client.mint("")).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("sends POST to /{prefix}", async () => {
			fetchMock.mockResolvedValueOnce(createdResponse(NFT_LOCATION));

			await client.mint("test-tag");

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}`);
			expect(options.method).toBe(HttpMethod.POST);
		});

		test("sends tag in the request body", async () => {
			fetchMock.mockResolvedValueOnce(createdResponse(NFT_LOCATION));

			await client.mint("test-tag");

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.tag).toBe("test-tag");
		});

		test("sends immutableMetadata in the request body when provided", async () => {
			fetchMock.mockResolvedValueOnce(createdResponse(NFT_LOCATION));

			await client.mint("test-tag", TEST_IRC27_METADATA);

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.immutableMetadata).toEqual(TEST_IRC27_METADATA);
		});

		test("sends metadata in the request body when provided", async () => {
			fetchMock.mockResolvedValueOnce(createdResponse(NFT_LOCATION));

			await client.mint("test-tag", TEST_IRC27_METADATA, TEST_MUTABLE_METADATA);

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.metadata).toEqual(TEST_MUTABLE_METADATA);
		});

		test("sends namespace in the request body when provided", async () => {
			fetchMock.mockResolvedValueOnce(createdResponse(NFT_LOCATION));

			await client.mint("test-tag", undefined, undefined, "custom-namespace");

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.namespace).toBe("custom-namespace");
		});

		test("returns the Location header value as the new NFT id", async () => {
			fetchMock.mockResolvedValueOnce(createdResponse(NFT_LOCATION));

			const id = await client.mint("test-tag");

			expect(id).toBe(NFT_LOCATION);
		});
	});

	describe("resolve", () => {
		test("throws when id is empty", async () => {
			await expect(client.resolve("")).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("sends GET to /{prefix}/:id", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_RESOLVE_RESPONSE));

			await client.resolve(NFT_URN);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/${NFT_URN}`);
			expect(options.method).toBe(HttpMethod.GET);
		});

		test("returns the NFT data from the response body", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_RESOLVE_RESPONSE));

			const result = await client.resolve(NFT_URN);

			expect(result).toEqual(TEST_RESOLVE_RESPONSE);
		});
	});

	describe("burn", () => {
		test("throws when id is not a URN", async () => {
			await expect(client.burn("not-a-urn")).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.urn"
			});
		});

		test("sends DELETE to /{prefix}/:id", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());

			await client.burn(NFT_URN);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/${NFT_URN}`);
			expect(options.method).toBe(HttpMethod.DELETE);
		});

		test("resolves without a return value", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());

			await expect(client.burn(NFT_URN)).resolves.toBeUndefined();
		});
	});

	describe("transfer", () => {
		test("throws when id is empty", async () => {
			await expect(client.transfer("", "recipient-address-001")).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("throws when recipientAddress is empty", async () => {
			await expect(client.transfer(NFT_URN, "")).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("sends POST to /{prefix}/:id/transfer", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());

			await client.transfer(NFT_URN, "recipient-address-001");

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/${NFT_URN}/transfer`);
			expect(options.method).toBe(HttpMethod.POST);
		});

		test("sends recipientAddress in the request body", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());

			await client.transfer(NFT_URN, "recipient-address-001");

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.recipientAddress).toBe("recipient-address-001");
		});

		test("sends metadata in the request body when provided", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());

			await client.transfer(NFT_URN, "recipient-address-001", TEST_MUTABLE_METADATA);

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.metadata).toEqual(TEST_MUTABLE_METADATA);
		});

		test("resolves without a return value", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());

			await expect(client.transfer(NFT_URN, "recipient-address-001")).resolves.toBeUndefined();
		});
	});

	describe("update", () => {
		test("throws when id is empty", async () => {
			await expect(client.update("", TEST_MUTABLE_METADATA)).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("sends PUT to /{prefix}/:id", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());

			await client.update(NFT_URN, TEST_MUTABLE_METADATA);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/${NFT_URN}`);
			expect(options.method).toBe(HttpMethod.PUT);
		});

		test("sends metadata in the request body", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());

			await client.update(NFT_URN, TEST_MUTABLE_METADATA);

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.metadata).toEqual(TEST_MUTABLE_METADATA);
		});

		test("resolves without a return value", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());

			await expect(client.update(NFT_URN, TEST_MUTABLE_METADATA)).resolves.toBeUndefined();
		});
	});
});
