import settings from "@resources/settings.json";
import strings from "@resources/strings.json";
import { defineCommand } from "@interfaces/discord";

import backup from "@functions/backup";
import warnUser from "@helpers/warnUser";
import addDeleteButton from "@helpers/addDeleteButton";

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import formattedDate from "@helpers/formattedDate";

export default defineCommand({
	data: new SlashCommandBuilder()
		.setName("backup")
		.setDescription(strings.command.description.backup)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		if (!process.env.DEVELOPERS.includes(interaction.user.id))
			return warnUser(interaction, strings.command.no_permission);

		await interaction.deferReply();

		const { successfulPushes, failedPushes, commit } = await backup(
			interaction.client,
			strings.submission.commit_message.manual_backup
				.replace("%USER%", interaction.user.displayName)
				.replace("%DATE%", formattedDate()),
		);

		const url = `https://github.com/${settings.backup.git.org}/${settings.backup.git.repo}/${
			commit ? `commit/${commit}` : `tree/${settings.backup.git.branch}`
		}`;

		const embed = new EmbedBuilder()
			.setTitle(strings.command.backup[commit ? "success_title" : "failure_title"])
			.setURL(url)
			.addFields(
				{
					name: strings.command.backup.successful_field,
					value: successfulPushes.join("\n") || strings.global.none,
					inline: true,
				},
				{
					name: strings.command.backup.failed_field,
					value: failedPushes.join("\n") || strings.global.none,
					inline: true,
				},
			)
			.setColor(commit ? settings.colors.green : settings.colors.red);

		if (!commit || failedPushes.length)
			embed.setDescription(strings.command.backup.failure_description);

		return interaction.editReply({
			embeds: [embed],
			components: addDeleteButton(),
		});
	},
});
