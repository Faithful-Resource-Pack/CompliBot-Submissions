const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { SlashCommandBuilder } = require("discord.js");

const { loadCommands, deleteCommands } = require("@functions/commandHandler");
const warnUser = require("@helpers/warnUser");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("reload")
		.setDescription(strings.command.description.reload),
	async execute(interaction) {
		if (!process.env.DEVELOPERS.includes(interaction.user.id))
			return warnUser(interaction, strings.command.no_permission);
		// put code here on the vps when editing

		await deleteCommands(interaction.client, interaction.guild.id);
		await loadCommands(interaction.client);
	},
};
