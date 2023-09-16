const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const fs = require("fs");
const { sendToCouncil, sendToResults } = require("@submission/sendToChannel");
const { downloadResults } = require("@submission/downloadResults");
const pushTextures = require("@submission/pushTextures");
const saveDB = require("@functions/saveDB");
const warnUser = require("@helpers/warnUser");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("hotfix")
		.setDescription(strings.command.description.hotfix)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		if (!process.env.DEVELOPERS.includes(interaction.user.id))
			return warnUser(interaction, strings.command.no_permission);
		// put code here on the vps when editing
		await interaction.reply({
			content: "This command doesn't currently do anything!",
			ephemeral: true,
		});
	},
};
