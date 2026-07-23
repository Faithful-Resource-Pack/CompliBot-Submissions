import settings from "@resources/settings.json";
import { Embed } from "discord.js";

/** Every type a texture submission can have */
export enum SubmissionStatus {
	Unknown,
	Pending,
	Approved,
	Denied,
	Instapassed,
	Invalidated,
}

/**
 * Get the status of a submission embed
 * @author Evorp
 * @param embed embed to read
 * @returns embed status as an enum variant (uses Unknown if not an embed or unable to find status)
 */
export function getEmbedStatus(embed: Embed | undefined): SubmissionStatus {
	// there's probably a better way to do this but it's easy to change later
	const statusField = embed?.fields[1]?.value || "";
	if (statusField.includes(settings.emojis.pending)) return SubmissionStatus.Pending;
	if (statusField.includes(settings.emojis.upvote)) return SubmissionStatus.Approved;
	if (statusField.includes(settings.emojis.downvote)) return SubmissionStatus.Denied;
	if (statusField.includes(settings.emojis.instapass)) return SubmissionStatus.Instapassed;
	if (statusField.includes(settings.emojis.invalid)) return SubmissionStatus.Invalidated;
	return SubmissionStatus.Unknown;
}
