const settings = require("@resources/settings.json");

const retrieveSubmission = require("@submission/utility/retrieveSubmission");
const changeStatus = require("@submission/utility/changeStatus");
const { imageButtons, submissionReactions } = require("@helpers/interactions");

const { MessageEmbed } = require("discord.js");

/**
 * Send textures to a new channel following council rules
 * @author Evorp
 * @param {import("discord.js").Client} client
 * @param {import("@helpers/jsdoc").Pack} pack which pack to fetch
 * @param {Number} delay delay to fetch textures from
 */
async function sendToCouncil(client, pack, delay) {
	const { submit, council } = settings.submission.packs[pack].channels;
	const { messagesUpvoted, messagesDownvoted, channelOut } = await retrieveSubmission(
		client,
		submit,
		council,
		delay,
	);

	// council channel doesn't exist for given pack, improperly set up
	if (!channelOut) return;

	for (const message of messagesUpvoted) {
		const councilEmbed = new MessageEmbed(message.embed)
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
 * @param {import("@helpers/jsdoc").Pack} pack which pack to fetch
 * @param {Number} delay delay to fetch textures from
 * @param {Boolean} councilEnabled whether to fetch straight from submissions or from council
 */
async function sendToResults(client, pack, delay, councilEnabled = true) {
	const { submit, council, results } = settings.submission.packs[pack].channels;
	const fromID = council;

	// council disabled so we fetch from submissions instead
	if (!councilEnabled) fromID = submit;

	const { messagesUpvoted, messagesDownvoted, channelOut } = await retrieveSubmission(
		client,
		fromID,
		results,
		delay,
	);

	for (const message of messagesUpvoted) {
		const resultEmbed = new MessageEmbed(message.embed).setColor(settings.colors.green);
		resultEmbed.fields[1].value = `<:upvote:${
			settings.emojis.upvote
		}> Will be added in a future version! ${getPercentage(message.upvote, message.downvote)}`;

		// if we're coming straight from submissions
		if (!resultEmbed.description?.startsWith("[Original Post]("))
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
		if (councilEnabled) {
			message.embed.setColor(settings.colors.red);
			const resultEmbed = new MessageEmbed(message.embed);
			resultEmbed.fields[1].value = `<:downvote:${
				settings.emojis.downvote
			}> This texture did not pass council voting and therefore will not be added. ${getPercentage(
				message.upvote,
				message.downvote,
			)}`;

			const users = await message.downvote.users.fetch();

			// add council downvotes field between the status and path fields
			resultEmbed.fields.splice(2, 0, {
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
