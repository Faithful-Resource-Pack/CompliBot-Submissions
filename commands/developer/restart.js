const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const startBot = require("@index");
const fetchSettings = require("@functions/fetchSettings");

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { noPermission } = require("@helpers/permissions");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("restart")
		.setDescription(strings.command.description.restart),
	async execute(interaction) {
		if (!process.env.DEVELOPERS.includes(interaction.user.id)) return noPermission(interaction);

		await interaction.reply({
			embeds: [new EmbedBuilder().setTitle("Restarting...").setColor(settings.colors.blue)],
		});

		interaction.client.destroy();

		fetchSettings()
			.then(() => startBot())
			.catch(() =>
				interaction.channel.send({
					embeds: [
						new EmbedBuilder()
							.setTitle("Something went wrong when restarting the bot!")
							.setDescription("This error is likely related to fetching `settings.json`")
							.setColor(settings.colors.red)
							.setThumbnail(settings.images.error),
					],
				}),
			);
	},
};
