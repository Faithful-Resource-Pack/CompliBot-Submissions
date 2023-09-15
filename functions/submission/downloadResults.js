const settings = require("@resources/settings.json");
const DEBUG = process.env.DEBUG.toLowerCase() == "true";

const getMessages = require("@helpers/getMessages");
const pushTextures = require("@submission/pushTextures");
const formattedDate = require("@helpers/formattedDate");
const devLogger = require("@helpers/devLogger");
const getPackByChannel = require("@submission/utility/getPackByChannel");

const { promises, writeFile } = require("fs");
const { default: axios } = require("axios");
const { Client } = require("discord.js");

/**
 * @typedef MappedTexture
 * @property {String} url texture image url
 * @property {String[]} authors array of author's discord ids
 * @property {Number} date
 * @property {String} id texture id
 */

/**
 * Push textures from a channel to all its paths locally and add contributions/roles
 * @author Juknum, Evorp
 * @param {import("discord.js").Client} client
 * @param {String} channelResultID result channel to download from
 * @param {Boolean?} instapass whether to push the texture directly after downloading
 */
module.exports = async function downloadResults(client, channelResultID, instapass = false) {
	const packName = getPackByChannel(channelResultID, "results");

	// get messages from the same day
	const delayedDate = new Date();
	let messages = (await getMessages(client, channelResultID)).filter((message) => {
		const messageDate = new Date(message.createdTimestamp);
		return (
			// correct date
			messageDate.getDate() == delayedDate.getDate() &&
			messageDate.getMonth() == delayedDate.getMonth() &&
			messageDate.getFullYear() == delayedDate.getFullYear() &&
			// is a submission
			message.embeds?.[0]?.fields?.[1]?.value
		);
	});

	if (DEBUG) console.log(`Starting texture downloads for pack: ${packName}`);

	if (instapass)
		// get most recent message being instapassed
		messages = [
			messages.find((msg) => msg.embeds[0].fields[1].value.includes(settings.emojis.instapass)),
		];
	// just filter out rejected textures
	else
		messages = messages.filter((message) =>
			message.embeds[0].fields[1].value.includes(settings.emojis.upvote),
		);

	/** @type {MappedTexture[]} */
	const mappedTextures = messages.map((message) => {
		return {
			url: message.embeds[0].thumbnail.url,
			authors: message.embeds[0].fields[0].value
				.split("\n")
				.map((auth) => auth.replace("<@!", "").replace(">", "")),
			date: message.createdTimestamp,
			id: message.embeds[0].title.match(/(?<=\[\#)(.*?)(?=\])/)?.[0],
		};
	});

	/** @type {import("@helpers/jsdoc").Contribution[]} */
	const allContribution = [];
	/** @type {String} used in the instapass commit message if applicable */
	let instapassName;

	for (const texture of mappedTextures) {
		const textureName = await downloadTexture(texture, packName);
		if (instapass) instapassName = textureName;
		// saves on post requests to add all contributions at once in an array, more reliable
		allContribution.push({
			date: texture.date,
			resolution: Number(packName.match(/\d+/)?.[0] ?? 32), // stupid workaround but it works
			pack: packName,
			texture: texture.id,
			authors: texture.authors,
		});

		const guild = client.channels.cache.get(channelResultID).guildId;
		await addContributorRole(client, packName, guild, texture.authors);
	}

	try {
		await axios.post(`${process.env.API_URL}contributions`, allContribution, {
			headers: {
				bot: process.env.API_TOKEN,
			},
		});
		if (DEBUG) console.log(`Added contributions: ${allContribution}`);
	} catch (err) {
		if (DEBUG) console.error(`Couldn't add contributions for pack: ${packName}`);
		else
			devLogger(client, JSON.stringify(err?.response?.data ?? err), {
				title: "Contribution Error",
				codeBlocks: "json",
			});
	}

	if (instapass) await pushTextures(`Instapassed ${instapassName} from ${formattedDate()}`);
};

/**
 * Download a single texture to all its paths locally
 * @author Juknum, Evorp
 * @param {MappedTexture} texture message and texture info
 * @param {import("@helpers/jsdoc").Pack} packName which pack to download it to
 * @returns {Promise<String>} texture name
 */
async function downloadTexture(texture, packName) {
	if (!texture.id || isNaN(Number(texture.id))) {
		if (DEBUG) console.error(`Non-numerical texture ID found: ${texture.id}`);
		return;
	}

	const imageFile = (await axios.get(texture.url, { responseType: "arraybuffer" })).data;

	/** @type {import("@helpers/jsdoc").Texture} */
	const textureInfo = (await axios.get(`${process.env.API_URL}textures/${texture.id}/all`)).data;

	// add the image to all its versions and paths
	for (const use of textureInfo.uses) {
		const paths = textureInfo.paths.filter((path) => path.use == use.id);
		const edition = use.edition.toLowerCase();
		const folder = settings.repositories.repo_name[edition][packName]?.repo;
		if (!folder && DEBUG)
			console.log(`GitHub repository not found for pack and edition: ${packName} ${edition}`);
		const basePath = `./downloadedTextures/${folder}`;

		for (const path of paths) {
			// for each version of each path
			for (const version of path.versions) {
				const fullPath = `${basePath}/${version}/${path.name}`;

				// make full folder chain
				await promises
					// removes the texture name from the full path
					.mkdir(fullPath.substring(0, fullPath.lastIndexOf("/")), { recursive: true })
					.catch(console.error);

				// write texture to previously generated path
				writeFile(fullPath, Buffer.from(imageFile), (err) => {
					if (DEBUG) return console.log(err ?? `Added texture to path: ${fullPath}`);
				});
			}
		}
	}

	return textureInfo.name;
}

/**
 * @author Evorp
 * @param {Client} client
 * @param {import("@helpers/jsdoc").Pack} packName which pack to check role
 * @param {String} guildID guild id to add roles to
 * @param {String[]} authors which authors to add roles to
 */
async function addContributorRole(client, packName, guildID, authors) {
	const guild = client.guilds.cache.get(guildID);
	const role = settings.submission.packs[packName].contributor_role;

	// if the pack doesn't have a designated role
	if (!role) return;
	for (const author of authors) {
		try {
			// fetch user with role info since you need it for adding roles
			const user = guild.members.cache.get(author);
			if (!user.roles.cache.has(role)) await user.roles.add(role);
		} catch {
			// contributor can't be found or role can't be added
		}
	}
}
