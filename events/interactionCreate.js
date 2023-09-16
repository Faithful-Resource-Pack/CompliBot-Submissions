/**
 * "real" event file that gets split into each component's specified usage
 * @type {import("@helpers/jsdoc").Event}
 */
module.exports = {
	name: "interactionCreate",
	/** @param {import("discord.js").Interaction} interaction */
	async execute(interaction) {
		if (interaction.isButton()) return interaction.client.emit("buttonUsed", interaction);
		if (interaction.isChatInputCommand())
			return interaction.client.emit("slashCommandUsed", interaction);
	},
};
