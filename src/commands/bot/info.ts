import settings from "@resources/settings.json";
import strings from "@resources/strings.json";
import type { Command } from "@interfaces/discord";
import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("info")
		.setDescription("General info about CompliBot Submissions."),
	async execute(interaction) {
		const image = settings.images.bot;
		const info = strings.command.info;

		const embed = new EmbedBuilder()
			.setTitle(info.title)
			.setDescription(info.subtitle)
			.addFields(
				{
					name: info.submitting.title,
					value: info.submitting.description,
					inline: true,
				},
				{
					name: info.developing.title,
					value: info.developing.description,
					inline: true,
				},
			)
			.setColor(settings.colors.blue)
			.setThumbnail(image);

		return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	},
} as Command;
