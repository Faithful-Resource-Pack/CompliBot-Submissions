const strings = require("@resources/strings.json");
const settings = require("@resources/settings.json");

const warnUser = require("@helpers/warnUser");
const { ActivityType, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { EmbedBuilder } = require("discord.js");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("status")
		.setDescription(strings.command.description.status)
		.addStringOption((option) =>
			option
				.setName("activity")
				.setDescription("What activity the bot is doing (e.g. playing, streaming)")
				.addChoices(
					...Object.values(ActivityType)
						.filter((x) => typeof x == "string")
						.map((i) => {
							return { name: i, value: i };
						}),
				)
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("presence")
				.setDescription("What presence the bot should have")
				.addChoices(
					{ name: "Online", value: "online" },
					{ name: "Idle", value: "idle" },
					{ name: "Do not Disturb", value: "dnd" },
				)
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("message")
				.setDescription("Message to show after the bot activity")
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		if (!process.env.DEVELOPERS.includes(interaction.user.id))
			return warnUser(interaction, strings.command.no_permission);

		const activity = interaction.options.getString("activity", true);
		const presence = interaction.options.getString("presence", true);
		const message = interaction.options.getString("message", true);

		interaction.client.user.setPresence({
			activities: [
				{
					name: message,
					type: ActivityType[activity],
				},
			],
			status: presence,
		});

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Bot status successfully changed!")
					.setColor(settings.colors.blue),
			],
			ephemeral: true,
		});
	},
};
