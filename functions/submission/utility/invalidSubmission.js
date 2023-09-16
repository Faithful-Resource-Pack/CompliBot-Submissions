const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const addDeleteButton = require("@helpers/addDeleteButton");
const { EmbedBuilder } = require("discord.js");
const { hasPermission } = require("@helpers/permissions");

const DEBUG = process.env.DEBUG.toLowerCase() == "true";

/**
 * Logic for handling an invalid submission
 * @author Juknum
 * @param {import("discord.js").Message} message message to check permissions of
 * @param {String?} error optional error message
 */
module.exports = async function invalidSubmission(message, error = "No error given!") {
	// allow managers and council to talk in submit channels
	if (
		hasPermission(message.member, "any") &&
		// fix no error messages showing for council+
		error == strings.submission.image_not_attached
	)
		return;

	if (DEBUG) console.log(`Submission cancelled with reason: ${error}`);

	const embed = new EmbedBuilder()
		.setColor(settings.colors.red)
		.setTitle(strings.submission.autoreact.error_title)
		.setThumbnail(settings.images.warning)
		.setDescription(error)
		.setFooter({
			text: strings.submission.autoreact.error_footer,
			iconURL: message.client.user.displayAvatarURL(),
		});

	try {
		const msg = message.deletable
			? await message.reply({ embeds: [embed] })
			: await message.channel.send({ embeds: [embed] });

		if (msg.deletable) addDeleteButton(msg);

		setTimeout(() => {
			if (msg.deletable) msg.delete();
			if (message.deletable) message.delete();
		}, 30000);
	} catch {
		// message couldn't be deleted
	}
};
