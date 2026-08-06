import { defineEvent } from "@interfaces/discord";

/** "real" event file that gets split into each component's specified usage */
export default defineEvent({
	name: "interactionCreate",
	async execute(interaction) {
		if (interaction.isButton()) return interaction.client.emit("buttonUsed", interaction);
		if (interaction.isModalSubmit()) return interaction.client.emit("modalSubmit", interaction);
		if (interaction.isChatInputCommand())
			return interaction.client.emit("slashCommandUsed", interaction);
	},
});
