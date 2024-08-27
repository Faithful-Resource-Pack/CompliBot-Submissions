import { TextChannel, Message, FetchMessagesOptions, Client } from "discord.js";

export type MessageFilter = (message: Message) => boolean;

/**
 * Fetch messages from a Discord channel
 * @author Juknum, Evorp
 * @param client
 * @param channelID channel where messages are fetched from
 * @param filter filter incoming messages
 * @returns fetched messages from oldest to newest
 */
export default async function getMessages(
	client: Client,
	channelID: string,
	filter: MessageFilter = () => true,
): Promise<Message[]> {
	const channel = client.channels.cache.get(channelID) as TextChannel;
	if (!channel) return [];

	const fetchedMessages: Message[] = [];

	const options: FetchMessagesOptions = { limit: 100 };

	while (true) {
		const messages = await channel.messages.fetch(options);
		const out = Array.from(messages.values()).filter(filter);

		// nothing met criteria
		if (!out.length) return fetchedMessages.reverse(); // return from oldest -> newest

		fetchedMessages.push(...out);

		// start fetching again from the last message if there were matches
		options.before = messages.last().id;
	}
}
