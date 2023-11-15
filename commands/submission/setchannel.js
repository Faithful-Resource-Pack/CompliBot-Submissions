const { writeSubmissionChanges } = require("@helpers/submissionConfig");
const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const phases = {
	submit: "Texture Submission",
	council: "Council Voting",
	results: "Posting Results",
};

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("setchannel")
		.setDescription(strings.command.description.setchannel)
		.addStringOption((option) =>
			option
				.setName("pack")
				.setDescription("Which pack to set a channel as.")
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
				.setDescription("Which purpose the channel should serve.")
				.addChoices(...Object.entries(phases).map(([key, val]) => ({ name: val, value: key })))
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		await interaction.deferReply();

		const choice = interaction.options.getString("pack", true);
		const phase = interaction.options.getString("phase", true);

		const packs = structuredClone(settings.submission.packs);

		const oldChannelID = settings.submission.packs[choice].channels[phase];
		const original = oldChannelID ? `<#${oldChannelID}>` : "*None*";

		packs[choice].channels[phase] = interaction.channel.id;

		await writeSubmissionChanges(interaction.client, packs);

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle(`Channel registered for pack "${packs[choice].display_name}"!`)
					.setDescription(
						`<#${interaction.channel.id}> has been set up for ${phases[phase].toLowerCase()}.`,
					)
					.addFields({ name: "Previous Channel", value: original })
					.setColor(settings.colors.green),
			],
		});
	},
};
