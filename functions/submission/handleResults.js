const settings = require("@resources/settings.json");
const DEBUG = process.env.DEBUG.toLowerCase() == "true";

const getMessages = require("@helpers/getMessages");
const getPackByChannel = require("@submission/utility/getPackByChannel");

const { mkdirSync, writeFile } = require("fs");
const axios = require("axios").default;

/**
 * @typedef DownloadableMessage
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
	const packs = require("@resources/packs.json");
	/** @type {import("@helpers/jsdoc").Pack} */
	const pack = packs[getPackByChannel(channelResultID, "results")];

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
		await downloadTexture(texture, pack, "./downloadedTextures");

		allContribution.push(generateContributionData(texture, pack));

		addContributorRole(
			client,
			pack,
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
 * @param {DownloadableMessage} texture message and texture info
 * @param {import("@helpers/jsdoc").Pack} pack which pack to download it to
 * @param {string} baseFolder where to download the texture to
 * @returns {Promise<import("@helpers/jsdoc").Texture>} info
 */
async function downloadTexture(texture, pack, baseFolder) {
	if (!texture.id || isNaN(Number(texture.id))) {
		if (DEBUG) console.error(`Non-numerical texture ID found: ${texture.id}`);
		return;
	}

	const imageFile = (await axios.get(texture.url, { responseType: "arraybuffer" })).data;

	/** @type {import("@helpers/jsdoc").Texture} */
	let textureInfo;
	try {
		textureInfo = (await axios.get(`${process.env.API_URL}textures/${texture.id}/all`)).data;
	} catch {
		// handles if texture gets deleted in the db between submission and results (merged, obsolete, etc)
		if (DEBUG) console.error(`Could not find texture for ID: ${texture.id}`);
		return;
	}

	// add the image to all its versions and paths
	for (const use of textureInfo.uses) {
		const paths = textureInfo.paths.filter((path) => path.use == use.id);

		// need to redefine pack folder every time since java/bedrock are different folders
		const packFolder = pack.github[use.edition]?.repo;

		if (!packFolder) {
			if (DEBUG)
				console.log(
					`GitHub repository not found for pack and edition: ${pack.name} ${use.edition}`,
				);
			continue;
		}

		for (const path of paths) {
			// write file to every version of a path
			for (const version of path.versions) {
				const fullPath = `${baseFolder}/${packFolder}/${version}/${path.name}`;

				// trim last bit to get folder tree
				mkdirSync(fullPath.slice(0, fullPath.lastIndexOf("/")), { recursive: true });

				// better to use the callback version because .then and .catch are sent to the same output
				writeFile(fullPath, imageFile, (err) => {
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
 * @param {import("@helpers/jsdoc").Pack} pack different packs have different roles
 * @param {string} guildID where to add the role to
 * @param {string[]} authors which authors to add roles to
 */
async function addContributorRole(client, pack, guildID, authors) {
	const guild = client.guilds.cache.get(guildID);
	const role = pack.submission.contributor_role;

	// if the pack doesn't have a designated role
	if (!role) return;

	// Promise.all is faster than awaiting separately + less error handling needed
	return Promise.all(
		authors
			.map((author) => guild.members.cache.get(author))
			.filter((user) => user && !user.roles.cache.has(role))
			.map((user) => user.roles.add(role).catch(() => {})),
	);
}

/**
 * Map a texture to a downloadable format
 * @author Juknum
 * @param {import("discord.js").Message} message
 * @returns {DownloadableMessage}
 */
const mapMessage = (message) => ({
	url: message.embeds[0].thumbnail.url,
	// only get the numbers (discord id)
	authors: message.embeds[0].fields[0].value.split("\n").map((author) => author.match(/\d+/g)?.[0]),
	date: message.createdTimestamp,
	id: message.embeds[0].title.match(/(?<=\[#)(.*?)(?=\])/)?.[0],
});

/**
 * Converts a mapped message to a contribution
 * @author Juknum
 * @param {DownloadableMessage} texture
 * @param {import("@helpers/jsdoc").Pack} pack
 * @returns {import("@helpers/jsdoc").Contribution}
 */
const generateContributionData = (texture, pack) => ({
	date: texture.date,
	pack: pack.id,
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
		if (DEBUG) console.log(`Added contribution(s): ${JSON.stringify(contributions, null, 4)}`);
	} catch {
		if (DEBUG) {
			console.error(`Failed to add contribution(s) for pack: ${contributions[0]?.pack}`);
			console.error(JSON.stringify(contributions, null, 4));
		}
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
