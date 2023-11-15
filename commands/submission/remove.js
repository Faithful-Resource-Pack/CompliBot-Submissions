const addDeleteButton = require("@helpers/addDeleteButton");
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
				.setDescription("Pack to delete.")
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
		const removedData = packs[choice];
		delete packs[choice];
		await writeSubmissionChanges(interaction.client, packs);

		await interaction
			.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle(`Pack "${removedData.display_name}" removed from submissions!`)
						.setDescription(
							`Removed data:\`\`\`json\n${JSON.stringify(removedData, null, 4)}\`\`\``,
						)
						.setColor(settings.colors.red),
				],
			})
			.then(addDeleteButton);
	},
};
