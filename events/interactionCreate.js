/**
 * "real" event file that gets split into each component's specified usage
 * @type {import("@helpers/jsdoc").Event}
 */
module.exports = {
	name: "interactionCreate",
	/**
	 * @param {import("discord.js").Client} client
	 * @param {import("discord.js").Interaction} interaction
	 */
	async execute(client, interaction) {
		if (interaction.isButton()) return client.emit("buttonUsed", interaction);
		if (interaction.isChatInputCommand()) return client.emit("slashCommandUsed", interaction);
		if (interaction.isModalSubmit()) return client.emit("modalSubmit", interaction);
	},
};
