import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import type { SubmissionSource } from "@interfaces/discord";

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
export default async function cancelSubmission(
	message: SubmissionSource,
	error: unknown = strings.submission.error.unknown,
	// returning undefined makes Promise.all behave better with types
): Promise<undefined> {
	const errorStrings = strings.submission.error;
	if (
		hasPermission(message.member, PermissionType.Submission) &&
		// fix no error messages showing for council+
		[errorStrings.image_not_attached, errorStrings.use_command].includes(String(error))
	)
		// allow managers and council to talk in submit channels
		return;

	if (DEBUG) console.log(`Submission cancelled with reason: ${error}`);

	const options = {
		embeds: [
			new EmbedBuilder()
				.setTitle(errorStrings.title)
				.setDescription(String(error))
				.setColor(settings.colors.red)
				.setThumbnail(settings.images.warning)
				.setFooter({
					text: errorStrings.footer.replace("%SECONDS%", String(EMBED_VISIBLE_SECONDS)),
					iconURL: message.client.user.displayAvatarURL(),
				}),
		],
		components: addDeleteButton(),
	};

	try {
		const noticeMessage =
			message instanceof Message && message.deletable
				? await message.reply(options)
				: await message.channel.send(options);

		setTimeout(() => {
			// throws error if already deleted
			noticeMessage.delete().catch(() => {});
			if (message instanceof Message) message.delete().catch(() => {});
		}, EMBED_VISIBLE_SECONDS * 1000);
	} catch {
		// message couldn't be deleted
	}
}
