import type { Event } from "@interfaces/discord";

import reactionMenu from "@submission/actions/reactionMenu";
import getPackByChannel from "@submission/discord/getPackByChannel";
import { MessageReaction, User } from "discord.js";

export default {
	name: "messageReactionAdd",
	async execute(reaction: MessageReaction, user: User) {
		// Ignore bot reactions
		if (user.bot) return;

		if (getPackByChannel(reaction.message.channel.id) !== undefined)
			return reactionMenu(reaction, user);
	},
} as Event;
