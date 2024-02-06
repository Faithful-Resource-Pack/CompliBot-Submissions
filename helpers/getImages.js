const settings = require("@resources/settings.json");

/**
 * Convert AttachmentBuilder objects into sendable URLs
 * @author RobertR11, Evorp
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").AttachmentBuilder[]} files files to get urls from
 * @returns {Promise<string[]>} array of image urls
 */
module.exports = async function getImages(client, ...files) {
	/** @type {import("discord.js").Message} */
	const imgMessage = await client.channels.cache
		.get(settings.discord.channels.images)
		.send({ files });

	return imgMessage.attachments.map((attachment) => attachment.url);
};
