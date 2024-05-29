const settings = require("@resources/settings.json");

const DEBUG = process.env.DEBUG.toLowerCase() == "true";
const { randomBytes } = require("crypto");

const {
	mapMessage,
	postContributions,
	addContributorRole,
	downloadTexture,
	generateContributionData,
} = require("@submission/handleResults");
const pushTextures = require("@submission/pushTextures");
const getPackByChannel = require("@submission/utility/getPackByChannel");
const changeStatus = require("@submission/utility/changeStatus");

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
	const packs = require("@resources/packs.json");
	/** @type {import("@helpers/jsdoc").Pack} */
	const pack = packs[getPackByChannel(message.channel.id)];

	const channelOutID = pack.submission.channels.results;
	const status = `<:instapass:${settings.emojis.instapass}> Instapassed by <@${member.id}>`;

	await changeStatus(message, {
		status,
		color: settings.colors.yellow,
		components: [imageButtons],
		editOriginal: true,
	});

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

	// random folder name so multiple textures can be instapassed at once
	const basePath = `./instapassedTextures/${randomBytes(6).toString("hex")}`;

	const textureInfo = await downloadTexture(texture, pack, basePath);

	// not awaited since not timebound
	postContributions(generateContributionData(texture, pack));
	addContributorRole(message.client, pack, message.channel.guildId, texture.authors);
	await pushTextures(basePath, pack.id, `Instapassed ${textureInfo.name} from ${formattedDate()}`);

	if (DEBUG) console.log(`Texture instapassed: ${message.embeds[0].title}`);
};
