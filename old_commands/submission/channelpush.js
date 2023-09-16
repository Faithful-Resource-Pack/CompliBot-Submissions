const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { sendToCouncil, sendToResults } = require("@submission/sendToChannel");
const warnUser = require("@helpers/warnUser");
const hasPermission = require("@helpers/hasPermission");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	name: "channelpush",
	guildOnly: false,
	async execute(client, message, args) {
		if (!hasPermission(message.member, "administrator"))
			return warnUser(message, strings.command.no_permission);
		if (!args.length) return warnUser(message, strings.command.args.none_given);

		/** @type {import("@helpers/jsdoc").SubmissionPack[]} */
		let packs = [settings.submission.packs[args[0]]];
		if (args[0] == "all") packs = Object.values(settings.submission.packs);
		if (!packs[0]) return warnUser(message, strings.command.args.invalid);

		for (const pack of packs) {
			await sendToResults(client, pack);
			if (pack.council_enabled) await sendToCouncil(client, pack);
		}

		await message.react(settings.emojis.upvote);
	},
};
