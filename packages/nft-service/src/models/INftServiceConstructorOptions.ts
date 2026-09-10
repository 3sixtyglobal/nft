// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { INftServiceConfig } from "./INftServiceConfig.js";

/**
 * Options for the nft service constructor.
 */
export interface INftServiceConstructorOptions {
	/**
	 * The component type for the optional telemetry component used for event metrics.
	 */
	telemetryComponentType?: string;

	/**
	 * The configuration for the service.
	 */
	config?: INftServiceConfig;
}
