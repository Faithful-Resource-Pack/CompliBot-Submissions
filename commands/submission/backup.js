const settings = require("@resources/settings.json");
const saveDB = require("@functions/saveDB");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	name: "backup",
	aliases: ["bdb"],
	guildOnly: false,
	async execute(client, message, args) {
		if (process.env.DEVELOPERS.includes(message.author.id)) {
			const succeeded = await saveDB(client, `Manual backup executed by: ${message.author.username}`);
			await message.react(succeeded  ? settings.emojis.upvote : settings.emojis.downvote);
		}
	},
};
