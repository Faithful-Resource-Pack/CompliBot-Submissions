const DEV = process.env.DEV.toLowerCase() == "true";
const DEBUG = process.env.DEBUG.toLowerCase() == "true";

const pushToGitHub = require("@functions/pushToGitHub");
const { join } = require("path");
const axios = require("axios").default;
const handleError = require("./handleError");
const { writeFile, mkdir } = require("fs/promises");

/**
 * Push all raw api collections to github
 * @author Evorp, Juknum
 * @param {import("discord.js").Client} client
 * @param {string} commitMessage
 * @param {{ org?: string, repo?: string, branch?: string, folder?: string }} params configure where to backup to
 * @returns {Promise<{ successfulPushes: string[], failedPushes: string[], commit?: string }>}
 */
module.exports = async function saveDB(
	client,
	commitMessage = "Daily Backup",
	{ org, repo, branch, folder } = {},
) {
	const { backup } = require("@resources/settings.json");
	org ||= backup.git.org;
	repo ||= backup.git.repo;
	branch ||= backup.git.branch;
	folder ||= backup.git.folder;

	const folderPath = join(process.cwd(), "backups", folder);
	await mkdir(folderPath, { recursive: true });

	const successfulPushes = [];
	const failedPushes = [];

	await Promise.all(
		Object.entries(backup.urls).map(([filename, url]) =>
			axios
				.get(process.env.API_URL + url, {
					headers: {
						// for privileged collections like addons, ignored if not needed
						bot: process.env.API_TOKEN,
					},
				})
				.then((fetched) => {
					writeFile(join(folderPath, `${filename}.json`), JSON.stringify(fetched.data), {
						flag: "w+",
						encoding: "utf-8",
					});
				})
				.then(() => successfulPushes.push(filename))
				.catch((err) => {
					failedPushes.push(filename);
					handleError(client, err, `Failed to back up collection "${filename}"`);
				}),
		),
	);

	if (DEBUG) console.log(`Downloaded database files: ${successfulPushes}`);
	const commit = await pushToGitHub(org, repo, branch, commitMessage, "./backups/").catch((err) => {
		failedPushes.push(...successfulPushes);
		// equivalent to resetting array
		successfulPushes.length = 0;
		handleError(client, err, `Could not commit backup to ${org}/${repo}:${branch}`);
	});

	return { successfulPushes, failedPushes, commit };
};
