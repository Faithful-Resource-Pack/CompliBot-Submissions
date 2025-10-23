import strings from "@resources/strings.json";
import type { Command } from "@interfaces/discord";

import warnUser from "@helpers/warnUser";
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("say")
		.setDescription(strings.command.description.say)
		.addStringOption((option) =>
			option.setName("message").setDescription("What should the bot say?").setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		if (!process.env.DEVELOPERS.includes(interaction.user.id))
			return warnUser(interaction, strings.command.no_permission);

		const content = interaction.options.getString("message", true);

		const { resource } = await interaction.reply({ content: "** **", withResponse: true });
		if (resource.message.deletable) await resource.message.delete();
		await interaction.channel.send({ content });
	},
} as Command;
