const { EmbedBuilder } = require("discord.js");

const DEBUG = process.env.DEBUG.toLowerCase() == "true";

/**
 * @typedef StatusParams
 * @property {string} status
 * @property {string} [color]
 * @property {import("discord.js").ActionRowBuilder[]} [components]
 * @property {boolean} [editOriginal] find original message via description and edit that too
 */

/**
 * Edit submission status
 * @author Evorp
 * @param {import("discord.js").Message} message message to edit
 * @param {StatusParams} params other options to edit
 * @returns {EmbedBuilder} new submission embed
 */
module.exports = async function changeStatus(
	message,
	{ status, color, components, editOriginal = false },
) {
	if (DEBUG)
		console.log(
			`Changing status "${
				message.embeds?.[0]?.fields?.[1]?.value.split("> ")[1]
			}" to "${status.split("> ")[1]}" for texture: ${message.embeds?.[0]?.title}`,
		);
	const embed = EmbedBuilder.from(message.embeds[0]);
	// fields[1] is always the status field in submissions
	embed.data.fields[1].value = status;

	if (color) embed.setColor(color);
	if (!components) components = Array.from(message.components);
	await message.edit({ embeds: [embed], components });

	// no need to check for original post, return early
	if (!editOriginal || !embed.data.description?.startsWith("[Original Post](")) return embed;

	// get original message id from submission description (pain)
	const [channelID, messageID] = embed.data.description
		.replace("[Original Post](", "") // remove markdown links
		.replace(")", "") // should probably be done with match() and regex
		.split(/\s+/g)[0] // get just the url
		.split("/") // split url into ids
		.slice(-2); // only take the last two ids (channel and message)

	try {
		/** @type {import("discord.js").TextChannel} */
		const channel = await message.client.channels.fetch(channelID);
		const originalMessage = await channel.messages.fetch(messageID);

		// recursive, but editOriginal disabled this time
		await changeStatus(originalMessage, { status, color, components });
	} catch {
		// message deleted or something
	}
	return embed;
};
