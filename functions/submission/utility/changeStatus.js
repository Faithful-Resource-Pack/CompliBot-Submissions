const { EmbedBuilder } = require("discord.js");

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
 * @param {StatusParams} params
 */
module.exports = async function changeStatus(
	message,
	{ status, color, components, editOriginal = false },
) {
	const embed = EmbedBuilder.from(message.embeds[0]);
	// fields[1] is always the status field in submissions
	embed.data.fields[1].value = status;

	if (color) embed.setColor(color);
	if (!components) components = Array.from(message.components);
	await message.edit({ embeds: [embed], components });

	// no original post to edit
	if (!editOriginal) return;

	const description = message.embeds[0].description;

	// not in council
	if (!description?.startsWith("[Original Post](")) return;

	// extremely questionable string slicing to get original message id from submission description
	const [channelID, messageID] = description
		.replace("[Original Post](", "") // remove markdown links
		.replace(")", "")
		.split(/\s+/g)[0] // get just the url
		.split("/") // split url into ids
		.slice(-2);

	try {
		/** @type {import("discord.js").TextChannel} */
		const channel = await message.client.channels.fetch(channelID);
		const originalMessage = await channel.messages.fetch(messageID);

		// recursive, but editOriginal disabled this time
		return changeStatus(originalMessage, { status, color, components });
	} catch {
		// message deleted or something
	}
};
