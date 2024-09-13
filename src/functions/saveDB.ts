const DEV = process.env.DEV.toLowerCase() === "true";
const DEBUG = process.env.DEBUG.toLowerCase() === "true";

import pushToGitHub from "@functions/pushToGitHub";
import { join } from "path";
import axios from "axios";
import handleError from "./handleError";
import { writeFile, mkdir } from "fs/promises";
import { Client } from "discord.js";

export type BackupParams = Partial<{
	org: string;
	repo: string;
	branch: string;
	folder: string;
}>;

interface BackupResults {
	successfulPushes: string[];
	failedPushes: string[];
	commit: string | void;
}

/**
 * Push all raw API collections to GitHub
 * @author Evorp, Juknum
 * @param client
 * @param commitMessage
 * @param params configure where to backup to
 * @returns which collections backed up and the git commit SHA
 */
export default async function saveDB(
	client: Client,
	commitMessage = "Daily Backup",
	{ org, repo, branch, folder }: BackupParams = {},
): Promise<BackupResults> {
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
}
