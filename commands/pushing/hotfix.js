const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const fs = require("fs");
const { sendToCouncil, sendToResults } = require("@submission/sendToChannel");
const downloadResults = require("@submission/downloadResults");
const pushTextures = require("@submission/pushTextures");
const saveDB = require("@functions/saveDB");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	name: "hotfix",
	aliases: ["fix"],
	guildOnly: false,
	async execute(client, message, args) {
		if (!process.env.DEVELOPERS.includes(message.author.id)) return;
		// put code here on the vps when editing
		await message.react(settings.emojis.upvote);
	},
};
