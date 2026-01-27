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
		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) return;

		// ! await required for try catch support
		try {
			await command.execute(interaction);
		} catch (error) {
			handleError(interaction.client, error, "Slash Command Error");

			const options = {
				embeds: [
					new EmbedBuilder()
						.setColor(settings.colors.red)
						.setTitle(strings.bot.error)
						.setThumbnail(settings.images.error)
						.setDescription(
							`${strings.command.error}\nError for the developers:\n\`\`\`${error}\`\`\``,
						),
				],
				components: addDeleteButton(),
			};
			return interaction.deferred ? interaction.followUp(options) : interaction.reply(options);
		}
	},
} as Event;
