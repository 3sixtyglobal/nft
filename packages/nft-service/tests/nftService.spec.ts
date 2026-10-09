// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { HealthCategory, HealthStatus, type IHealth } from "@3sixty/api-models";
import { ContextIdKeys, ContextIdStore, type IContextIds } from "@3sixty/context";
import { MemoryEntityStorageConnector } from "@3sixty/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@3sixty/entity-storage-models";
import { nameof } from "@3sixty/nameof";
import {
	EntityStorageNftConnector,
	initSchema as initSchemaNft,
	type Nft
} from "@3sixty/nft-connector-entity-storage";
import { NftConnectorFactory } from "@3sixty/nft-models";
import { NftService } from "../src/nftService.js";

const TEST_ORG_DID = "did:entity-storage:test-org";

describe("NftService", () => {
	beforeAll(() => {
		initSchemaNft();
	});

	test("Can create an instance", async () => {
		NftConnectorFactory.register(
			EntityStorageNftConnector.NAMESPACE,
			() => new EntityStorageNftConnector()
		);
		const service = new NftService();
		expect(service).toBeDefined();
	});

	describe("health checks", () => {
		// Each test needs isolated storage because MemoryEntityStorageConnector uses
		// SharedObjectBuffer keyed by storageKey, so instances sharing a key share data.
		let healthTestIndex = 0;

		beforeEach(() => {
			healthTestIndex++;
			const idx = healthTestIndex;

			const freshNftStorage = new MemoryEntityStorageConnector<Nft>({
				entitySchema: nameof<Nft>(),
				config: { storageKey: `nft-health-${idx}` }
			});

			EntityStorageConnectorFactory.register("nft", () => freshNftStorage);
			NftConnectorFactory.register("nft", () => new EntityStorageNftConnector());
		});

		test("healthApplication returns application ok after full lifecycle", async () => {
			const service = new NftService();

			const contextIds: IContextIds = { [ContextIdKeys.Organization]: TEST_ORG_DID };

			let results: IHealth[] | undefined;
			await ContextIdStore.run(contextIds, async () => {
				results = await service.healthApplication(async () => {});
			});

			expect(results).toHaveLength(1);
			expect(results?.[0].category).toEqual(HealthCategory.Application);
			expect(results?.[0].status).toEqual(HealthStatus.Ok);
		});

		test("healthApplication returns empty array when no organisation context", async () => {
			const service = new NftService();

			let results: IHealth[] | undefined;
			await ContextIdStore.run({}, async () => {
				results = await service.healthApplication(async () => {});
			});

			expect(results).toHaveLength(0);
		});
	});
});
