const settings = require("@resources/settings.json");

const DEBUG = process.env.DEBUG.toLowerCase() == "true";
const { randomBytes } = require("crypto");

const {
	mapMessage,
	postContributions,
	addContributorRole,
	downloadTexture,
	mapContribution,
} = require("@submission/parseResults");
const pushTextures = require("@submission/pushTextures");
const getPackByChannel = require("@submission/utility/getPackByChannel");
const { changeStatus, changeOriginalStatus } = require("@submission/utility/changeStatus");

const { imageButtons } = require("@helpers/interactions");
const formattedDate = require("@helpers/formattedDate");

const { EmbedBuilder } = require("discord.js");

/**
 * Instapass a given texture embed
 * @author Evorp
 * @param {import("discord.js").Message} message embed to instapass
 * @param {import("discord.js").User | import("discord.js").GuildMember} member who instapassed it
 */
module.exports = async function instapass(message, member) {
	const packName = getPackByChannel(message.channel.id);
	const channelOutID = settings.submission.packs[packName].channels.results;
	const status = `<:instapass:${settings.emojis.instapass}> Instapassed by <@${member.id}>`;

	await changeStatus(message, status, settings.colors.yellow, [imageButtons]);
	await changeOriginalStatus(message, status, settings.colors.yellow, [imageButtons]);

	/** @type {import("discord.js").TextChannel} */
	const channelOut = await message.client.channels.fetch(channelOutID);

	const embed = EmbedBuilder.from(message.embeds[0]);

	// if instapassed in council "original post" is already there
	if (!message.embeds[0].description?.startsWith("[Original Post]("))
		embed.setDescription(`[Original Post](${message.url})\n${message.embeds[0].description ?? ""}`);

	const texture = mapMessage(
		await channelOut.send({
			embeds: [embed],
			components: [imageButtons],
		}),
	);

	// probably overkill but this eliminates any chance of weird stuff happening
	const basePath = `./instapassedTextures/${randomBytes(6).toString("hex")}`;

	// download the single texture to all its paths
	const textureInfo = await downloadTexture(texture, packName, basePath);

	await postContributions(mapContribution(texture, packName));
	await addContributorRole(message.client, packName, message.channel.guildId, texture.authors);
	await pushTextures(basePath, packName, `Instapassed ${textureInfo.name} from ${formattedDate()}`);

	if (DEBUG) console.log(`Texture instapassed: ${message.embeds[0].title}`);
};
