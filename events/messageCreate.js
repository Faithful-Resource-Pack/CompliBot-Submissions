const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const submitTexture = require("@submission/submitTexture");
const invalidSubmission = require("@functions/submission/utility/invalidSubmission");

const magnifyMessage = require("@functions/magnifyMessage");

/** @type {import("@helpers/jsdoc").Event} */
module.exports = {
	name: "messageCreate",
	/**
	 * @param {import("discord.js").Client} client
	 * @param {import("discord.js").Message} message
	 */
	async execute(client, message) {
		// Ignore bot messages
		if (message.author.bot) return;

		// magnify shortcut
		if (
			message.content.startsWith(`${process.env.PREFIX}m`) ||
			message.content.startsWith(`${process.env.PREFIX}z`)
		)
			return magnifyMessage(message);

		/**
		 * TEXTURE SUBMISSION
		 */
		const submissionChannels = Object.values(settings.submission.packs).map(
			(pack) => pack.channels.submit,
		);
		if (submissionChannels.includes(message.channel.id)) return submitTexture(client, message);

		/**
		 * BASIC AUTOREACT
		 */
		if (settings.submission.autoreact.includes(message.channel.id)) {
			if (!message.attachments.size)
				return await invalidSubmission(message, strings.submission.image_not_attached);

			await message.react(settings.emojis.upvote);
			await message.react(settings.emojis.downvote);
		}
	},
};
