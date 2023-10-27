const settings = require("@resources/settings.json");

const DEV = process.env.DEV.toLowerCase() == "true";
const DEBUG = process.env.DEBUG.toLowerCase() == "true";

const { mkdirSync, writeFileSync } = require("fs");

const pushToGitHub = require("@functions/pushToGitHub");
const { join } = require("path");
const axios = require("axios").default;
const devLogger = require("@helpers/devLogger");

/**
 * Push all raw api collections to github
 * @author Evorp, Juknum
 * @param {import("discord.js").Client} client
 * @param {string} commitMessage
 * @param {{org?: string, repo?: string, branch?: string}} params configure where to backup to
 * @returns {Promise<{ successfulPushes: string[], failedPushes: string[], commit?: string }>}
 */
module.exports = async function saveDB(client, commitMessage = "Daily Backup", params = {}) {
	if (!params.org) params.org = settings.backup.git.org;
	if (!params.repo) params.repo = settings.backup.git.repo;
	if (!params.branch) params.branch = settings.backup.git.branch;

	const folderPath = join(process.cwd(), "json", "database");
	mkdirSync(folderPath, { recursive: true });

	const successfulPushes = [];
	const failedPushes = [];
	for (const [filename, url] of Object.entries(settings.backup.urls)) {
		try {
			const fetched = (
				await axios.get(process.env.API_URL + url, {
					headers: {
						// for privileged collections like addons, ignored if not needed
						bot: process.env.API_TOKEN,
					},
				})
			).data;

			writeFileSync(join(folderPath, `${filename}.json`), JSON.stringify(fetched), {
				flag: "w+",
				encoding: "utf-8",
			});

			successfulPushes.push(filename);
		} catch (err) {
			failedPushes.push(filename);
			if (DEBUG) console.error(err?.response?.data ?? err);
			if (!DEV)
				devLogger(client, JSON.stringify(err?.response?.data ?? err), {
					codeBlocks: "json",
					title: `Failed to backup collection "${filename}"`,
				});
		}
	}

	if (DEBUG) console.log(`Downloaded database files: ${successfulPushes}`);
	const commit = await pushToGitHub(
		params.org,
		params.repo,
		params.branch,
		commitMessage,
		"./json/",
	).catch((err) => {
		if (DEBUG) console.log(`Branch ${params.branch} doesn't exist for repository ${params.repo}!`);
		if (!DEV)
			devLogger(client, err, {
				codeBlocks: "",
				title: `Could not commit backup to ${params.org}/[${params.repo}:${params.branch}]`,
			});
	});

	return { successfulPushes, failedPushes, commit };
};
