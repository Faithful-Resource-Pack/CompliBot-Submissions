import settings from "@resources/settings.json";
import strings from "@resources/strings.json";
import { defineEvent } from "@interfaces/discord";

import addDeleteButton from "@helpers/addDeleteButton";
import handleError from "@functions/handleError";

import { EmbedBuilder } from "discord.js";

/** "fake" emitted event to split up interactionCreate */
export default defineEvent({
	name: "slashCommandUsed",
	async execute(interaction) {
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
						.setTitle(strings.global.error_title)
						.setThumbnail(settings.images.error)
						.setDescription(
							`${strings.command.error}\n${strings.global.error_description.replace("%ERROR%", error)}`,
						),
				],
				components: addDeleteButton(),
			};
			return interaction.deferred ? interaction.followUp(options) : interaction.reply(options);
		}
	},
});
