// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { CLIDisplay, CLIParam } from "@3sixty/cli-core";
import { Converter, I18n, Is, StringHelper } from "@3sixty/core";
import { IotaNftUtils } from "@3sixty/nft-connector-iota";
import { VaultConnectorFactory } from "@3sixty/vault-models";
import { setupWalletConnector, WalletConnectorTypes } from "@3sixty/wallet-cli";
import { WalletConnectorFactory } from "@3sixty/wallet-models";
import { Command } from "commander";
import { setupNftConnector, setupVault } from "./setupCommands.js";

/**
 * Build the nft transfer command for the CLI.
 * @returns The command.
 */
export function buildCommandNftTransfer(): Command {
	const command = new Command();
	command
		.name("nft-transfer")
		.summary(I18n.formatMessage("commands.nft-transfer.summary"))
		.description(I18n.formatMessage("commands.nft-transfer.description"))
		.requiredOption(
			I18n.formatMessage("commands.nft-transfer.options.seed.param"),
			I18n.formatMessage("commands.nft-transfer.options.seed.description")
		)
		.requiredOption(
			I18n.formatMessage("commands.nft-transfer.options.id.param"),
			I18n.formatMessage("commands.nft-transfer.options.id.description")
		)
		.requiredOption(
			I18n.formatMessage("commands.nft-transfer.options.recipient-identity.param"),
			I18n.formatMessage("commands.nft-transfer.options.recipient-identity.description")
		)
		.requiredOption(
			I18n.formatMessage("commands.nft-transfer.options.recipient-address.param"),
			I18n.formatMessage("commands.nft-transfer.options.recipient-address.description")
		);

	command
		.option(
			I18n.formatMessage("commands.common.options.node.param"),
			I18n.formatMessage("commands.common.options.node.description"),
			"!NODE_URL"
		)
		.option(
			I18n.formatMessage("commands.common.options.network.param"),
			I18n.formatMessage("commands.common.options.network.description"),
			"!NETWORK"
		)

		.option(
			I18n.formatMessage("commands.common.options.explorer.param"),
			I18n.formatMessage("commands.common.options.explorer.description"),
			"!EXPLORER_URL"
		)
		.action(actionCommandNftTransfer);

	return command;
}

/**
 * Action the nft transfer command.
 * @param opts The options for the command.
 * @param opts.seed The seed required for signing by the issuer.
 * @param opts.id The id of the NFT to transfer in urn format.
 * @param opts.recipientIdentity The recipient address of the NFT.
 * @param opts.recipientAddress The recipient address of the NFT.
 * @param opts.node The node URL.
 * @param opts.network The network to use for connector.
 * @param opts.explorer The explorer URL.
 */
export async function actionCommandNftTransfer(opts: {
	seed: string;
	id: string;
	recipientIdentity: string;
	recipientAddress: string;
	node: string;
	network?: string;
	explorer: string;
}): Promise<void> {
	const seed: Uint8Array = CLIParam.hexBase64("seed", opts.seed);
	const id: string = CLIParam.stringValue("id", opts.id);
	const recipientIdentity: string = CLIParam.stringValue(
		"recipientIdentity",
		opts.recipientIdentity
	);
	const recipientAddress: string = Converter.bytesToHex(
		CLIParam.hex("recipientAddress", opts.recipientAddress),
		true
	);
	const nodeEndpoint: string = CLIParam.url("node", opts.node);
	const network: string = CLIParam.stringValue("network", opts.network);
	const explorerEndpoint: string = CLIParam.url("explorer", opts.explorer);

	CLIDisplay.value(I18n.formatMessage("commands.nft-transfer.labels.nftId"), id);
	CLIDisplay.value(
		I18n.formatMessage("commands.nft-transfer.labels.recipientIdentity"),
		recipientIdentity
	);
	CLIDisplay.value(
		I18n.formatMessage("commands.nft-transfer.labels.recipientAddress"),
		recipientAddress
	);
	CLIDisplay.value(I18n.formatMessage("commands.common.labels.node"), nodeEndpoint);
	if (Is.stringValue(network)) {
		CLIDisplay.value(I18n.formatMessage("commands.common.labels.network"), network);
	}
	CLIDisplay.break();

	setupVault();

	const walletConnector = setupWalletConnector(
		{ nodeEndpoint, network },
		WalletConnectorTypes.Iota
	);
	WalletConnectorFactory.register("wallet", () => walletConnector);

	const localIdentity = "local";
	const vaultSeedId = "local-seed";

	const vaultConnector = VaultConnectorFactory.get("vault");
	await vaultConnector.setSecret(`${localIdentity}/${vaultSeedId}`, Converter.bytesToBase64(seed));

	const nftConnector = setupNftConnector({ nodeEndpoint, network, vaultSeedId });
	const boundStart = nftConnector.start?.bind(nftConnector);
	if (Is.function(boundStart)) {
		await boundStart();
	}

	CLIDisplay.task(I18n.formatMessage("commands.nft-transfer.progress.transferringNft"));
	CLIDisplay.break();

	CLIDisplay.spinnerStart();

	await nftConnector.transfer(localIdentity, id, recipientIdentity, recipientAddress);

	CLIDisplay.spinnerStop();

	CLIDisplay.value(
		I18n.formatMessage("commands.common.labels.explore"),
		`${StringHelper.trimTrailingSlashes(explorerEndpoint)}/object/${IotaNftUtils.nftIdToObjectId(id)}?network=${network}`
	);
	CLIDisplay.break();

	CLIDisplay.done();
}
