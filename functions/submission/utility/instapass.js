const settings = require("@resources/settings.json");

const DEBUG = process.env.DEBUG.toLowerCase() == "true";

const {
	mapMessage,
	mapContribution,
	addContributorRole,
	downloadTexture,
} = require("@submission/downloadResults");
const changeStatus = require("@submission/utility/changeStatus");
const { imageButtons } = require("@helpers/interactions");
const pushTextures = require("@submission/pushTextures");

const { randomBytes } = require("crypto");

const { EmbedBuilder } = require("discord.js");
const { default: axios } = require("axios");
const getPackByChannel = require("./getPackByChannel");

/**
 * Instapass a given texture embed
 * @author Evorp
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").Message} message embed to instapass
 * @param {import("discord.js").User | import("discord.js").GuildMember} member who instapassed it
 */
module.exports = async function instapass(client, message, member) {
	const packName = getPackByChannel(message.channel.id);
	const channelOutID = settings.submission.packs[packName].channels.results;

	await changeStatus(
		message,
		`<:instapass:${settings.emojis.instapass}> Instapassed by <@${member.id}>`,
		settings.colors.yellow,
		[imageButtons],
	);

	/** @type {import("discord.js").TextChannel} */
	const channelOut = await client.channels.fetch(channelOutID);

	const message = await channelOut.send({
		embeds: [
			EmbedBuilder.from(message.embeds[0]).setDescription(
				`[Original Post](${message.url})\n${message.embeds[0].description ?? ""}`,
			),
		],
		components: [imageButtons],
	});

	const texture = mapMessage(message);

	// probably overkill but this eliminates any chance of weird stuff happening
	const basePath = `./instapassedTextures/${randomBytes(6).toString("hex")}`;

	// download the single texture to all its paths
	const textureInfo = await downloadTexture(texture);

	// add contribution
	await axios.post(`${process.env.API_URL}contributions`, mapContribution(texture, packName), {
		headers: {
			bot: process.env.API_TOKEN,
		},
	});

	await addContributorRole(client, packName, message.channel.guildId);
	await pushTextures(basePath, packName, `Instapassed ${textureInfo.name} from ${formattedDate()}`);

	if (DEBUG) console.log(`Texture instapassed: ${message.embeds[0].title}`);
};
