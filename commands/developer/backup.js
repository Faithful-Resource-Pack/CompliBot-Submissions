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

		const { successfulPushes, failedPushes, commit } = await saveDB(
			interaction.client,
			`Manual backup executed by: ${interaction.user.displayName}`,
		);

		const url = `https://github.com/${settings.backup.git.org}/${settings.backup.git.repo}/${
			commit ? `commit/${commit}` : `tree/${settings.backup.git.branch}`
		}`;

		return await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Database backed up!")
					.setURL(url)
					.setDescription(
						failedPushes.length
							? "*Check developer logs for potential failure reasons!*"
							: undefined,
					)
					.addFields(
						{ name: "Successful", value: successfulPushes.join("\n"), inline: true },
						{ name: "Failed", value: failedPushes.join("\n"), inline: true },
					)
					.setColor(
						successfulPushes.length > failedPushes.length
							? settings.colors.blue
							: settings.colors.red,
					),
			],
		});
	},
};
