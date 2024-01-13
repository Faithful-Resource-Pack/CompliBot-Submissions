const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const addDeleteButton = require("@helpers/addDeleteButton");

const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("shutdown")
		.setDescription(strings.command.description.shutdown)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		if (process.env.DEVELOPERS.includes(interaction.user.id)) {
			return interaction
				.reply({
					embeds: [
						new EmbedBuilder()
							.setAuthor({
								name: "Member banned",
								iconURL:
									"https://raw.githubusercontent.com/Faithful-Resource-Pack/Branding/main/role%20icons/5%20-%20Moderator.png",
							})
							.setDescription(`<@${interaction.user.id}> has been banned`)
							.addFields({ name: "Reason", value: "trying to stop me lmao" })
							.setColor(settings.colors.red),
					],
					fetchReply: true,
				})
				.then(addDeleteButton);
		}

		await interaction.reply({
			embeds: [new EmbedBuilder().setTitle("Shutting down...").setColor(settings.colors.blue)],
		});
		return process.exit();
	},
};
