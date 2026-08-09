import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import type { Submission } from "@interfaces/database";

import retrieveSubmissions, {
	DEFAULT_REACTION_COUNT,
	type SendableMessage,
} from "@submission/discord/retrieveSubmissions";
import changeStatus, { editEmbed } from "@submission/discord/changeStatus";

import { submissionButtons } from "@helpers/interactions";

import { BaseMessageOptions, Client, TextChannel } from "discord.js";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

/**
 * Send textures to a new channel following result-like rules
 * @author Evorp
 * @param client
 * @param pack pack information
 * @param delay override delay
 */
export default async function sendResults(client: Client, pack: Submission, delay?: number) {
	const channelOut = client.channels.cache.get(pack.channels.results) as TextChannel;

	if (DEBUG) console.log(`Sending textures to channel: #${channelOut.name}`);

	const { messagesUpvoted, messagesDownvoted } = await retrieveSubmissions(
		client,
		pack.channels.submit,
		delay ?? pack.time_to_results,
	);

	// handle synchronously to preserve submission order (important when processing multiple identical textures)
	for (const message of messagesUpvoted)
		await sendMessage(message, channelOut, {
			color: settings.colors.green,
			emoji: `<:upvote:${settings.emojis.upvote}>`,
			components: [submissionButtons],
			originalStatus: strings.submission.status.original_approved,
			resultStatus: `${strings.submission.status.results_approved} ${getPercentage(message.upvotes, message.downvotes)}`,
		});

	// group denied submissions at bottom of channel (more important for contributors to see)
	for (const message of messagesDownvoted)
		await sendMessage(message, channelOut, {
			color: settings.colors.red,
			emoji: `<:downvote:${settings.emojis.downvote}>`,
			originalStatus: strings.submission.status.original_denied,
			resultStatus: `${strings.submission.status.results_denied} ${getPercentage(
				message.upvotes,
				message.downvotes,
			)}`,
		});
}

export interface SubmissionStatusChange {
	color: string; // what color the embed should be
	emoji?: string; // prepend emoji to the status messages
	components?: BaseMessageOptions["components"]; // override components if needed
	originalStatus: string; // original submission status message
	resultStatus: string; // result submission status message
}

/**
 * Send a submission message to a new channel and edit its status
 * @author Evorp
 * @param message Message to send
 * @param channelOut Channel to send to
 * @param status Status, color, and emojis to use
 * @returns Sent message (for use in instapass etc)
 */
export function sendMessage(
	message: SendableMessage,
	channelOut: TextChannel,
	{ color, emoji, components, originalStatus, resultStatus }: SubmissionStatusChange,
) {
	const resultEmbed = editEmbed(message.embed, {
		color,
		status: emoji ? `${emoji} ${resultStatus}` : resultStatus,
	});
	resultEmbed.setDescription(
		`[${strings.submission.field.original_post}](${message.message.url})\n${message.embed.description ?? ""}`,
	);

	// fallback if not provided
	components ||= message.components;
	// this doesn't need to happen immediately
	changeStatus(message.message, {
		status: emoji ? `${emoji} ${originalStatus}` : originalStatus,
		color,
		components,
	});

	return channelOut.send({ embeds: [resultEmbed], components });
}

/**
 * Calculates percentage of upvotes and returns a formatted string
 * @author Evorp, Juknum
 * @param upvotes upvote objects
 * @param downvotes downvote objects
 * @returns formatted string (or an empty string if not possible)
 */
export function getPercentage(upvotes: number, downvotes: number) {
	const upvotePercentage =
		((upvotes - DEFAULT_REACTION_COUNT) * 100) /
		(upvotes - DEFAULT_REACTION_COUNT + (downvotes - DEFAULT_REACTION_COUNT));
	// handle division by zero and cache issues
	if (isNaN(upvotePercentage) || !isFinite(upvotePercentage)) return "";
	return strings.submission.status.upvote_percentage.replace(
		"%d",
		String(Number(upvotePercentage.toFixed(2))),
	);
}
