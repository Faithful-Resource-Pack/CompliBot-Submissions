const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { EmbedBuilder } = require("discord.js");

/**
 * Sends pre-formatted red embed with warning sign
 * @author Juknum
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 * @param {String} text
 */
module.exports = async function warnUser(interaction, text) {
	const embed = new EmbedBuilder()
		.setColor(settings.colors.red)
		.setThumbnail(settings.images.warning)
		.setTitle(strings.bot.error)
		.setDescription(text);

	return await interaction.reply({ embeds: [embed], ephemeral: true });
};
