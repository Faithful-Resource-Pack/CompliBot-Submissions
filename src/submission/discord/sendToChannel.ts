import settings from "@resources/settings.json";

import type { Submission } from "@interfaces/database";

import retrieveSubmission, { DEFAULT_REACTION_COUNT } from "@submission/discord/retrieveSubmission";
import changeStatus, { editEmbed } from "@submission/discord/changeStatus";

import { submissionButtons } from "@helpers/interactions";

import { BaseMessageOptions, Client, TextChannel } from "discord.js";
import { TextureSubmission } from "@interfaces/submission";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

/**
 * Send textures to a new channel following result-like rules
 * @author Evorp
 * @param client
 * @param pack pack information
 * @param delay override delay
 */
export async function sendToResults(client: Client, pack: Submission, delay?: number) {
	const channelOut = client.channels.cache.get(pack.channels.results) as TextChannel;

	if (DEBUG) console.log(`Sending textures to channel: #${channelOut.name}`);

	const { upvotedSubmissions, downvotedSubmissions } = await retrieveSubmission(
		client,
		pack.channels.submit,
		delay ?? pack.time_to_results,
	);

	// must be resolved synchronously for submission order to be respected
	for (const message of upvotedSubmissions)
		await sendMessage(message, channelOut, {
			color: settings.colors.green,
			emoji: `<:upvote:${settings.emojis.upvote}>`,
			components: [submissionButtons],
			originalStatus: "Sent to results!",
			resultStatus: `Will be added in a future version! ${getPercentage(message.votes.upvotes, message.votes.downvotes)}`,
		});

	for (const message of downvotedSubmissions)
		await sendMessage(message, channelOut, {
			color: settings.colors.red,
			emoji: `<:downvote:${settings.emojis.downvote}>`,
			originalStatus: "Not enough upvotes!",
			resultStatus: `This texture did not pass voting and therefore will not be added. ${getPercentage(
				message.votes.upvotes,
				message.votes.downvotes,
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
	message: TextureSubmission,
	channelOut: TextChannel,
	{ color, emoji, components, originalStatus, resultStatus }: SubmissionStatusChange,
) {
	const resultEmbed = editEmbed(message, {
		color,
		status: emoji ? `${emoji} ${resultStatus}` : resultStatus,
	});
	resultEmbed.setDescription(`[Original Post](${message.url})\n${message.description ?? ""}`);

	// fallback if not provided
	components ||= message.components;
	// this doesn't need to happen immediately
	changeStatus(message, {
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
	// handle weird math edge cases
	if (isNaN(upvotePercentage) || !isFinite(upvotePercentage)) return "";
	return `(${Number(upvotePercentage.toFixed(2))}% upvoted)`;
}
