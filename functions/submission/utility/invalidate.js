const settings = require("@resources/settings.json");

const DEBUG = process.env.DEBUG.toLowerCase() == "true";

const { changeStatus, changeOriginalStatus } = require("@submission/utility/changeStatus");

/**
 * Invalidate a given texture embed
 * @author Evorp
 * @param {import("discord.js").Message} message embed to instapass
 * @param {import("discord.js").User | import("discord.js").GuildMember} member who instapassed it
 */
module.exports = async function invalidate(message, member) {
	if (DEBUG) console.log(`Texture invalidated: ${message.embeds[0].title}`);
	const status = `<:invalid:${settings.emojis.invalid}> Invalidated by <@${member.id}>`;

	await changeStatus(message, status, settings.colors.red);
	await changeOriginalStatus(message, status, settings.colors.red);
};
