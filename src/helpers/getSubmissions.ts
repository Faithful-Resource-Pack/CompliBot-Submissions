import { DiscordTextureSubmission, TextureSubmission } from "@submission/TextureSubmission";
import { TextChannel, Message, FetchMessagesOptions, Client } from "discord.js";

export type MessageFilter = (submission: TextureSubmission) => boolean;

/**
 * Fetch submissions from a Discord channel
 * @author Juknum, Evorp
 * @param client
 * @param channelID channel where messages are fetched from
 * @param filter filter incoming messages
 * @returns fetched messages from oldest to newest
 */
export default async function getSubmissions(
	client: Client,
	channelID: string,
	filter: MessageFilter = () => true,
): Promise<TextureSubmission[]> {
	const channel = client.channels.cache.get(channelID) as TextChannel;
	if (!channel) return [];

	const fetchedSubmissions: TextureSubmission[] = [];

	const options: FetchMessagesOptions = { limit: 100 };

	while (true) {
		const messages = await channel.messages.fetch(options);

		const out = Array.from(messages.values())
			.map(DiscordTextureSubmission.from)
			.filter((submission): submission is TextureSubmission => submission && filter(submission));

		// nothing met criteria
		if (!out.length) return fetchedSubmissions.reverse();

		fetchedSubmissions.push(...out);

		// start fetching again from the last message if there were matches
		options.before = messages.last()?.id;
	}
}
