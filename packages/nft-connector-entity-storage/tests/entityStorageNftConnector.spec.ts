// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Urn } from "@3sixty/core";
import type { MemoryEntityStorageConnector } from "@3sixty/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@3sixty/entity-storage-models";
import type { IIrc27Metadata } from "@3sixty/nft-models";
import { TEST_ADDRESS_2, TEST_USER_IDENTITY } from "./setupTestEnv.js";
import type { Nft } from "../src/entities/nft.js";
import { EntityStorageNftConnector } from "../src/entityStorageNftConnector.js";

const immutableMetadata: IIrc27Metadata = {
	standard: "IRC27",
	version: "v1.0",
	type: "video/mp4",
	uri: "https://ipfs.io/ipfs/QmPoYcVm9fx47YXNTkhpMEYSxCD3Bqh7PJYr7eo5YjLgiT",
	name: "Test Name",
	collectionName: "Test Collection",
	issuerName: "Test Issuer",
	description: "Test Description"
};

describe("EntityStorageNftConnector", () => {
	afterEach(async () => {
		await EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<Nft>>("nft").teardown();
	});

	test("Can mint an NFT with no data", async () => {
		const connector = new EntityStorageNftConnector();
		const idUrn = await connector.mint(TEST_USER_IDENTITY, "footag");
		const urn = Urn.fromValidString(idUrn);

		expect(urn.namespaceIdentifier()).toEqual("nft");
		expect(urn.namespaceMethod()).toEqual("entity-storage");
		expect(urn.namespaceSpecific(1).length).toEqual(64);

		const store =
			await EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<Nft>>("nft").getStore();
		expect(store?.[0].id).toEqual(urn.namespaceSpecific(1));
		expect(store?.[0].owner).toEqual(TEST_USER_IDENTITY);
		expect(store?.[0].issuer).toEqual(TEST_USER_IDENTITY);
		expect(store?.[0].tag).toEqual("footag");
		expect(store?.[0].immutableMetadata).toEqual(undefined);
		expect(store?.[0].metadata).toEqual(undefined);
	});

	test("Can mint an NFT", async () => {
		const connector = new EntityStorageNftConnector();
		const idUrn = await connector.mint(TEST_USER_IDENTITY, "footag", immutableMetadata, {
			bar: "foo"
		});
		const urn = Urn.fromValidString(idUrn);

		expect(urn.namespaceIdentifier()).toEqual("nft");
		expect(urn.namespaceMethod()).toEqual("entity-storage");
		expect(urn.namespaceSpecific(1).length).toEqual(64);

		const store =
			await EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<Nft>>("nft").getStore();
		expect(store?.[0].id).toEqual(urn.namespaceSpecific(1));
		expect(store?.[0].owner).toEqual(TEST_USER_IDENTITY);
		expect(store?.[0].issuer).toEqual(TEST_USER_IDENTITY);
		expect(store?.[0].tag).toEqual("footag");
		expect(store?.[0].immutableMetadata).toEqual(immutableMetadata);
		expect(store?.[0].metadata).toEqual({ bar: "foo" });
	});

	test("Can resolve an NFT", async () => {
		const connector = new EntityStorageNftConnector();
		const idUrn = await connector.mint(TEST_USER_IDENTITY, "footag", immutableMetadata, {
			bar: "foo"
		});

		const response = await connector.resolve(idUrn);

		expect(response.issuer).toEqual(TEST_USER_IDENTITY);
		expect(response.issuerIdentityId).toEqual("");
		expect(response.tag).toEqual("footag");
		expect(response.metadata).toEqual({ bar: "foo" });
		expect(response.immutableMetadata).toEqual(immutableMetadata);
	});

	test("Can transfer an NFT", async () => {
		const connector = new EntityStorageNftConnector();
		const idUrn = await connector.mint(TEST_USER_IDENTITY, "footag");
		const urn = Urn.fromValidString(idUrn);

		await connector.transfer(TEST_USER_IDENTITY, idUrn, TEST_ADDRESS_2);

		const store =
			await EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<Nft>>("nft").getStore();
		expect(store?.[0].id).toEqual(urn.namespaceSpecific(1));
		expect(store?.[0].issuer).toEqual(TEST_USER_IDENTITY);
		expect(store?.[0].owner).toEqual(TEST_ADDRESS_2);
	});

	test("Can burn an NFT", async () => {
		const connector = new EntityStorageNftConnector();
		const idUrn = await connector.mint(TEST_USER_IDENTITY, "footag");

		await connector.burn(TEST_USER_IDENTITY, idUrn);

		const store =
			await EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<Nft>>("nft").getStore();
		expect(store?.length).toEqual(0);
	});
});
