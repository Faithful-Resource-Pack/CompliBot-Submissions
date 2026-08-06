import { defineEvent } from "@interfaces/discord";

import reactionMenu from "@submission/actions/reactionMenu";
import getPackByChannel from "@submission/discord/getPackByChannel";

export default defineEvent({
	name: "messageReactionAdd",
	async execute(reaction, user) {
		// Ignore bot reactions
		if (user.bot) return;

		if (getPackByChannel(reaction.message.channel.id) !== undefined)
			return reactionMenu(await reaction.fetch(), await user.fetch());
	},
});
