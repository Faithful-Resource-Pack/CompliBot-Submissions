import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import addDeleteButton from "@helpers/addDeleteButton";
import { hasPermission, PermissionType } from "@helpers/permissions";

import { EmbedBuilder, Message } from "discord.js";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

const EMBED_VISIBLE_SECONDS = 30;

/**
 * Logic for handling an invalid submission
 * @author Juknum
 * @param message to check permissions of
 * @param error error message
 */
export default async function cancelSubmission(message: Message<true>, error = "No error given!") {
	// allow managers and council to talk in submit channels
	if (
		hasPermission(message.member, PermissionType.Submission) &&
		// fix no error messages showing for council+
		error === strings.submission.image_not_attached
	)
		return;

	if (DEBUG) console.log(`Submission cancelled with reason: ${error}`);

	const embed = new EmbedBuilder()
		.setColor(settings.colors.red)
		.setTitle(strings.submission.cancelled.error_title)
		.setThumbnail(settings.images.warning)
		.setDescription(error)
		.setFooter({
			text: strings.submission.cancelled.error_footer.replace(
				"%SECONDS%",
				String(EMBED_VISIBLE_SECONDS),
			),
			iconURL: message.client.user.displayAvatarURL(),
		});

	try {
		const noticeMessage = message.deletable
			? await message.reply({ embeds: [embed] })
			: await message.channel.send({ embeds: [embed] });

		if (noticeMessage.deletable) addDeleteButton(noticeMessage);

		setTimeout(() => {
			// throws error if already deleted
			noticeMessage.delete().catch(() => {});
			message.delete().catch(() => {});
		}, EMBED_VISIBLE_SECONDS * 1000);
	} catch {
		// message couldn't be deleted
	}
}
