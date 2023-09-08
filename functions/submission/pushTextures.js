const { rmdirSync, existsSync } = require("fs");

const settings = require("@resources/settings.json");
const formattedDate = require("@helpers/formattedDate");

const pushToGitHub = require("@functions/pushToGitHub");
const { default: axios } = require("axios");
const DEBUG = process.env.DEBUG.toLowerCase() == "true";

/**
 * Push textures from ./downloadedTextures/ to their corresponding repo on GitHub
 * @author Juknum, Evorp
 * @param {String} commitMessage default is the generic autopush message
 */
module.exports = async function pushTextures(
	commitMessage = `Autopush passed textures from ${formattedDate()}`,
) {
	// Object.keys(settings.versions) picks up other stuff so we fetch for dynamic editions here
	const editions = (await axios.get(`${process.env.API_URL}textures/editions`)).data;
	for (const edition of editions) {
		for (const packGithub of Object.values(settings.repositories.repo_name[edition])) {
			for (const branch of settings.versions[edition]) {
				const path = `./downloadedTextures/${packGithub.repo}/${branch}/`;

				// don't create empty commits
				if (!existsSync(path)) continue;
				try {
					await pushToGitHub(packGithub.org, packGithub.repo, branch, commitMessage, path);
					// only remove path if pushing succeeded, so the bot tries the next day too
					rmdirSync(path, { recursive: true });
					if (DEBUG) console.log(`Pushed: [${packGithub.repo}:${branch}] (${packGithub.org})`);
				} catch {
					// can also be an auth error or really anything but this is most likely
					if (DEBUG) console.log(`Branch ${branch} doesn't exist for pack ${packGithub.repo}!`);
				}
			}
		}
	}
};
