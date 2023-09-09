const { Permissions } = require("discord.js");
const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { sendToCouncil, sendToResults } = require("@submission/sendToChannel");
const warnUser = require("@helpers/warnUser");

module.exports = {
	name: "channelpush",
	guildOnly: false,
	async execute(client, message, args) {
		if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR))
			return warnUser(message, strings.command.no_permission);
		if (!args.length) return warnUser(message, strings.command.args.none_given);

		let packs = Object.entries(settings.submission.packs).filter((obj) => obj[0] == args[0]);
		if (args[0] == "all") packs = Object.entries(settings.submission.packs);
		if (!packs[0]) return warnUser(message, strings.command.args.invalid);

		for (const [pack, info] of packs) {
			await sendToResults(client, pack, info.time_to_results, info.council_enabled);
			if (info.council_enabled) await sendToCouncil(client, pack, info.time_to_council);
		}
	},
};
