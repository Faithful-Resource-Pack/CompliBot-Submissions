const settings = require("@resources/settings.json");

const retrieveSubmission = require("@submission/utility/retrieveSubmission");
const { changeStatus } = require("@submission/utility/changeStatus");
const { imageButtons, submissionReactions } = require("@helpers/interactions");

const { EmbedBuilder } = require("discord.js");

const DEBUG = process.env.DEBUG.toLowerCase() == "true";

/**
 * Send textures to a new channel following council rules
 * @author Evorp
 * @param {import("discord.js").Client} client
 * @param {import("@helpers/jsdoc").SubmissionPack} pack pack information
 */
async function sendToCouncil(client, pack) {
	// pack improperly set up, send to results instead
	if (!pack.channels.council) return;
	const channelOut = client.channels.cache.get(pack.channels.council);

	if (DEBUG) console.log(`Sending textures to channel: #${channelOut.name}`);

	const { messagesUpvoted, messagesDownvoted } = await retrieveSubmission(
		client,
		pack.channels.submit, // always fetching from submission channel
		pack.time_to_council,
	);

	for (const message of messagesUpvoted) {
		const councilEmbed = EmbedBuilder.from(message.embed)
			.setColor(settings.colors.council)
			.setDescription(
				`[Original Post](${message.message.url})\n${message.embed.description ?? ""}`,
			);

		const sentMessage = await channelOut.send({
			embeds: [councilEmbed],
			components: message.components,
		});

		for (const emoji of submissionReactions) await sentMessage.react(emoji);

		changeStatus(
			message.message,
			`<:upvote:${settings.emojis.upvote}> Sent to council!`,
			settings.colors.green,
		);
	}

	for (const message of messagesDownvoted) {
		// not sent anywhere, returned early instead
		changeStatus(
			message.message,
			`<:downvote:${settings.emojis.downvote}> Not enough upvotes!`,
			settings.colors.red,
		);
	}
}

/**
 * Send textures to a new channel following result-like rules
 * @author Evorp
 * @param {import("discord.js").Client} client
 * @param {import("@helpers/jsdoc").SubmissionPack} pack pack information
 */
async function sendToResults(client, pack) {
	const channelOut = client.channels.cache.get(pack.channels.results);

	if (DEBUG) console.log(`Sending textures to channel: #${channelOut.name}`);

	const { messagesUpvoted, messagesDownvoted } = await retrieveSubmission(
		client,
		pack.council_enabled
			? pack.channels.council ?? pack.channels.submit // pack improperly set up, pull from submissions
			: pack.channels.submit, // pull from submissions if council disabled
		// with this delay format we can reuse it for both council enabled and disabled packs
		pack.time_to_results,
	);

	for (const message of messagesUpvoted) {
		const statusField = message.embed.fields[1];
		statusField.value = `<:upvote:${
			settings.emojis.upvote
		}> Will be added in a future version! ${getPercentage(message.upvote, message.downvote)}`;
		const resultEmbed = EmbedBuilder.from(message.embed)
			.spliceFields(1, 1, statusField)
			.setColor(settings.colors.green);

		// if we're coming straight from submissions
		if (!message.embed.description?.startsWith("[Original Post]("))
			resultEmbed.setDescription(
				`[Original Post](${message.message.url})\n${message.embed.description ?? ""}`,
			);

		await channelOut.send({ embeds: [resultEmbed], components: [imageButtons] });

		changeStatus(
			message.message,
			`<:upvote:${settings.emojis.upvote}> Sent to results!`,
			settings.colors.green,
		);
	}

	for (const message of messagesDownvoted) {
		if (pack.council_enabled) {
			const statusField = message.embed.fields[1];
			statusField.value = `<:downvote:${
				settings.emojis.downvote
			}> This texture did not pass council voting and therefore will not be added. ${getPercentage(
				message.upvote,
				message.downvote,
			)}`;

			const resultEmbed = EmbedBuilder.from(message.embed)
				.spliceFields(1, 1, statusField)
				.setColor(settings.colors.red);

			const users = await message.downvote.users.fetch();

			// add council downvotes field between the status and path fields
			resultEmbed.spliceFields(2, 0, {
				name: "Council Downvotes",
				value: `<@!${users
					.filter((user) => !user.bot)
					.map((user) => user.id)
					.join(">\n<@!")
					.toString()}>`,
				inline: true,
			});

			// no need to react because there's no more voting, the buttons are enough
			await channelOut.send({ embeds: [resultEmbed], components: message.components });

			changeStatus(
				message.message,
				`<:downvote:${settings.emojis.downvote}> Sent to results!`,
				settings.colors.red,
			);
		} else
			changeStatus(
				message.message,
				`<:downvote:${settings.emojis.downvote}> Not enough upvotes!`,
				settings.colors.red,
			);
	}
}

/**
 * Calculates percentage of upvotes and returns a formatted string
 * @author Evorp, Juknum
 * @param {import("discord.js").MessageReaction} upvotes upvote objects
 * @param {import("discord.js").MessageReaction} downvotes downvote objects
 * @returns {String} formatted string (or an empty string if not possible)
 */
function getPercentage(upvotes, downvotes) {
	const upvotePercentage =
		((upvotes?.count - 1) * 100) / (upvotes?.count - 1 + (downvotes.count - 1));
	if (isNaN(upvotePercentage)) return "";
	return `(${Number(upvotePercentage.toFixed(2))}% upvoted)`;
}

module.exports = {
	sendToResults,
	sendToCouncil,
};
