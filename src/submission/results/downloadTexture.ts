import { mkdir, writeFile } from "fs/promises";
import { join, sep } from "path";

import type { Pack, Texture } from "@interfaces/database";
import { DownloadableMessage } from "@submission/results/handleResults";

import axios from "axios";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

/**
 * Download a single texture to all its paths locally
 * @author Evorp
 * @param texture message and texture info
 * @param pack which pack to download it to
 * @param baseFolder where to download the texture to
 * @returns found texture info
 */
export default async function downloadTexture(
	texture: DownloadableMessage,
	pack: Pack,
	baseFolder: string,
): Promise<Texture | undefined> {
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
