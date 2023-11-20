const addDeleteButton = require("@helpers/addDeleteButton");
const { writeSubmissionChanges } = require("@helpers/submissionConfig");
const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("votetime")
		.setDescription(strings.command.description.setchannel)
		.addStringOption((option) =>
			option
				.setName("pack")
				.setDescription("Which pack to set the voting time for.")
				.addChoices(
					...Object.entries(settings.submission.packs).map(([key, val]) => ({
						name: val.display_name,
						value: key,
					})),
				)
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("phase")
				.setDescription("Which phase the new vote time should be for.")
				.addChoices(
					{ name: "Community Voting", value: "results" },
					{ name: "Council Voting", value: "council" },
				)
				.setRequired(true),
		)
		.addNumberOption((option) =>
			option
				.setName("time")
				.setDescription("Time in days for the specified voting period to last.")
				.setMinValue(1)
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		await interaction.deferReply();

		const choice = interaction.options.getString("pack", true);
		const phase = interaction.options.getString("phase", true);
		const time = interaction.options.getNumber("time", true);

		const packs = structuredClone(settings.submission.packs);

		const oldDelay = packs[choice][`time_to_${phase}`];
		const original = oldDelay ? `${oldDelay} days` : "*None*";

		packs[choice][`time_to_${phase}`] = time;

		// if you're setting a council phase council should be enabled (obviously)
		if (phase == "council") packs[choice].council_enabled = true;

		await interaction
			.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle(
							`Time to ${phase} has been changed to ${time} days for pack "${packs[choice].display_name}"!`,
						)
						.setDescription(
							`*Note: If council voting is not enabled, the community voting time will serve as the total time to results.*`,
						)
						.addFields({ name: "Previous Delay", value: original })
						.setColor(settings.colors.green),
				],
			})
			.then(addDeleteButton);

		await writeSubmissionChanges(interaction.client, packs);
	},
};
