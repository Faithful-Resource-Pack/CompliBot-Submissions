const settings = require("@resources/settings.json");

const reactionMenu = require("@submission/reactionMenu");

/** @type {import("@helpers/jsdoc").Event} */
module.exports = {
	name: "messageReactionAdd",
	/**
	 * @param {import("discord.js").MessageReaction} reaction
	 * @param {import("discord.js").User} user
	 */
	async execute(reaction, user) {
		// Ignore bot reactions
		if (user.bot) return;

		// dark magic to fetch messages sent before the start of the bot
		if (reaction.message.partial) await reaction.message.fetch();

		// reaction tray
		if (
			Object.values(settings.submission.packs).some((pack) =>
				Object.values(pack.channels).includes(reaction.message.channel.id),
			)
		)
			return reactionMenu(reaction, user);
	},
};
