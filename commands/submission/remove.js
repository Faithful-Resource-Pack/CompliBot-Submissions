const { writeSubmissionChanges } = require("@helpers/submissionConfig");
const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("remove")
		.setDescription(strings.command.description.remove)
		.addStringOption((option) =>
			option
				.setName("pack")
				.setDescription("Pack to delete. This action cannot easily be undone!")
				.addChoices(
					...Object.entries(settings.submission.packs).map(([key, val]) => ({
						name: val.display_name,
						value: key,
					})),
				)
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		await interaction.deferReply();
		const choice = interaction.options.getString("pack", true);

		const packs = structuredClone(settings.submission.packs);
		const display = packs[choice].display_name;
		delete packs[choice];
		await writeSubmissionChanges(interaction.client, packs);

		return await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle(`Pack "${display}" removed from submissions!`)
					.setDescription(`Use \`/register\` to create a new pack.`)
					.setColor(settings.colors.red),
			],
		});
	},
};
