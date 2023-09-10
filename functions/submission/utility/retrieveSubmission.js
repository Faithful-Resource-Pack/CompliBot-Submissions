const settings = require("@resources/settings.json");

const getMessages = require("@helpers/getMessages");
const { MessageEmbed } = require("discord.js");

const DEBUG = process.env.DEBUG.toLowerCase() == "true";

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
 * @param {String} channelFromID channel from where submissions are retrieved
 * @param {String} channelOutID channel where submissions are sent
 * @param {Number} delay delay in days from today
 * @returns {Promise<{messagesUpvoted: MappedMessage[], messagesDownvoted: MappedMessage[], channel: import("discord.js").TextChannel}>}
 */
module.exports = async function retrieveSubmission(client, channelFromID, channelOutID, delay) {
	let messages = await getMessages(client, channelFromID);

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
			message.upvote.count > message.downvote.count && message.upvote.count >= 1 // if nobody voted assume they don't care
		);
	});

	return {
		messagesUpvoted,
		// whatever isn't in messagesUpvoted is denied
		messagesDownvoted: mappedMessages.filter((msg) => !messagesUpvoted.includes(msg)),
		channelOut: client.channels.cache.get(channelOutID),
	};
};
