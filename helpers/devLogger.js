const { EmbedBuilder } = require("discord.js");

/**
 * Log dev errors and information to a dedicated channel
 * @author Evorp
 * @param {import("discord.js").Client} client
 * @param {string} description what to log
 * @param {{ color?: string, title?: string, codeBlocks?: string }} params optional config
 */
module.exports = async function devLogger(client, description, { color, title, codeBlocks } = {}) {
	const settings = require("@resources/settings.json");

	/** @type {import("discord.js").TextChannel} */
	const channel = client.channels.cache.get(process.env.LOG_CHANNEL);
	if (!channel) return; // avoid infinite loop when crash is outside of client

	// empty strings still enable codeblocks, just no highlighting
	if (codeBlocks != null) description = `\`\`\`${codeBlocks}\n${description}\`\`\``;

	const embed = new EmbedBuilder()
		.setTitle(title || "Unhandled Rejection")
		.setDescription(description)
		.setColor(color || settings.colors.red)
		.setTimestamp();

	return channel.send({ embeds: [embed] }).catch(console.error);
};
