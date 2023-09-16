const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const saveDB = require("@functions/saveDB");

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const warnUser = require("@helpers/warnUser");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("backup")
		.setDescription(strings.command.description.backup)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		if (!process.env.DEVELOPERS.includes(interaction.user.id))
			return await warnUser(interaction, strings.command.no_permission);

		await interaction.deferReply({ ephemeral: true });

		const succeeded = await saveDB(
			interaction.client,
			`Manual backup executed by: ${interaction.user.username}`,
		);

		if (succeeded)
			return await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setName("Database successfully backed up!")
						.setUrl(
							`https://github.com/${settings.backup.git.org}/${settings.backup.git.repo}/tree/${settings.backup.git.branch}`,
						)
						.setColor(settings.colors.blue),
				],
			});

		return warnUser(interaction, strings.command.backup_failed, true);
	},
};
