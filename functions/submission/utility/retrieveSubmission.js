const settings = require("@resources/settings.json");

const getMessages = require("@helpers/getMessages");

/**
 * @typedef MappedMessage
 * @property {import("discord.js").MessageReaction} upvote
 * @property {import("discord.js").MessageReaction} downvote
 * @property {import("discord.js").MessageEmbed} embed
 * @property {import("discord.js").MessageComponent[]} components
 * @property {import("discord.js").Message} message
 */

/**
 * Filter submissions from a given date and split by vote counts
 * @author Juknum
 * @param {import("discord.js").Client} client
 * @param {String} channelID where to retrieve from
 * @param {Number} delay delay in days from day of retrieval
 * @returns {Promise<{messagesUpvoted: MappedMessage[], messagesDownvoted: MappedMessage[]}>}
 */
module.exports = async function retrieveSubmission(client, channelID, delay) {
	let messages = await getMessages(client, channelID);

	let delayedDate = new Date();
	delayedDate.setDate(delayedDate.getDate() - delay);

	// filter message in the right timezone
	messages = messages
		.filter((message) => {
			let messageDate = new Date(message.createdTimestamp);
			return (
				messageDate.getDate() == delayedDate.getDate() &&
				messageDate.getMonth() == delayedDate.getMonth()
			);
		}) // only get pending submissions
		.filter((message) => message.embeds.length > 0)
		.filter((message) => message.embeds[0].fields[1]?.value?.includes(settings.emojis.pending))
		.reverse(); // upload from oldest to newest

	/** @type {MappedMessage[]} */
	const mappedMessages = messages.map((message) => {
		return {
			upvote: message.reactions.cache.get(settings.emojis.upvote),
			downvote: message.reactions.cache.get(settings.emojis.downvote),
			embed: message.embeds[0],
			components: [...message.components],
			message: message,
		};
	});

	const messagesUpvoted = mappedMessages.filter((message) => {
		// set to one because bot reaction (0 can never be reached)
		if (!message.upvote) message.upvote.count = 1;
		if (!message.downvote) message.downvote.count = 1;

		return (
			message.upvote.count > message.downvote.count ||
			// if nobody voted assume nobody cares
			(message.upvote.count == 1 && message.downvote.count == 1)
		);
	});

	return {
		messagesUpvoted,
		// whatever isn't in messagesUpvoted is denied (reduces redundancy this way)
		messagesDownvoted: mappedMessages.filter((msg) => !messagesUpvoted.includes(msg)),
	};
};
