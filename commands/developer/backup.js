const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const saveDB = require("@functions/saveDB");

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const warnUser = require("@helpers/warnUser");
const addDeleteButton = require("@helpers/addDeleteButton");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("backup")
		.setDescription(strings.command.description.backup)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		if (!process.env.DEVELOPERS.includes(interaction.user.id))
			return warnUser(interaction, strings.command.no_permission);

		await interaction.deferReply();

		const { successfulPushes, failedPushes, commit } = await saveDB(
			interaction.client,
			`Manual backup executed by: ${interaction.user.displayName}`,
		);

		const url = `https://github.com/${settings.backup.git.org}/${settings.backup.git.repo}/${
			commit ? `commit/${commit}` : `tree/${settings.backup.git.branch}`
		}`;

		const embed = new EmbedBuilder()
			.setTitle(commit ? "Database backed up!" : "Database could not be backed up.")
			.setURL(url)
			.addFields(
				{
					name: "Successful",
					value: successfulPushes.join("\n") || "*None*",
					inline: true,
				},
				{
					name: "Failed",
					value: failedPushes.join("\n") || "*None*",
					inline: true,
				},
			)
			.setColor(commit ? settings.colors.green : settings.colors.red);

		if (!commit || failedPushes.length)
			embed.setDescription("*Check developer logs for potential failure reasons!*");

		return interaction.editReply({
			embeds: [embed],
		}).then(addDeleteButton);
	},
};
