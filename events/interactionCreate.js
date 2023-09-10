const client = require("@index").Client;

/**
 * "real" event file that gets split into each component's specified usage
 * @type {import("@helpers/jsdoc").Event}
 */
module.exports = {
	name: "interactionCreate",
	/** @param {import("discord.js").Interaction} interaction */
	async execute(interaction) {
		if (interaction.isButton()) return client.emit("buttonUsed", interaction);
	},
};
