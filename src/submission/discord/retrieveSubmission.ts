import settings from "@resources/settings.json";

import getMessages from "@helpers/getMessages";

import { ActionRow, Client, Embed, Message, MessageActionRowComponent } from "discord.js";

export interface SendableMessage {
	upvote: number;
	downvote: number;
	embed: Embed;
	components: ActionRow<MessageActionRowComponent>[];
	message: Message;
}

// +1 for bot's own reaction
export const DEFAULT_REACTION_COUNT = 1;

/**
 * Filter submissions from a given date and split by vote counts
 * @author Juknum
 * @param client
 * @param channelID where to retrieve from
 * @param delay delay in days from day of retrieval
 * @returns found messages split by vote count
 */
export default async function retrieveSubmission(client: Client, channelID: string, delay: number) {
	const delayedDate = new Date();
	delayedDate.setDate(delayedDate.getDate() - delay);

	const messages = await getMessages(client, channelID, (message) => {
		const messageDate = new Date(message.createdTimestamp);
		return (
			// correct date
			messageDate.getDate() === delayedDate.getDate() &&
			messageDate.getMonth() === delayedDate.getMonth() &&
			messageDate.getFullYear() === delayedDate.getFullYear() &&
			// only get pending submissions
			message.embeds?.[0]?.fields[1]?.value?.includes(settings.emojis.pending)
		);
	});

	const mappedMessages: SendableMessage[] = messages.map(mapSendableMessage);

	const messagesUpvoted = mappedMessages.filter(
		({ upvote, downvote }) =>
			upvote > downvote ||
			// if nobody voted assume nobody cares
			(upvote === DEFAULT_REACTION_COUNT && downvote === DEFAULT_REACTION_COUNT),
	);

	return {
		messagesUpvoted,
		// whatever isn't in messagesUpvoted is denied (reduces redundancy this way)
		messagesDownvoted: mappedMessages.filter((msg) => !messagesUpvoted.includes(msg)),
	};
}

/**
 * Map a texture to a sendable format
 * @author Juknum
 * @param message message to map
 * @returns sendable message
 */
export const mapSendableMessage = (message: Message): SendableMessage => ({
	// sometimes cache misses cause some really strange bugs
	// todo: investigate more robust way to deal with it
	upvote: message.reactions.cache.get(settings.emojis.upvote)?.count ?? DEFAULT_REACTION_COUNT,
	downvote: message.reactions.cache.get(settings.emojis.downvote)?.count ?? DEFAULT_REACTION_COUNT,
	embed: message.embeds[0],
	// djs v14.19 workaround
	components: message.components as ActionRow<MessageActionRowComponent>[],
	message,
});
