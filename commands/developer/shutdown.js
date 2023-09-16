const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("shutdown")
		.setDescription(strings.command.description.shutdown),
	async execute(interaction) {
		if (process.env.DEVELOPERS.includes(interaction.user.id)) {
			await interaction.reply({
				embeds: [new EmbedBuilder().setTitle("Shutting down...").setColor(settings.colors.blue)],
			});

			return process.exit();
		}

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setDescription(`<@${message.author.id}> has been banned`)
					.addFields({ name: "Reason", value: "trying to stop me lmao" })
					.setColor(settings.colors.red),
			],
		});
	},
};
