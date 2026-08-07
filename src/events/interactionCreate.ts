import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import { defineEvent } from "@interfaces/discord";

import { EmbedBuilder, MessageFlags } from "discord.js";

const MAINTENANCE = process.env.MAINTENANCE.toLowerCase() === "true";

/** "real" event file that gets split into each component's specified usage */
export default defineEvent({
	name: "interactionCreate",
	async execute(interaction) {
		if (MAINTENANCE && !interaction.isAutocomplete())
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle(strings.global.error_title)
						.setDescription(strings.global.maintenance)
						.setColor(settings.colors.red),
				],
				flags: MessageFlags.Ephemeral,
			});

		if (interaction.isButton()) return interaction.client.emit("buttonUsed", interaction);
		if (interaction.isModalSubmit()) return interaction.client.emit("modalSubmit", interaction);
		if (interaction.isChatInputCommand())
			return interaction.client.emit("slashCommandUsed", interaction);
	},
});
