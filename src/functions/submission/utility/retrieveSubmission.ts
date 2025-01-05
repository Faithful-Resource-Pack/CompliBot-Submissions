import settings from "@resources/settings.json";

import getMessages from "@helpers/getMessages";
import {
	ActionRow,
	Client,
	Embed,
	Message,
	MessageActionRowComponent,
	MessageReaction,
} from "discord.js";

export interface SendableMessage {
	upvote: MessageReaction;
	downvote: MessageReaction;
	embed: Embed;
	components: ActionRow<MessageActionRowComponent>[];
	message: Message;
}

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

	const mappedMessages: SendableMessage[] = messages.map((message) => ({
		upvote: message.reactions.cache.get(settings.emojis.upvote),
		downvote: message.reactions.cache.get(settings.emojis.downvote),
		embed: message.embeds[0],
		components: message.components,
		message: message,
	}));

	const messagesUpvoted = mappedMessages.filter((message) => {
		// handle undefined vote counts (probably discord api problem)
		// fall back to one to account for bot reaction
		const upvoteCount = message.upvote?.count ?? 1;
		const downvoteCount = message.downvote?.count ?? 1;

		return (
			upvoteCount > downvoteCount ||
			// if nobody voted assume nobody cares
			(upvoteCount === 1 && downvoteCount === 1)
		);
	});

	return {
		messagesUpvoted,
		// whatever isn't in messagesUpvoted is denied (reduces redundancy this way)
		messagesDownvoted: mappedMessages.filter((msg) => !messagesUpvoted.includes(msg)),
	};
}
