import type { Event } from "@interfaces/discord";
import type { PackFile } from "@interfaces/database";

import reactionMenu from "@submission/actions/reactionMenu";
import { MessageReaction, User } from "discord.js";

export default {
	name: "messageReactionAdd",
	async execute(reaction: MessageReaction, user: User) {
		// Ignore bot reactions
		if (user.bot) return;
		const packs: PackFile = require("@resources/packs.json");

		// dark magic to fetch messages sent before the start of the bot
		if (reaction.message.partial) await reaction.message.fetch();

		// reaction tray
		if (
			Object.values(packs).some((pack) =>
				Object.values(pack.submission.channels).includes(reaction.message.channel.id),
			)
		)
			return reactionMenu(reaction, user);
	},
} as Event;
