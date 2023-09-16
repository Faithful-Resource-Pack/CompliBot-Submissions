const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const { sendToCouncil, sendToResults } = require("@submission/sendToChannel");
const warnUser = require("@helpers/warnUser");
const { hasPermission } = require("@helpers/permissions");

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
					{ name: "Faithful 32x", value: "faithful_32x" },
					{ name: "Faithful 64x", value: "faithful_64x" },
					{ name: "Classic Faithful 32x Jappa", value: "classic_faithful_32x" },
					{ name: "Classic Faithful 32x Programmer Art", value: "classic_faithful_32x_progart" },
					{ name: "Classic Faithful 64x", value: "classic_faithful_64x" },
				)
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		if (!hasPermission(interaction.member, "administrator"))
			return warnUser(interaction, strings.command.no_permission);

		const choice = interaction.options.getString("pack", true);

		/** @type {import("@helpers/jsdoc").SubmissionPack[]} */
		const packs =
			choice == "all"
				? Object.values(settings.submission.packs)
				: [settings.submission.packs[choice]];

		await interaction.deferReply({ ephemeral: true });

		for (const pack of packs) {
			await sendToResults(client, pack);
			if (pack.council_enabled) await sendToCouncil(client, pack);
		}

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Successfully pushed all textures")
					.setColor(settings.colors.blue),
			],
		});
	},
};
