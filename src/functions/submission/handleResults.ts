import settings from "@resources/settings.json";
const DEBUG = process.env.DEBUG.toLowerCase() === "true";

import getMessages from "@helpers/getMessages";
import getPackByChannel from "@submission/utility/getPackByChannel";
import handleError from "@functions/handleError";

import axios from "axios";
import type { Contribution, Pack, PackFile, Texture } from "@interfaces/database";
import { TextChannel, Client, Message } from "discord.js";
import { join, sep } from "path";
import { mkdir, writeFile } from "fs/promises";
import {
	addContributorRole,
	generateContributionData,
	postContributions,
} from "@submission/handleContributions";

export interface DownloadableMessage {
	url: string;
	authors: string[];
	date: number;
	id: string; // texture id
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

	// filter out duplicates first based on date-sorted array so we can do everything concurrently
	const uniqueTextures = Object.values(
		messages.map(mapDownloadableMessage).reduce<Record<string, DownloadableMessage>>((acc, cur) => {
			acc[cur.id] = cur;
			return acc;
		}, {}),
	);

	const allContributions: (Contribution | undefined)[] = await Promise.all(
		uniqueTextures.map((texture) =>
			downloadTexture(texture, pack, "./downloadedTextures")
				// only create contribution data if the texture download succeeded
				.then(() => generateContributionData(texture, pack))
				.catch(
					(err: unknown) =>
						void handleError(
							client,
							err,
							`Failed to download texture [#${texture.id}] for pack ${pack.name}`,
						),
				),
		),
	);

	if (!addContributions) return;

	const addedContributions = allContributions.filter(
		// typescript trick for a type-safe filter cast
		(c): c is Contribution => c !== undefined,
	);

	// post all contributions at once (saves on requests) only if there's something to post
	if (addedContributions.length) {
		const guildID = (client.channels.cache.get(channelResultID) as TextChannel).guildId;
		return Promise.all([
			postContributions(...addedContributions),
			...addedContributions.map((c) => addContributorRole(client, pack, guildID, c.authors)),
		]);
	}
}

/**
 * Download a single texture to all its paths locally
 * @author Evorp
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

	const imageFile = (await axios.get<Buffer>(texture.url, { responseType: "arraybuffer" })).data;

	let textureInfo: Texture;
	try {
		textureInfo = (await axios.get<Texture>(`${process.env.API_URL}textures/${texture.id}/all`))
			.data;
	} catch {
		// handles if texture gets deleted in the db between submission and results (merged, obsolete, etc)
		if (DEBUG) console.error(`Could not find texture for ID: ${texture.id}`);
		return;
	}

	// instead of making a bunch of nested loops generate one flat array of paths and use that
	const allPaths = generatePaths(textureInfo, pack, baseFolder);

	await Promise.all(allPaths.map((fullPath) => downloadToPath(fullPath, imageFile)));
	return textureInfo;
}

/**
 * Generate all paths a texture needs to be downloaded to
 * @author Evorp
 * @param textureInfo The texture being downloaded
 * @param pack The pack it's being downloaded to
 * @param baseFolder The base folder to download to
 * @returns Flat array of all needed paths
 */
function generatePaths(textureInfo: Texture, pack: Pack, baseFolder: string) {
	// flatMap is a one to many operation
	return textureInfo.uses.flatMap((use) => {
		const paths = textureInfo.paths.filter((path) => path.use === use.id);
		const packFolder = pack.github[use.edition]?.repo;
		if (!packFolder) {
			// don't error since some packs don't support all editions
			if (DEBUG)
				console.log(
					`GitHub repository not found for pack and edition: ${pack.name} ${use.edition}`,
				);
			return [];
		}
		// every version of every path of every use gets an entry
		return paths.flatMap((path) =>
			path.versions.map((version) => join(baseFolder, packFolder, version, path.name)),
		);
	});
}

/**
 * Safely download an image to a given path
 * @author Juknum, Evorp
 * @param fullPath Full path to download to
 * @param imageFile Image to download
 */
async function downloadToPath(fullPath: string, imageFile: Buffer) {
	try {
		await mkdir(fullPath.slice(0, fullPath.lastIndexOf(sep)), { recursive: true });
		await writeFile(fullPath, imageFile);
		if (DEBUG) console.log(`Added texture to path ${fullPath}`);
	} catch (err: unknown) {
		console.error(err);
	}
}

/**
 * Map a texture to a downloadable format
 * @author Juknum
 * @param message message to map
 * @returns downloadable message
 */
export const mapDownloadableMessage = (message: Message): DownloadableMessage => ({
	url: message.embeds[0].thumbnail.url,
	// only get the numbers (discord id)
	authors: message.embeds[0].fields[0].value.split("\n").map((author) => author.match(/\d+/g)?.[0]),
	date: message.createdTimestamp,
	id: message.embeds[0].title.match(/(?<=\[#)(.*?)(?=\])/)?.[0],
});
