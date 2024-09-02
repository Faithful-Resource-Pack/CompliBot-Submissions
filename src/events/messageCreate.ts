import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import submitTexture from "@submission/submitTexture";
import cancelSubmission from "@functions/submission/utility/cancelSubmission";
import type { PackFile } from "@interfaces/database";
import type { Event } from "@interfaces/discord";
import { Message } from "discord.js";

export default {
	name: "messageCreate",
	async execute(message: Message) {
		// Ignore bot and DM messages
		if (message.author.bot || !message.inGuild()) return;
		const packs: PackFile = require("@resources/packs.json");

		/**
		 * TEXTURE SUBMISSION
		 */
		if (Object.values(packs).some((pack) => pack.submission.channels.submit == message.channel.id))
			return submitTexture(message);

		/**
		 * BASIC AUTOREACT
		 */
		if (settings.discord.channels.autoreact.includes(message.channel.id)) {
			if (!message.attachments.size)
				return cancelSubmission(message, strings.submission.image_not_attached);

			await message.react(settings.emojis.upvote);
			await message.react(settings.emojis.downvote);
		}
	},
} as Event;
