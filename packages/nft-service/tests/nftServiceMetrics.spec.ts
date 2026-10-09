// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ComponentFactory, Is } from "@3sixty/core";
import { MemoryEntityStorageConnector } from "@3sixty/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@3sixty/entity-storage-models";
import { nameof } from "@3sixty/nameof";
import {
	EntityStorageNftConnector,
	initSchema as initSchemaNft,
	type Nft
} from "@3sixty/nft-connector-entity-storage";
import { NftConnectorFactory, NftMetricIds } from "@3sixty/nft-models";
import {
	MetricType,
	type ITelemetryComponent,
	type ITelemetryMetric
} from "@3sixty/telemetry-models";
import { NftService } from "../src/nftService.js";

const TEST_CONTROLLER = "did:entity-storage:test-controller";
const TEST_TAG = "TEST-TAG";

interface MetricValueEntry {
	id: string;
	value: "inc" | "dec" | number;
	customData?: { [key: string]: unknown };
}

function makeMockTelemetry(): {
	component: ITelemetryComponent;
	created: ITelemetryMetric[];
	values: MetricValueEntry[];
} {
	const created: ITelemetryMetric[] = [];
	const values: MetricValueEntry[] = [];
	const component: ITelemetryComponent = {
		className: () => "MockTelemetry",
		start: async () => {},
		stop: async () => {},
		createMetric: async m => {
			for (const metric of Is.array(m) ? m : [m]) {
				created.push({ ...metric });
			}
		},
		getMetric: async () => ({ metric: {} as never, value: {} as never }),
		updateMetric: async () => {},
		addMetricValue: async (id, value, customData) => {
			values.push({ id, value, customData });
			return "v";
		},
		addMetricValues: async entries => {
			values.push(...entries);
			return entries.map(() => "v");
		},
		getMetricValue: async (id, valueId) => ({
			id: valueId,
			metricId: id,
			value: 0,
			ts: Date.now()
		}),
		removeMetric: async () => {},
		query: async () => ({ entities: [] }),
		queryValues: async () => ({ metric: {} as never, entities: [] })
	};
	return { component, created, values };
}

describe("NftService - metrics", () => {
	let nftTestIndex = 0;

	beforeAll(() => {
		initSchemaNft();
	});

	beforeEach(() => {
		nftTestIndex++;
		const idx = nftTestIndex;

		const freshNftStorage = new MemoryEntityStorageConnector<Nft>({
			entitySchema: nameof<Nft>(),
			config: { storageKey: `nft-metrics-${idx}` }
		});

		EntityStorageConnectorFactory.register("nft", () => freshNftStorage);
		NftConnectorFactory.register(
			EntityStorageNftConnector.NAMESPACE,
			() => new EntityStorageNftConnector()
		);
	});

	describe("instrumented path", () => {
		test("start() registers all NFT metrics with the telemetry component", async () => {
			const { component, created } = makeMockTelemetry();
			ComponentFactory.register("test-telemetry", () => component);

			const service = new NftService({ telemetryComponentType: "test-telemetry" });
			await service.start();

			const ids = created.map(m => m.id);
			expect(ids).toContain(NftMetricIds.TokensMinted);
			expect(ids).toContain(NftMetricIds.TokensBurned);
			expect(ids).toContain(NftMetricIds.TokensTransferred);
			expect(ids).toContain(NftMetricIds.TokensResolved);
			expect(ids).toContain(NftMetricIds.TokensUpdated);
			expect(created.every(m => m.type === MetricType.Counter)).toBe(true);
		});

		test("mint() increments nft_tokens_minted with namespace", async () => {
			const { component, values } = makeMockTelemetry();
			ComponentFactory.register("test-telemetry", () => component);

			const service = new NftService({ telemetryComponentType: "test-telemetry" });
			await service.start();

			await service.mint(TEST_TAG, undefined, undefined, undefined, TEST_CONTROLLER);

			const minted = values.filter(v => v.id === NftMetricIds.TokensMinted);
			expect(minted).toHaveLength(1);
			expect(minted[0].value).toBe("inc");
			expect(minted[0].customData?.namespace).toBe(EntityStorageNftConnector.NAMESPACE);
		});

		test("burn() increments nft_tokens_burned", async () => {
			const { component, values } = makeMockTelemetry();
			ComponentFactory.register("test-telemetry", () => component);

			const service = new NftService({ telemetryComponentType: "test-telemetry" });
			await service.start();

			const nftId = await service.mint(TEST_TAG, undefined, undefined, undefined, TEST_CONTROLLER);
			await service.burn(nftId, TEST_CONTROLLER);

			const burned = values.filter(v => v.id === NftMetricIds.TokensBurned);
			expect(burned).toHaveLength(1);
			expect(burned[0].value).toBe("inc");
		});
	});

	describe("uninstrumented path", () => {
		test("mint() succeeds without a telemetry component", async () => {
			const service = new NftService();

			const nftId = await service.mint(TEST_TAG, undefined, undefined, undefined, TEST_CONTROLLER);

			expect(nftId).toBeDefined();
		});

		test("burn() succeeds without a telemetry component", async () => {
			const service = new NftService();

			const nftId = await service.mint(TEST_TAG, undefined, undefined, undefined, TEST_CONTROLLER);
			await expect(service.burn(nftId, TEST_CONTROLLER)).resolves.toBeUndefined();
		});
	});
});
