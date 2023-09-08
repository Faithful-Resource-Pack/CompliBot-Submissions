const client = require("@index").Client;

/**
 * this is the actual event being called for button/menu interactions
 * but it lumps all interactions together
 * so we split them into separate event files here
 * @author Evorp
 * @see buttonUsed
 */
module.exports = {
	name: "interactionCreate",
	/** @param {import("discord.js").Interaction} interaction */
	async execute(interaction) {
		if (interaction.isButton()) return client.emit("buttonUsed", interaction);
	},
};
