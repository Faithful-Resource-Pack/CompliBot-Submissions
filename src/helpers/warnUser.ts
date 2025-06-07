import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import { EmbedBuilder, Message, MessageFlags } from "discord.js";
import addDeleteButton from "@helpers/addDeleteButton";
import type { AnyInteraction } from "@interfaces/discord";

/**
 * Generic error message for both interactions and messages
 * @author Juknum, Evorp
 * @param interaction valid message/interaction object
 * @param text
 * @param deferred whether to reply directly or to edit the deferred reply
 * @returns warn message
 */
export default async function warnUser(
	interaction: AnyInteraction | Message,
	text = strings.bot.error,
	deferred = false,
): Promise<Message> {
	const embed = new EmbedBuilder()
		.setColor(settings.colors.red)
		.setThumbnail(settings.images.warning)
		.setTitle(strings.bot.error)
		.setDescription(text);

	if (interaction instanceof Message)
		return interaction.reply({ embeds: [embed] }).then(addDeleteButton);

	if (deferred) {
		await interaction.deleteReply().catch(() => {});
		return interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
	}
	return interaction
		.reply({
			embeds: [embed],
			flags: MessageFlags.Ephemeral,
			withResponse: true,
		})
		.then(({ resource }) => resource.message);
}
