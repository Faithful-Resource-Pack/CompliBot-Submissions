import { Client, TextChannel, Message, FetchMessagesOptions, Collection } from "discord.js";

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

	const options: FetchMessagesOptions = { limit: 100 };

	// this would compose better as a reduce expression but it's async
	let acc = new Collection<string, Message<true>>();
	while (true) {
		const messages = await channel.messages.fetch(options);
		const cur = messages.filter((message, id) => !acc.has(id) && filter(message));

		// we've exhausted all contiguous items that fit predicate, return from oldest -> newest
		if (!cur.size) return Array.from(acc.values()).reverse();
		acc = acc.concat(cur);

		// start fetching again from the last message if there were matches
		options.before = messages.last()?.id;
	}
}
