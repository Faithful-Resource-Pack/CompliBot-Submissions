const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { EmbedBuilder, Message } = require("discord.js");
const addDeleteButton = require("./addDeleteButton");

/**
 * Generic error message for both interactions and messages
 * @author Juknum, Evorp
 * @param {import("discord.js").ChatInputCommandInteraction | Message} interaction valid message/interaction object
 * @param {string} text
 * @param {boolean} deferred whether to reply directly or to edit the deferred reply
 * @returns {Promise<Message>} warn message
 */
module.exports = async function warnUser(interaction, text = strings.bot.error, deferred = false) {
	const embed = new EmbedBuilder()
		.setColor(settings.colors.red)
		.setThumbnail(settings.images.warning)
		.setTitle(strings.bot.error)
		.setDescription(text);

	if (interaction instanceof Message)
		return await interaction.reply({ embeds: [embed] }).then(addDeleteButton);

	if (deferred) return await interaction.editReply({ embeds: [embed], ephemeral: true });
	return await interaction.reply({ embeds: [embed], ephemeral: true, fetchReply: true });
};
