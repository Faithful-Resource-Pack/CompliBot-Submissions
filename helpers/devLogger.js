const { EmbedBuilder } = require("discord.js");

/**
 * Log dev errors and information to a dedicated channel
 * @author Evorp
 * @param {import("discord.js").Client} client
 * @param {string} description what to log
 * @param {{ color?: string, title?: string, codeBlocks?: string }} params optional config
 */
module.exports = async function devLogger(client, description, params = {}) {
	// declared inside module body to stop init errors from unhandledRejection
	const settings = require("@resources/settings.json");

	/** @type {import("discord.js").TextChannel} */
	const channel = client.channels.cache.get(process.env.LOG_CHANNEL);
	if (!channel) return;

	if (params.codeBlocks !== null && params.codeBlocks !== undefined)
		description = `\`\`\`${params.codeBlocks}\n${description}\`\`\``;

	const embed = new EmbedBuilder()
		.setTitle(params.title ?? "Unhandled Rejection")
		.setDescription(description)
		.setColor(params.color ?? settings.colors.red)
		.setTimestamp();

	channel.send({ embeds: [embed] }).catch(console.error);
};
