import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";

import { sendToResults } from "@submission/sendToChannel";
import warnUser from "@helpers/warnUser";
import type { Pack, PackFile } from "@interfaces/database";
import type { Command } from "@interfaces/discord";

export default {
	data: new SlashCommandBuilder()
		.setName("channelpush")
		.setDescription(strings.command.description.channelpush)
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
		.addIntegerOption((option) =>
			option.setName("delay").setDescription("Manually override the pack submission delay."),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		const submissions: PackFile = require("@resources/packs.json");
		const choice = interaction.options.getString("pack", true);
		const delay = interaction.options.getInteger("delay", false);
		if (choice === "all" && !process.env.DEVELOPERS.includes(interaction.user.id))
			return warnUser(interaction, strings.command.no_permission);

		const packs = choice === "all" ? Object.values(submissions) : [submissions[choice]];

		await interaction.deferReply();

		for (const pack of packs) {
			await sendToResults(interaction.client, pack.submission, delay);
		}

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Successfully sent all submissions!")
					.setColor(settings.colors.green),
			],
		});
	},
} as Command;
