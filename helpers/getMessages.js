/**
 * Fetch messages from a Discord channel
 * @author Juknum
 * @param {import("discord.js").Client} client
 * @param {String} channelID channel where messages are fetched from
 * @param {Number} fetchAmount amount of messages to try fetching (batches of 100)
 * @returns {Promise<import("discord.js").Message[]>} Returns an Array of all fetched messages
 */
module.exports = async function getMessages(client, channelID, fetchAmount = 100) {
	if (typeof fetchAmount !== "number") return [];

	/** @type {import("discord.js").TextChannel} */
	let channel;
	try {
		channel = client.channels.cache.get(channelID);
	} catch {
		return [];
	}

	// fetch in batches of 100 max
	const limit = Math.min(100, Math.max(0, fetchAmount));

	/** @type {import("discord.js").Message[]} */
	const fetchedMessages = [];

	/** @type {Number} */
	let lastID;

	while (true) {
		/** @type {import("discord.js").ChannelLogsQueryOptions} */
		let options = { limit };

		// if there's over 100 messages fetched start again from the 100th message
		if (lastID !== undefined) options.before = lastID;

		/** @type {import("discord.js").Collection<import("discord.js").Snowflake, import("discord.js").Message>} */
		let messages;
		try {
			messages = await channel.messages.fetch(options);
		} catch (err) {
			console.log(err);
		}

		fetchedMessages.push(...messages.values());

		// start fetching again from the last message if the desired amount couldn't be reached
		lastID = messages.last().id;

		// return if there aren't enough messages in the channel to fetch or desired length is reached
		if (messages.size != limit || fetchedMessages.length >= fetchAmount) return fetchedMessages;
	}
};
