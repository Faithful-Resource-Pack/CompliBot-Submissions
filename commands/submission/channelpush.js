const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const { sendToCouncil, sendToResults } = require("@submission/sendToChannel");
const warnUser = require("@helpers/warnUser");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("channelpush")
		.setDescription(strings.command.description.channelpush)
		.addStringOption((option) =>
			option
				.setName("pack")
				.setDescription("Which pack to push.")
				.addChoices(
					{ name: "All", value: "all" },
					...Object.values(require("@resources/packs.json")).map((pack) => ({
						name: pack.name,
						value: pack.id,
					})),
				)
				.setRequired(true),
		)
		.addIntegerOption((option) =>
			option.setName("delay").setDescription("Manually override the pack submission delay."),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		const submissions = require("@resources/packs.json");
		const choice = interaction.options.getString("pack", true);
		const delay = interaction.options.getInteger("delay", false);
		if (choice == "all" && !process.env.DEVELOPERS.includes(interaction.user.id))
			return warnUser(interaction, strings.command.no_permission);

		/** @type {import("@helpers/jsdoc").Pack[]} */
		const packs = choice == "all" ? Object.values(submissions) : [submissions[choice]];

		await interaction.deferReply();

		for (const pack of packs) {
			await sendToResults(interaction.client, pack.submission, delay);
			if (pack.submission.council_enabled)
				await sendToCouncil(interaction.client, pack.submission, delay);
		}

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Successfully sent all submissions!")
					.setColor(settings.colors.green),
			],
		});
	},
};
