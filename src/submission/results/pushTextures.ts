import { existsSync, rmSync } from "fs";
import { join } from "path";

import type { MinecraftEdition, PackFile } from "@interfaces/database";

import formattedDate from "@helpers/formattedDate";
import GitHubRepository from "@functions/GitHubRepository";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";
const DEV = process.env.DEV.toLowerCase() === "true";

/**
 * Push textures to all versions of a given pack
 * @author Juknum, Evorp
 * @param basePath path to look for new textures
 * @param pack pack to push
 * @param commitMessage commit message
 * @return successful commit hashes
 */
export default async function pushTextures(
	basePath: string,
	pack: string,
	commitMessage = `Autopush passed textures from ${formattedDate()}`,
): Promise<string[]> {
	// declare settings inside so it gets refreshed if a version gets added (most other properties are static)
	const settings: { versions: Record<string, string[]> } = require("@resources/settings.json");

	const packs: PackFile = require("@resources/packs.json");

	const commits: string[] = [];
	for (const edition of Object.keys(settings.versions)) {
		const packGitHub = packs[pack].github[edition as MinecraftEdition];
		if (!packGitHub) {
			if (DEBUG) console.log(`${pack} doesn't support ${edition} yet!`);
			continue;
		}

		const conn = new GitHubRepository(packGitHub.org, packGitHub.repo);

		// sync since github can get cranky if you push too many commits too quickly
		for (const branch of settings.versions[edition]) {
			const commit = await pushTexture(basePath, conn, branch, commitMessage);
			if (commit !== null) commits.push(commit);
		}
	}

	// prevent 5 morbillion empty hash folders (disabled in dev for download testing)
	if (basePath.includes("instapass") && !DEV) rmSync(basePath, { recursive: true });
	return commits;
}

/**
 * Push all textures to a single version of a given pack
 * @author Evorp
 * @param basePath path to look for new textures
 * @param conn pack to push
 * @param branch commit message
 * @param commitMessage successful commit hash
 * @returns commit hash if successful, or null if not
 */
async function pushTexture(
	basePath: string,
	conn: GitHubRepository,
	branch: string,
	commitMessage: string,
): Promise<string | null> {
	const path = join(basePath, conn.repo, branch);
	// don't create empty commits
	if (!existsSync(path)) return;
	try {
		const commit = await conn.push(branch, commitMessage, path);
		// only remove path if pushing succeeded, so the bot tries the next day too
		rmSync(path, { recursive: true });
		if (DEBUG) console.log(`Pushed: ${conn.org}/${conn.repo}:${branch}`);
		return commit;
	} catch {
		// can also be an auth error or really anything but this is most likely
		if (DEBUG) console.log(`Branch ${branch} doesn't exist for pack ${conn.repo}!`);
		return null;
	}
}
