import settings from "@resources/settings.json";
import strings from "@resources/strings.json";
import type { Command } from "@interfaces/discord";

import {
	EmbedBuilder,
	Message,
	SlashCommandBuilder,
	PermissionFlagsBits,
	MessageFlags,
} from "discord.js";
import warnUser from "@helpers/warnUser";

export default {
	data: new SlashCommandBuilder()
		.setName("reply")
		.setDescription(strings.command.description.reply)
		.addStringOption((option) =>
			option
				.setName("message")
				.setDescription("The funny thing you want the bot to say.")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option.setName("reply-id").setDescription("Message ID to reply to").setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		if (!process.env.DEVELOPERS.includes(interaction.user.id))
			return warnUser(interaction, strings.command.no_permission);

		const replyID = interaction.options.getString("reply-id", true);

		let msg: Message | undefined;
		try {
			msg = await interaction.channel?.messages.fetch(replyID);
		} catch {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle(strings.bot.error)
						.setDescription(strings.command.invalid_message.replace("%ID%", replyID))
						.setColor(settings.colors.red),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		const { resource } = await interaction.reply({ content: "** **", withResponse: true });
		if (resource.message.deletable) await resource.message.delete();
		msg.reply({ content: interaction.options.getString("message", true) });
	},
} as Command;
