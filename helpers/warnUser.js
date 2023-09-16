const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { EmbedBuilder, Message } = require("discord.js");
const addDeleteButton = require("./addDeleteButton");

/**
 * Sends pre-formatted red embed with warning sign
 * @author Juknum
 * @param {import("discord.js").ChatInputCommandInteraction | Message} interaction valid message/interaction object
 * @param {String} text
 * @param {Boolean?} deferred whether to reply directly or to edit the deferred reply
 */
module.exports = async function warnUser(interaction, text, deferred = false) {
	const embed = new EmbedBuilder()
		.setColor(settings.colors.red)
		.setThumbnail(settings.images.warning)
		.setTitle(strings.bot.error)
		.setDescription(text);

	if (interaction instanceof Message) {
		const msg = await interaction.reply({ embeds: [embed] });
		return await addDeleteButton(msg);
	}

	if (deferred) return await interaction.editReply({ embeds: [embed], ephemeral: true });
	return await interaction.reply({ embeds: [embed], ephemeral: true });
};
