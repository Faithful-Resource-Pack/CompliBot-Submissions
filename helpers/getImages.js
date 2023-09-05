const settings = require("@resources/settings.json");

/**
 * Convert MessageAttachment objects into sendable URLs
 * @author RobertR11, Evorp
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").MessageAttachment[]} fileArray files to commit
 * @returns {Promise<String[]>} array of image urls from #submission-spam
 */
module.exports = async function getImages(client, ...fileArray) {
	/** @type {import("discord.js").Message} */
	const imgMessage = await client.channels.cache
		.get(settings.channels.images)
		.send({ files: fileArray });

	return imgMessage.attachments.map((attachment) => attachment.url);
};
