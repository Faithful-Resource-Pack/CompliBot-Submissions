const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const submitTexture = require("@submission/submitTexture");
const cancelSubmission = require("@functions/submission/utility/cancelSubmission");

/** @type {import("@helpers/jsdoc").Event} */
module.exports = {
	name: "messageCreate",
	/** @param {import("discord.js").Message} message */
	async execute(message) {
		// Ignore bot messages
		if (message.author.bot) return;
		const packs = require("@resources/packs.json");

		/**
		 * TEXTURE SUBMISSION
		 */
		if (Object.values(packs).some((pack) => pack.submission.channels.submit == message.channel.id))
			return submitTexture(message);

		/**
		 * BASIC AUTOREACT
		 */
		if (settings.submission.autoreact.includes(message.channel.id)) {
			if (!message.attachments.size)
				return cancelSubmission(message, strings.submission.image_not_attached);

			await message.react(settings.emojis.upvote);
			await message.react(settings.emojis.downvote);
		}
	},
};
