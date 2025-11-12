// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { NftRestClient } from "../src/nftRestClient.js";

describe("NftRestClient", () => {
	test("Can create an instance", async () => {
		const client = new NftRestClient({ endpoint: "http://localhost:8080" });
		expect(client).toBeDefined();
	});
});
