import { existsSync, rmSync } from "fs";

import formattedDate from "@helpers/formattedDate";

import pushToGitHub from "@functions/pushToGitHub";
import type { MinecraftEdition, PackFile } from "@interfaces/database";
import { join } from "path";
const DEBUG = process.env.DEBUG.toLowerCase() === "true";
const DEV = process.env.DEV.toLowerCase() === "true";
/**
 * Push textures to all versions of a given pack
 * @author Juknum, Evorp
 * @param basePath no trailing slash
 * @param pack pack to push
 * @param commitMessage commit message
 */
export default async function pushTextures(
	basePath: string,
	pack: string,
	commitMessage = `Autopush passed textures from ${formattedDate()}`,
) {
	// declare settings inside so it gets refreshed if a version gets added (most other properties are static)
	const settings = require("@resources/settings.json");

	const packs: PackFile = require("@resources/packs.json");
	for (const edition of Object.keys(settings.versions)) {
		const packGitHub = packs[pack].github[edition as MinecraftEdition];
		if (!packGitHub) {
			if (DEBUG) console.log(`${pack} doesn't support ${edition} yet!`);
			continue;
		}
		for (const branch of settings.versions[edition] as string) {
			const path = join(basePath, packGitHub.repo, branch);

			// don't create empty commits
			if (!existsSync(path)) continue;
			try {
				await pushToGitHub(packGitHub.org, packGitHub.repo, branch, commitMessage, path);
				// only remove path if pushing succeeded, so the bot tries the next day too
				rmSync(path, { recursive: true });
				if (DEBUG) console.log(`Pushed: ${packGitHub.org}/${packGitHub.repo}:${branch}`);
			} catch {
				// can also be an auth error or really anything but this is most likely
				if (DEBUG) console.log(`Branch ${branch} doesn't exist for pack ${packGitHub.repo}!`);
			}
		}
	}

	// prevent 5 morbillion empty hash folders (disabled in dev for download testing)
	if (basePath.includes("instapass") && !DEV) rmSync(basePath, { recursive: true });
}
