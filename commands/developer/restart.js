const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const warnUser = require("@helpers/warnUser");
const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("restart")
		.setDescription(strings.command.description.restart)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		if (!process.env.DEVELOPERS.includes(interaction.user.id))
			return warnUser(interaction, strings.command.no_permission);

		await interaction.reply({
			embeds: [new EmbedBuilder().setTitle("Restarting...").setColor(settings.colors.blue)],
		});

		interaction.client.destroy();

		// delete bot cache
		Object.keys(require.cache).forEach((key) => delete require.cache[key]);
		// restart bot by launching index file
		require("@index");
	},
};
