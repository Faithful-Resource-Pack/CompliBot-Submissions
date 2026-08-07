import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import { defineCommand } from "@interfaces/discord";
import type { Pack, PackFile } from "@interfaces/database";

import downloadResults from "@submission/results/downloadResults";
import pushTextures from "@submission/results/pushTextures";

import formattedDate from "@helpers/formattedDate";
import warnUser from "@helpers/warnUser";

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";

export default defineCommand({
	data: new SlashCommandBuilder()
		.setName("autopush")
		.setDescription(strings.command.description.autopush)
		.addStringOption((option) =>
			option
				.setName("pack")
				.setDescription("Which pack to push.")
				.addChoices(
					{ name: "All", value: "all" },
					...Object.values(require("@resources/packs.json")).map((pack: Pack) => ({
						name: pack.name,
						value: pack.id,
					})),
				)
				.setRequired(true),
		)
		.addBooleanOption((option) =>
			option
				.setName("contributions")
				.setDescription("Whether to add contributions (default true)")
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		const submissions: PackFile = require("@resources/packs.json");
		const choice = interaction.options.getString("pack", true);
		const addContributions = interaction.options.getBoolean("contributions", false) ?? true;

		if (choice === "all" && !process.env.DEVELOPERS.includes(interaction.user.id))
			return warnUser(interaction, strings.command.no_permission);

		const packs = choice === "all" ? Object.values(submissions) : [submissions[choice]];

		const infoEmbed = new EmbedBuilder()
			.setDescription(strings.global.progress_description)
			.setThumbnail(settings.images.loading)
			.setColor(settings.colors.blue);

		await interaction.reply({
			embeds: [infoEmbed.setTitle(strings.command.push.autopush_download)],
		});

		await Promise.all(
			packs.map((pack) =>
				downloadResults(interaction.client, pack.submission.channels.results, addContributions),
			),
		);

		await interaction.editReply({
			embeds: [infoEmbed.setTitle(strings.command.push.autopush_pushing)],
		});

		await Promise.all(
			Object.keys(submissions).map((pack) =>
				pushTextures(
					"./downloadedTextures",
					pack,
					strings.github.commit_message.manual_push
						.replace("%USER", interaction.user.displayName)
						.replace("%DATE%", formattedDate()),
				),
			),
		);

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle(strings.command.push.autopush_success)
					.setColor(settings.colors.green),
			],
		});
	},
});
