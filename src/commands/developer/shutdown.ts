import settings from "@resources/settings.json";
import strings from "@resources/strings.json";
import type { Command } from "@interfaces/discord";

import addDeleteButton from "@helpers/addDeleteButton";

import { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export default {
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
					withResponse: true,
				})
				.then(({ resource }) => addDeleteButton(resource.message));
		}

		await interaction.reply({
			embeds: [new EmbedBuilder().setTitle("Shutting down…").setColor(settings.colors.blue)],
		});
		return process.exit();
	},
} as Command;
