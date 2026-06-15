// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof } from "@twin.org/nameof";
import * as dotenv from "dotenv";
import type { Nft } from "../src/entities/nft.js";
import { initSchema } from "../src/schema.js";

console.debug("Setting up test environment from .env and .env.dev files");

dotenv.config({
	path: [path.join(__dirname, ".env"), path.join(__dirname, ".env.dev")],
	quiet: true
});

export const TEST_NODE_IDENTITY =
	"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101";
export const TEST_ORGANIZATION_IDENTITY =
	"did:entity-storage:0x0202020202020202020202020202020202020202020202020202020202020202";
export const TEST_USER_IDENTITY =
	"did:entity-storage:0x0303030303030303030303030303030303030303030303030303030303030303";
export const TEST_USER_IDENTITY_2 =
	"did:entity-storage:0x0404040404040404040404040404040404040404040404040404040404040404";

export const TEST_ADDRESS_1 = "test-address-1";
export const TEST_ADDRESS_2 = "test-address-2";

initSchema();

EntityStorageConnectorFactory.register(
	"nft",
	() =>
		new MemoryEntityStorageConnector<Nft>({
			entitySchema: nameof<Nft>(),
			config: { storageKey: "nft" }
		})
);
