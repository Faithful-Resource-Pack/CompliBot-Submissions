import type { Event } from "@interfaces/discord";
import type { PackFile } from "@interfaces/database";

import { loadCommands } from "@functions/commandHandler";
import { fetchSettings } from "@functions/fetchSettings";

import { sendToResults } from "@submission/discord/sendToChannel";
import { handleResults } from "@submission/results/handleResults";
import pushTextures from "@submission/results/pushTextures";

import saveDB from "@functions/saveDB";
import handleError from "@functions/handleError";

import { CronJob } from "cron";
import { ActivityType, Client } from "discord.js";

const DEV = process.env.DEV.toLowerCase() === "true";
const MAINTENANCE = process.env.MAINTENANCE.toLowerCase() === "true";

export default {
	name: "clientReady",
	once: true,
	async execute(client: Client) {
		console.log(`┌───────────────────────────────────────────────────┐`);
		console.log(`│                                                   │`);
		console.log(`│     ─=≡Σ((( つ◕ل͜◕)つ                              │`);
		console.log(`│   TypeScript is a pain, but I'm fine, I hope...   │`);
		console.log(`│                                                   │`);
		console.log(`└───────────────────────────────────────────────────┘\n`);

		await loadCommands(client);

		if (MAINTENANCE)
			client.user.setPresence({ activities: [{ name: "maintenance" }], status: "dnd" });
		else client.user.setActivity({ name: "for submissions", type: ActivityType.Watching });

		if (DEV) return setInterval(fetchSettings, 20000); // 20 seconds

		/**
		 * TEXTURE SUBMISSION SCHEDULED FUNCTIONS
		 * @see @functions/submission for more information
		 */

		const packs: PackFile = require("@resources/packs.json");

		/**
		 * Send submission messages to their respective channels
		 * Runs each day at midnight
		 */
		CronJob.from({
			cronTime: "0 0 * * *",
			async onTick() {
				await Promise.all(
					Object.values(packs).map((pack) =>
						sendToResults(client, pack.submission).catch((err: unknown) => {
							handleError(client, err, `Failed to send results for ${pack.name}`);
						}),
					),
				);
			},
			start: true,
		});

		/**
		 * Download passed textures
		 * Runs each day at 12:15 AM
		 */
		CronJob.from({
			cronTime: "15 0 * * *",
			async onTick() {
				await Promise.all(
					Object.values(packs).map((pack) =>
						handleResults(client, pack.submission.channels.results).catch((err: unknown) => {
							handleError(client, err, `Failed to download results for pack ${pack.name}`);
						}),
					),
				);
			},
			start: true,
		});

		/**
		 * Push downloaded textures to GitHub, and back up database files
		 * Runs each day at 12:30 AM
		 */
		CronJob.from({
			cronTime: "30 0 * * *",
			async onTick() {
				// sync since github can get cranky if you push too many commits too quickly
				for (const pack of Object.keys(packs)) await pushTextures("./downloadedTextures", pack);
				await saveDB(client);
			},
			start: true,
		});

		/**
		 * LOOP EVENTS
		 */
		setInterval(() => {
			fetchSettings();
			// optionally post to a status page
			if (process.env.STATUS_URL) fetch(process.env.STATUS_URL + client.ws.ping).catch(() => {});
		}, 900000); // 15 minutes
	},
} as Event;
