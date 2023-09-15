const strings = require("@resources/strings.json");
const settings = require("@resources/settings.json");

const warnUser = require("@helpers/warnUser");
const { ActivityType } = require("discord.js");

// the enums don't work for presence
const presence = ["online", "idle", "dnd"];

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	name: "status",
	aliases: ["presence", "activity"],
	guildOnly: false,
	async execute(client, message, args) {
		if (!process.env.DEVELOPERS.includes(message.author.id))
			return warnUser(message, strings.command.no_permission);

		if (!args.length) return warnUser(message, strings.command.args.none_given);

		if (args[0] == "None") args[0] = "Custom";

		const content = message.content.split(" ").slice(3).join(" ");

		console.log(content);

		// since args is converted to lowercase in the handler we need to undo that
		args[0] = args[0].replace(/\b(\w)/gu, (letter) => letter.toUpperCase());
		if (ActivityType[args[0]] !== undefined && presence.includes(args[1])) {
			client.user.setPresence({
				activities: [
					{
						name: content,
						type: ActivityType[args[0]],
					},
				],
				status: args[1],
			});
			return await message.react(settings.emojis.upvote);
		}

		return await message.react(settings.emojis.downvote);
	},
};
