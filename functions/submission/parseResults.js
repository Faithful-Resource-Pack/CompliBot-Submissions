const settings = require("@resources/settings.json");
const DEBUG = process.env.DEBUG.toLowerCase() == "true";

const getMessages = require("@helpers/getMessages");
const devLogger = require("@helpers/devLogger");
const getPackByChannel = require("@submission/utility/getPackByChannel");

const { mkdirSync, writeFile } = require("fs");
const axios = require("axios").default;

/**
 * @typedef MappedMessage
 * @property {string} url texture image url
 * @property {string[]} authors array of author's discord ids
 * @property {number} date
 * @property {string} id texture id
 */

/**
 * Download passed submissions and add contributions/roles
 * @author Juknum, Evorp
 * @param {import("discord.js").Client} client
 * @param {string} channelResultID result channel to download from
 */
async function downloadResults(client, channelResultID) {
	const packName = getPackByChannel(channelResultID, "results");

	// get messages from the same day
	const delayedDate = new Date();
	const messages = await getMessages(client, channelResultID, (message) => {
		const messageDate = new Date(message.createdTimestamp);
		return (
			// correct date
			messageDate.getDate() == delayedDate.getDate() &&
			messageDate.getMonth() == delayedDate.getMonth() &&
			messageDate.getFullYear() == delayedDate.getFullYear() &&
			// is an accepted submission
			message.embeds?.[0]?.fields?.[1]?.value?.includes(settings.emojis.upvote)
		);
	});

	/** @type {import("@helpers/jsdoc").Contribution[]} */
	const allContribution = [];

	for (const texture of messages.map(mapMessage)) {
		await downloadTexture(texture, packName, "./downloadedTextures");

		allContribution.push(generateContributionData(texture, packName));

		addContributorRole(
			client,
			packName,
			client.channels.cache.get(channelResultID).guildId,
			texture.authors,
		);
	}

	// post all contributions at once (saves on requests)
	if (allContribution.length) return postContributions(...allContribution);
}

/**
 * Download a single texture to all its paths locally
 * @author Juknum, Evorp
 * @param {MappedMessage} texture message and texture info
 * @param {import("@helpers/jsdoc").FaithfulPack} packName which pack to download it to
 * @param {string} baseFolder where to download the texture to
 * @returns {Promise<import("@helpers/jsdoc").Texture>} info
 */
async function downloadTexture(texture, packName, baseFolder) {
	const packs = require("@resources/packs.json");
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

		// need to redefine pack folder every time since java/bedrock are different folders
		const packFolder = packs[packName].github[use.edition]?.repo;

		if (!packFolder && DEBUG)
			console.log(`GitHub repository not found for pack and edition: ${packName} ${use.edition}`);

		for (const path of paths) {
			// write file to every version of a path
			for (const version of path.versions) {
				const fullPath = `${baseFolder}/${packFolder}/${version}/${path.name}`;

				// trim last bit to get folder tree
				mkdirSync(fullPath.substring(0, fullPath.lastIndexOf("/")), { recursive: true });

				// better to use the callback version because .then and .catch are sent to the same output
				writeFile(fullPath, Buffer.from(imageFile), (err) => {
					if (DEBUG) return console.log(err ?? `Added texture to path: ${fullPath}`);
				});
			}
		}
	}

	return textureInfo;
}

/**
 * Add a contributor role to users without one
 * @author Evorp
 * @param {import("discord.js").Client} client
 * @param {import("@helpers/jsdoc").FaithfulPack} packName different packs have different roles
 * @param {string} guildID where to add the role to
 * @param {string[]} authors which authors to add roles to
 */
async function addContributorRole(client, packName, guildID, authors) {
	const packs = require("@resources/packs.json");
	const guild = client.guilds.cache.get(guildID);
	const role = packs[packName].submission.contributor_role;

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

/**
 * Map a texture to a downloadable format
 * @author Juknum
 * @param {import("discord.js").Message} message
 * @returns {MappedMessage}
 */
const mapMessage = (message) => ({
	url: message.embeds[0].thumbnail.url,
	// only get the numbers (discord id)
	authors: message.embeds[0].fields[0].value.split("\n").map((author) => author.match(/\d+/g)?.[0]),
	date: message.createdTimestamp,
	id: message.embeds[0].title.match(/(?<=\[\#)(.*?)(?=\])/)?.[0],
});

/**
 * Converts a mapped message to a contribution
 * @author Juknum
 * @param {MappedMessage} texture
 * @param {import("@helpers/jsdoc").FaithfulPack} packName
 * @returns {import("@helpers/jsdoc").Contribution}
 */
const generateContributionData = (texture, packName) => ({
	date: texture.date,
	/** @todo switch this for resolution field in pack interface */
	resolution: Number(packName.match(/\d+/)?.[0] ?? 32), // stupid workaround but it works
	pack: packName,
	texture: texture.id,
	authors: texture.authors,
});

/**
 * Post contribution(s) to database
 * @author Evorp
 * @param {import("@helpers/jsdoc").Contribution[]} contributions
 */
async function postContributions(...contributions) {
	try {
		await axios.post(`${process.env.API_URL}contributions`, contributions, {
			headers: {
				bot: process.env.API_TOKEN,
			},
		});
		if (DEBUG) console.log(`Added contribution(s): ${contributions}`);
	} catch (err) {
		const pack = contributions[0]?.pack;
		if (DEBUG) console.error(`Couldn't add contribution(s) for pack: ${pack}`);
		else
			devLogger(client, JSON.stringify(err?.response?.data ?? err), {
				title: "Contribution Error",
				codeBlocks: "json",
			});
	}
}

module.exports = {
	downloadResults,
	downloadTexture,
	addContributorRole,
	mapMessage,
	generateContributionData,
	postContributions,
};
