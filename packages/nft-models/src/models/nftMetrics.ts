// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { MetricType, type ITelemetryMetric } from "@3sixty/telemetry-models";
import { NftMetricIds } from "./nftMetricIds.js";

/**
 * Metrics registered by the NFT service.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const NftMetrics: ITelemetryMetric[] = [
	{ id: NftMetricIds.TokensMinted, label: "NFT tokens minted", type: MetricType.Counter },
	{ id: NftMetricIds.TokensBurned, label: "NFT tokens burned", type: MetricType.Counter },
	{
		id: NftMetricIds.TokensTransferred,
		label: "NFT tokens transferred",
		type: MetricType.Counter
	},
	{ id: NftMetricIds.TokensResolved, label: "NFT tokens resolved", type: MetricType.Counter },
	{ id: NftMetricIds.TokensUpdated, label: "NFT tokens updated", type: MetricType.Counter }
];
