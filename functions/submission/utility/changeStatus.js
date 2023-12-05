const { EmbedBuilder } = require("discord.js");

/**
 * Edit submission status
 * @author Evorp
 * @param {import("discord.js").Message} message message to edit
 * @param {string} status status to change (e.g. instapass, invalid, etc)
 * @param {string} [color] optionally change embed color to match with status
 * @param {import("discord.js").ActionRowBuilder[]} [components] optionally change components to match status
 */
async function changeStatus(message, status, color, components) {
	const embed = EmbedBuilder.from(message.embeds[0]);
	// fields[1] is always the status field in submissions
	embed.data.fields[1].value = status;

	if (color) embed.setColor(color);
	if (!components) components = [...message.components];
	await message.edit({ embeds: [embed], components: components });
}

/**
 * Edit original post's status from council
 * @author Evorp
 * @param {import("discord.js").Message} message message to get original message from
 * @param {string} status status to change (e.g. instapass, invalid, etc)
 * @param {string} [color] optionally change embed color to match with status
 * @param {import("discord.js").ActionRowBuilder[]} [components] optionally change components to match status
 */
async function changeOriginalStatus(message, status, color, components) {
	const description = message.embeds[0]?.description;

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

		return changeStatus(originalMessage, status, color, components);
	} catch {
		// message deleted or something
	}
}

module.exports = {
	changeStatus,
	changeOriginalStatus,
};
