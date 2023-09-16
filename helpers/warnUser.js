const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { EmbedBuilder } = require("discord.js");

/**
 * Sends pre-formatted red embed with warning sign
 * @author Juknum
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 * @param {String} text
 * @param {Boolean?} deferred whether to reply directly or to edit the deferred reply
 */
module.exports = async function warnUser(interaction, text, deferred = false) {
	const embed = new EmbedBuilder()
		.setColor(settings.colors.red)
		.setThumbnail(settings.images.warning)
		.setTitle(strings.bot.error)
		.setDescription(text);

	if (deferred) return await interaction.editReply({ embeds: [embed], ephemeral: true });
	return await interaction.reply({ embeds: [embed], ephemeral: true });
};
