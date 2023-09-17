const { rmdirSync, existsSync } = require("fs");

const settings = require("@resources/settings.json");
const formattedDate = require("@helpers/formattedDate");

const pushToGitHub = require("@functions/pushToGitHub");
const { default: axios } = require("axios");
const DEBUG = process.env.DEBUG.toLowerCase() == "true";

/**
 * Push a single texture to GitHub
 * @author Juknum, Evorp
 * @param {String} basePath no trailing slash
 * @param {import("@helpers/jsdoc").Pack} pack pack to push
 * @param {String?} commitMessage commit message
 */
module.exports = async function pushTextures(
	basePath,
	pack,
	commitMessage = `Autopush passed textures from ${formattedDate()}`,
) {
	const editions = Object.keys(settings.versions).filter((k) => k != "id");
	for (const edition of editions) {
		const packGitHub = settings.repositories.repo_name[edition][pack];
		if (!packGitHub) continue; // isn't supported for that edition yet
		for (const branch of settings.versions[edition]) {
			const path = `${basePath}/${packGitHub.repo}/${branch}/`;

			// don't create empty commits
			if (!existsSync(path)) continue;
			try {
				await pushToGitHub(packGitHub.org, packGitHub.repo, branch, commitMessage, path);
				// only remove path if pushing succeeded, so the bot tries the next day too
				rmdirSync(basePath, { recursive: true });
				if (DEBUG) console.log(`Pushed: [${packGitHub.repo}:${branch}] (${packGitHub.org})`);
			} catch {
				// can also be an auth error or really anything but this is most likely
				if (DEBUG) console.log(`Branch ${branch} doesn't exist for pack ${packGitHub.repo}!`);
			}
		}
	}
};
