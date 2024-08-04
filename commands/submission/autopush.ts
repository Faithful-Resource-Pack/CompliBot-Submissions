import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";

import formattedDate from "@helpers/formattedDate";
import pushTextures from "@submission/pushTextures";
import { downloadResults } from "@submission/handleResults";
import warnUser from "@helpers/warnUser";
import type { Command } from "@interfaces/discord";
import type { Pack, PackFile } from "@interfaces/database";

export default {
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

		if (choice == "all" && !process.env.DEVELOPERS.includes(interaction.user.id))
			return warnUser(interaction, strings.command.no_permission);

		const packs = choice == "all" ? Object.values(submissions) : [submissions[choice]];

		const infoEmbed = new EmbedBuilder()
			.setDescription("This can take some time, please wait...")
			.setThumbnail(settings.images.loading)
			.setColor(settings.colors.blue);

		await interaction.reply({
			embeds: [infoEmbed.setTitle("Downloading textures...")],
		});

		await Promise.all(
			packs.map((pack) =>
				downloadResults(interaction.client, pack.submission.channels.results, addContributions),
			),
		);

		await interaction.editReply({
			embeds: [infoEmbed.setTitle("Pushing textures...")],
		});

		await Promise.all(
			Object.keys(submissions).map((pack) =>
				pushTextures(
					"./downloadedTextures",
					pack,
					`Manual push executed by ${interaction.user.displayName} on ${formattedDate()}`,
				),
			),
		);

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Successfully pushed all textures!")
					.setColor(settings.colors.green),
			],
		});
	},
} as Command;
