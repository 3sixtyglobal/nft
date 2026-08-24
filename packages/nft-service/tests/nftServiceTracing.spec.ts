// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ComponentFactory, GeneralError } from "@twin.org/core";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof } from "@twin.org/nameof";
import {
	EntityStorageNftConnector,
	initSchema as initSchemaNft,
	type Nft
} from "@twin.org/nft-connector-entity-storage";
import { NftConnectorFactory, NftSpanAttributes, NftSpanNames } from "@twin.org/nft-models";
import {
	SpanHelper,
	SpanStatus,
	type ISpan,
	type ISpanOptions,
	type ITracingComponent
} from "@twin.org/tracing-models";
import { NftService } from "../src/nftService.js";

const TEST_CONTROLLER = "did:entity-storage:test-controller";
const TEST_TAG = "TEST-TAG";

function makeMockTracing(): { component: ITracingComponent; ended: ISpan[] } {
	const ended: ISpan[] = [];
	const component: ITracingComponent = {
		className: () => "MockTracing",
		startSpan: async (name: string, options?: ISpanOptions) => SpanHelper.startSpan(name, options),
		endSpan: async (span: ISpan, status?: SpanStatus) => {
			SpanHelper.endSpan(span, status);
			ended.push(span);
		},
		query: async () => ({ entities: [] }),
		getTrace: async () => []
	};
	return { component, ended };
}

describe("NftService - tracing", () => {
	let nftTestIndex = 0;

	beforeAll(() => {
		initSchemaNft();
	});

	beforeEach(() => {
		nftTestIndex++;
		const idx = nftTestIndex;

		const freshNftStorage = new MemoryEntityStorageConnector<Nft>({
			entitySchema: nameof<Nft>(),
			config: { storageKey: `nft-tracing-${idx}` }
		});

		EntityStorageConnectorFactory.register("nft", () => freshNftStorage);
		NftConnectorFactory.register(
			EntityStorageNftConnector.NAMESPACE,
			() => new EntityStorageNftConnector()
		);
	});

	describe("instrumented path", () => {
		test("mint() records a span carrying the tag", async () => {
			const { component, ended } = makeMockTracing();
			ComponentFactory.register("test-tracing", () => component);

			await new NftService({ tracingComponentType: "test-tracing" }).mint(
				TEST_TAG,
				undefined,
				undefined,
				undefined,
				TEST_CONTROLLER
			);

			const minted = ended.filter(s => s.name === NftSpanNames.Mint);
			expect(minted).toHaveLength(1);
			expect(minted[0].status).toEqual(SpanStatus.Ok);
			expect(minted[0].attributes?.[NftSpanAttributes.Tag]).toEqual(TEST_TAG);
		});

		test("resolve() records a span carrying the id", async () => {
			const { component, ended } = makeMockTracing();
			ComponentFactory.register("test-tracing", () => component);

			const service = new NftService({ tracingComponentType: "test-tracing" });
			const id = await service.mint(TEST_TAG, undefined, undefined, undefined, TEST_CONTROLLER);

			await service.resolve(id);

			const resolved = ended.filter(s => s.name === NftSpanNames.Resolve);
			expect(resolved).toHaveLength(1);
			expect(resolved[0].attributes?.[NftSpanAttributes.Id]).toEqual(id);
		});

		test("transfer() records a span", async () => {
			const { component, ended } = makeMockTracing();
			ComponentFactory.register("test-tracing", () => component);

			const service = new NftService({ tracingComponentType: "test-tracing" });
			const id = await service.mint(TEST_TAG, undefined, undefined, undefined, TEST_CONTROLLER);

			await service.transfer(id, "recipient", undefined, TEST_CONTROLLER);

			expect(ended.filter(s => s.name === NftSpanNames.Transfer)).toHaveLength(1);
		});

		test("update() records a span", async () => {
			const { component, ended } = makeMockTracing();
			ComponentFactory.register("test-tracing", () => component);

			const service = new NftService({ tracingComponentType: "test-tracing" });
			const id = await service.mint(TEST_TAG, undefined, undefined, undefined, TEST_CONTROLLER);

			await service.update(id, { updated: true }, TEST_CONTROLLER);

			expect(ended.filter(s => s.name === NftSpanNames.Update)).toHaveLength(1);
		});

		test("burn() records a span", async () => {
			const { component, ended } = makeMockTracing();
			ComponentFactory.register("test-tracing", () => component);

			const service = new NftService({ tracingComponentType: "test-tracing" });
			const id = await service.mint(TEST_TAG, undefined, undefined, undefined, TEST_CONTROLLER);

			await service.burn(id, TEST_CONTROLLER);

			const burned = ended.filter(s => s.name === NftSpanNames.Burn);
			expect(burned).toHaveLength(1);
			expect(burned[0].status).toEqual(SpanStatus.Ok);
		});

		test("a failure ends the span with an error and records the domain error", async () => {
			const { component, ended } = makeMockTracing();
			ComponentFactory.register("test-tracing", () => component);

			const service = new NftService({ tracingComponentType: "test-tracing" });

			await expect(
				service.resolve(`urn:nft:${EntityStorageNftConnector.NAMESPACE}:missing`)
			).rejects.toThrow(GeneralError);

			const resolved = ended.filter(s => s.name === NftSpanNames.Resolve);
			expect(resolved).toHaveLength(1);
			expect(resolved[0].status).toEqual(SpanStatus.Error);
			expect(resolved[0].attributes?.["exception.message"]).toEqual("nftService.resolveFailed");
		});
	});

	describe("uninstrumented path", () => {
		test("operations behave unchanged with no tracing component configured", async () => {
			const service = new NftService();
			const id = await service.mint(TEST_TAG, undefined, undefined, undefined, TEST_CONTROLLER);

			await expect(service.resolve(id)).resolves.toMatchObject({ tag: TEST_TAG });
		});

		test("an unresolvable tracing component type is ignored", async () => {
			const service = new NftService({ tracingComponentType: "not-registered" });
			const id = await service.mint(TEST_TAG, undefined, undefined, undefined, TEST_CONTROLLER);

			await expect(service.resolve(id)).resolves.toMatchObject({ tag: TEST_TAG });
		});
	});
});
