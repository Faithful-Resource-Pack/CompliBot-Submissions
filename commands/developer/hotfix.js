const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { SlashCommandBuilder } = require("discord.js");

const { noPermission } = require("@helpers/permissions");

const fs = require("fs");
const { sendToCouncil, sendToResults } = require("@submission/sendToChannel");
const { downloadResults } = require("@submission/downloadResults");
const pushTextures = require("@submission/pushTextures");
const saveDB = require("@functions/saveDB");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("hotfix")
		.setDescription(strings.command.description.hotfix),
	async execute(interaction) {
		if (!process.env.DEVELOPERS.includes(interaction.user.id)) return noPermission(interaction);
		// put code here on the vps when editing
		await interaction.reply({
			content: "This command doesn't currently do anything!",
			ephemeral: true,
		});
	},
};
