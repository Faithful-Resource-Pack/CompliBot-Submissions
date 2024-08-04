import settings from "@resources/settings.json";
const DEBUG = process.env.DEBUG.toLowerCase() == "true";

import getMessages from "@helpers/getMessages";
import getPackByChannel from "@submission/utility/getPackByChannel";
import handleError from "@functions/handleError";

import { mkdirSync, writeFile } from "fs";
import axios from "axios";
import type { Contribution, Pack, PackFile, Texture } from "@interfaces/database";
import { TextChannel, Client, Message } from "discord.js";

export interface DownloadableMessage {
	url: string;
	authors: string[];
	date: number;
	id: string;
}

/**
 * Download passed submissions and add contributions/roles
 * @author Juknum, Evorp
 * @param client
 * @param channelResultID result channel to download from
 * @param addContributions whether to add contributions or not
 */
export async function downloadResults(
	client: Client,
	channelResultID: string,
	addContributions = true,
) {
	const packs: PackFile = require("@resources/packs.json");
	const pack = packs[getPackByChannel(channelResultID, "results")];

	// get messages from the same day
	const delayedDate = new Date();
	const messages = await getMessages(client, channelResultID, (message) => {
		const messageDate = new Date(message.createdTimestamp);
		return (
			// correct date
			messageDate.getDate() === delayedDate.getDate() &&
			messageDate.getMonth() === delayedDate.getMonth() &&
			messageDate.getFullYear() === delayedDate.getFullYear() &&
			// is an accepted submission
			message.embeds?.[0]?.fields?.[1]?.value?.includes(settings.emojis.upvote)
		);
	});

	const allContribution: Contribution[] = [];

	for (const texture of messages.map(mapMessage)) {
		try {
			await downloadTexture(texture, pack, "./downloadedTextures");
		} catch (err) {
			handleError(client, err, `Failed to download texture [#${texture.id}] for pack ${pack}`);
			// don't add contribution data or anything else if the texture wasn't downloaded
			continue;
		}

		if (addContributions) allContribution.push(generateContributionData(texture, pack));

		addContributorRole(
			client,
			pack,
			(client.channels.cache.get(channelResultID) as TextChannel).guildId,
			texture.authors,
		);
	}

	// keep only the last contribution for a texture (prevents issues if multiple textures pass)
	const uniqueContributions = Object.values(
		allContribution.reduce<Record<string, Contribution>>((acc, cur) => {
			acc[cur.texture] = cur;
			return acc;
		}, {}),
	);

	// post all contributions at once (saves on requests) only if there's something to post
	if (uniqueContributions.length) return postContributions(...uniqueContributions);
}

/**
 * Download a single texture to all its paths locally
 * @author Juknum, Evorp
 * @param texture message and texture info
 * @param pack which pack to download it to
 * @param baseFolder where to download the texture to
 * @returns found texture info
 */
export async function downloadTexture(
	texture: DownloadableMessage,
	pack: Pack,
	baseFolder: string,
): Promise<Texture> {
	if (!texture.id || isNaN(Number(texture.id))) {
		if (DEBUG) console.error(`Non-numerical texture ID found: ${texture.id}`);
		return;
	}

	const imageFile = (await axios.get(texture.url, { responseType: "arraybuffer" })).data;

	let textureInfo: Texture;
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
 * @param client
 * @param pack different packs have different roles
 * @param guildID where to add the role to
 * @param authors which authors to add roles to
 */
export async function addContributorRole(
	client: Client,
	pack: Pack,
	guildID: string,
	authors: string[],
) {
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
 * @param message message to map
 * @returns downloadable message
 */
export const mapMessage = (message: Message): DownloadableMessage => ({
	url: message.embeds[0].thumbnail.url,
	// only get the numbers (discord id)
	authors: message.embeds[0].fields[0].value.split("\n").map((author) => author.match(/\d+/g)?.[0]),
	date: message.createdTimestamp,
	id: message.embeds[0].title.match(/(?<=\[#)(.*?)(?=\])/)?.[0],
});

/**
 * Converts a mapped message to a contribution
 * @author Juknum
 * @param texture texture message
 * @param pack contribution pack
 * @returns postable contribution
 */
export const generateContributionData = (
	texture: DownloadableMessage,
	pack: Pack,
): Contribution => ({
	date: texture.date,
	pack: pack.id,
	texture: texture.id,
	authors: texture.authors,
});

/**
 * Post contribution(s) to database
 * @author Evorp
 * @param contributions contributions to post
 */
export async function postContributions(...contributions: Contribution[]) {
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
