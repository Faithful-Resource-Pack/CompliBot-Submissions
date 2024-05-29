const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const formattedDate = require("@helpers/formattedDate");
const pushTextures = require("@submission/pushTextures");
const { downloadResults } = require("@submission/handleResults");
const warnUser = require("@helpers/warnUser");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("autopush")
		.setDescription(strings.command.description.autopush)
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
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		const submissions = require("@resources/packs.json");
		const choice = interaction.options.getString("pack", true);
		if (choice == "all" && !process.env.DEVELOPERS.includes(interaction.user.id))
			return warnUser(interaction, strings.command.no_permission);

		/** @type {string[]} */
		const packs = choice == "all" ? Object.values(submissions) : [submissions[choice]];

		const infoEmbed = new EmbedBuilder()
			.setDescription("This can take some time, please wait...")
			.setThumbnail(settings.images.loading)
			.setColor(settings.colors.blue);

		await interaction.reply({
			embeds: [infoEmbed.setTitle("Downloading textures...")],
		});

		await Promise.all(
			packs.map((pack) => downloadResults(interaction.client, pack.submission.channels.results)),
		);

		await interaction.editReply({
			embeds: [infoEmbed.setTitle("Pushing textures...")],
		});

		await Promise.all(
			Object.keys(submissions).map((pack) =>
				pushTextures(
					"./downloadedTextures",
					pack,
					`Manual push executed by ${interaction.user.displayName} on ${formattedDate()}`,
				),
			),
		);

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Successfully pushed all textures!")
					.setColor(settings.colors.green),
			],
		});
	},
};
