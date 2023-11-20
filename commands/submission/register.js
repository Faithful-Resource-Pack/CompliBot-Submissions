const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");
const { createPackID, writeSubmissionChanges } = require("@helpers/submissionConfig");

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const addDeleteButton = require("@helpers/addDeleteButton");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("register")
		.setDescription(strings.command.description.register)
		.addStringOption((option) =>
			option.setName("pack").setDescription("Pack name to create.").setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		await interaction.deferReply();
		const choice = interaction.options.getString("pack", true);
		const packs = structuredClone(settings.submission.packs);
		const id = createPackID(choice);

		packs[id] = {
			display_name: choice,
			channels: {},
			github: {},
			time_to_results: 2, // defaults
		};

		await interaction
			.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle(`New pack "${choice}" registered!`)
						.setDescription(`Pack ID configured as \`${id}\`.`)
						.setColor(settings.colors.green),
				],
			})
			.then(addDeleteButton);

		await writeSubmissionChanges(interaction.client, packs);
	},
};
