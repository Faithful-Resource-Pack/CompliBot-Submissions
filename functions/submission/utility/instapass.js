const settings = require("@resources/settings.json");

const DEBUG = process.env.DEBUG.toLowerCase() == "true";

const {
	mapMessage,
	postContributions,
	addContributorRole,
	downloadTexture,
	mapContribution,
} = require("@submission/parseResults");

const formattedDate = require("@helpers/formattedDate");
const changeStatus = require("@submission/utility/changeStatus");
const { imageButtons } = require("@helpers/interactions");
const pushTextures = require("@submission/pushTextures");

const { randomBytes } = require("crypto");

const { EmbedBuilder } = require("discord.js");
const getPackByChannel = require("@submission/utility/getPackByChannel");

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

	const texture = mapMessage(
		await channelOut.send({
			embeds: [
				EmbedBuilder.from(message.embeds[0]).setDescription(
					`[Original Post](${message.url})\n${message.embeds[0].description ?? ""}`,
				),
			],
			components: [imageButtons],
		}),
	);

	// probably overkill but this eliminates any chance of weird stuff happening
	const basePath = `./instapassedTextures/${randomBytes(6).toString("hex")}`;

	// download the single texture to all its paths
	const textureInfo = await downloadTexture(texture, packName, basePath);

	await postContributions(mapContribution(texture, packName));
	await addContributorRole(client, packName, message.channel.guildId, texture.authors);
	await pushTextures(basePath, packName, `Instapassed ${textureInfo.name} from ${formattedDate()}`);

	if (DEBUG) console.log(`Texture instapassed: ${message.embeds[0].title}`);
};
