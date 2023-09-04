const client = require("@index").Client;
const settings = require("@resources/settings.json");

const reactionMenu = require("@submission/reactionMenu");

module.exports = {
	name: "messageReactionAdd",
	async execute(reaction, user) {
		if (user.bot) return;

		// dark magic to fetch messages sent before the start of the bot
		if (reaction.message.partial) await reaction.message.fetch();

		// TEXTURE SUBMISSIONS
		const channelArray = Object.values(settings.submission.packs)
			.map((i) => Object.values(i.channels))
			.flat();

		if (channelArray.includes(reaction.message.channel.id)) {
			return await reactionMenu(client, reaction, user);
		}
	},
};
