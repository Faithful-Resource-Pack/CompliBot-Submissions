/**
 * @callback MessageFilter
 * @param {import("discord.js").Message}
 * @returns {boolean}
 */

/**
 * Fetch messages from a Discord channel
 * @author Juknum, Evorp
 * @param {import("discord.js").Client} client
 * @param {string} channelID channel where messages are fetched from
 * @param {MessageFilter} [filter] filter incoming messages
 * @returns {Promise<import("discord.js").Message[]>} fetched messages
 */
module.exports = async function getMessages(client, channelID, filter = () => true) {
	/** @type {import("discord.js").TextChannel} */
	const channel = client.channels.cache.get(channelID);
	if (!channel) return [];

	/** @type {import("discord.js").Message[]} */
	const fetchedMessages = [];

	/** @type {import("discord.js").FetchMessagesOptions} */
	const options = { limit: 100 };

	while (true) {
		const messages = await channel.messages.fetch(options);
		const out = [...messages.values()].filter(filter);

		// nothing met criteria
		if (!out.length) return fetchedMessages.reverse(); // return from oldest -> newest

		fetchedMessages.push(...out);

		// start fetching again from the last message if there were matches
		options.before = messages.last().id;
	}
};
