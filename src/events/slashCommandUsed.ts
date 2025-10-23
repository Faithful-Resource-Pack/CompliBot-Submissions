import settings from "@resources/settings.json";
import strings from "@resources/strings.json";
import type { Event } from "@interfaces/discord";

import addDeleteButton from "@helpers/addDeleteButton";
import handleError from "@functions/handleError";

import { EmbedBuilder, ChatInputCommandInteraction } from "discord.js";

/** "fake" emitted event to split up interactionCreate */
export default {
	name: "slashCommandUsed",
	async execute(interaction: ChatInputCommandInteraction) {
		if (!interaction.client.commands.has(interaction.commandName)) return;
		const command = interaction.client.commands.get(interaction.commandName);

		// ! await required for try catch support
		try {
			await command.execute(interaction);
		} catch (error) {
			handleError(interaction.client, error, "Slash Command Error");

			const embed = new EmbedBuilder()
				.setColor(settings.colors.red)
				.setTitle(strings.bot.error)
				.setThumbnail(settings.images.error)
				.setDescription(
					`${strings.command.error}\nError for the developers:\n\`\`\`${error}\`\`\``,
				);

			const msgEmbed = interaction.deferred
				? await interaction.followUp({ embeds: [embed] })
				: await interaction
						.reply({ embeds: [embed], withResponse: true })
						.then(({ resource }) => resource.message);

			return addDeleteButton(msgEmbed);
		}
	},
} as Event;
