import type { Event } from "@interfaces/discord";
import { Interaction } from "discord.js";

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
