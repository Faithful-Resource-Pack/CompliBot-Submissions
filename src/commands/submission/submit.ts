import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import { defineCommand } from "@interfaces/discord";
import getPackByChannel from "@submission/discord/getPackByChannel";

import { hasPermission, PermissionType } from "@helpers/permissions";
import {
	CheckboxBuilder,
	EmbedBuilder,
	FileUploadBuilder,
	GuildMember,
	LabelBuilder,
	MessageFlags,
	ModalBuilder,
	SlashCommandBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";

export default defineCommand({
	data: new SlashCommandBuilder()
		.setName("submit")
		.setDescription(strings.command.description.submit)
		.setDMPermission(false),
	execute(interaction) {
		if (!getPackByChannel(interaction.channel.id))
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle(strings.submission.error.title)
						.setDescription(strings.submission.error.wrong_command_channel)
						.setColor(settings.colors.red),
				],
				flags: MessageFlags.Ephemeral,
			});

		// design based on a version by ewan howell
		const modal = new ModalBuilder()
			.setCustomId("submissionModal")
			.setTitle(strings.submission.modal.title)
			.addLabelComponents(
				new LabelBuilder()
					.setLabel(strings.submission.modal.description.label)
					.setDescription(strings.submission.modal.description.description)
					.setTextInputComponent(
						new TextInputBuilder()
							.setCustomId("description")
							.setStyle(TextInputStyle.Paragraph)
							.setPlaceholder(strings.submission.modal.description.placeholder)
							.setRequired(false)
							.setMaxLength(1024),
					),
				new LabelBuilder()
					.setLabel(strings.submission.modal.attachments.label)
					.setDescription(strings.submission.modal.attachments.description)
					.setFileUploadComponent(
						new FileUploadBuilder().setCustomId("attachments").setMinValues(1).setMaxValues(10),
					),
			);

		if (hasPermission(interaction.member as GuildMember, PermissionType.Submission))
			modal.addLabelComponents(
				new LabelBuilder()
					.setLabel(strings.submission.modal.starpass.label)
					.setDescription(strings.submission.modal.starpass.description)
					.setCheckboxComponent(new CheckboxBuilder().setCustomId("starpass")),
			);

		return interaction.showModal(modal);
	},
});
