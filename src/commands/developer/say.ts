import strings from "@resources/strings.json";

import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import warnUser from "@helpers/warnUser";

import type { Command } from "@interfaces/discord";
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

		const msg = await interaction.reply({ content: "** **", fetchReply: true });
		if (msg.deletable) await msg.delete();
		await interaction.channel.send({ content });
	},
} as Command;
