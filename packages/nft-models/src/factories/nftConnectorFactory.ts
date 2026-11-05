// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Factory } from "@3sixty/core";
import type { INftConnector } from "../models/INftConnector.js";

/**
 * Factory for creating NFT connectors.
 */
export const NftConnectorFactory = Factory.createFactory<INftConnector>("nft-connector");
