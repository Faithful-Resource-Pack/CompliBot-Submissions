const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { downloadResults } = require("@submission/downloadResults");
const warnUser = require("@helpers/warnUser");
const changeStatus = require("@submission/utility/changeStatus");
const DEBUG = process.env.DEBUG.toLowerCase() == "true";
const { imageButtons } = require("@helpers/interactions");

/**
 * Instapass a given texture embed
 * @author Evorp
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").Message} message embed to instapass
 * @param {import("discord.js").User | import("discord.js").GuildMember} member who instapassed it
 */
module.exports = async function instapass(client, message, member) {
	let channelOutID;

	for (const pack of Object.values(settings.submission.packs)) {
		// picks up instapassing in both community and council phases
		const channelArray = Object.values(pack.channels);
		if (channelArray.includes(message.channel.id)) {
			channelOutID = pack.channels.results;
			break;
		}
	}

	await changeStatus(
		message,
		`<:instapass:${settings.emojis.instapass}> Instapassed by <@${member.id}>`,
		settings.colors.yellow,
		[imageButtons],
	);

	// this is why we send the channel rather than the pack into downloadResults()
	/** @type {import("discord.js").TextChannel} */
	const channelOut = await client.channels.fetch(channelOutID);
	if (!channelOut) return warnUser(message, strings.submission.no_result_channel);
	await channelOut.send({
		embeds: [
			message.embeds[0].setDescription(
				`[Original Post](${message.url})\n${message.embeds[0].description ?? ""}`,
			),
		],
		components: [imageButtons],
	});

	await downloadResults(client, channelOutID, true);
	if (DEBUG) console.log(`Texture instapassed: ${message.embeds[0].title}`);
};
