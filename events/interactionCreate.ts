import { Interaction } from "discord.js";
import type { Event } from "@interfaces/discord";

/** "real" event file that gets split into each component's specified usage */
export default {
	name: "interactionCreate",
	async execute(interaction: Interaction) {
		if (interaction.isButton()) return interaction.client.emit("buttonUsed", interaction);
		if (interaction.isModalSubmit()) return interaction.client.emit("modalSubmit", interaction);
		if (interaction.isChatInputCommand())
			return interaction.client.emit("slashCommandUsed", interaction);
	},
} as Event;
