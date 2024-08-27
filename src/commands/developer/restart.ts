import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import warnUser from "@helpers/warnUser";
import { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

import type { Command } from "@interfaces/discord";
export default {
	data: new SlashCommandBuilder()
		.setName("restart")
		.setDescription(strings.command.description.restart)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		if (!process.env.DEVELOPERS.includes(interaction.user.id))
			return warnUser(interaction, strings.command.no_permission);

		await interaction.reply({
			embeds: [new EmbedBuilder().setTitle("Restarting...").setColor(settings.colors.blue)],
		});

		interaction.client.destroy();

		// delete bot cache
		Object.keys(require.cache).forEach((key) => delete require.cache[key]);
		// restart bot by launching index file
		require("@index");
	},
} as Command;
