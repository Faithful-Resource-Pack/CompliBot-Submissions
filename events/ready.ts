const DEV = process.env.DEV.toLowerCase() == "true";
const MAINTENANCE = process.env.MAINTENANCE.toLowerCase() == "true";

import { loadCommands } from "@functions/commandHandler";
import { fetchSettings } from "@functions/fetchSettings";

import { sendToCouncil, sendToResults } from "@submission/sendToChannel";
import { downloadResults } from "@submission/handleResults";
import pushTextures from "@submission/pushTextures";
import saveDB from "@functions/saveDB";

import { ActivityType, Client } from "discord.js";
import { CronJob } from "cron";
import type { PackFile } from "@interfaces/database";
import type { Event } from "@interfaces/discord";

export default {
	name: "ready",
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

		new CronJob("0 0 * * *", async () => {
			for (const pack of Object.values(packs)) {
				await sendToResults(client, pack.submission);
				if (pack.submission.council_enabled) await sendToCouncil(client, pack.submission);
			}
		}).start();

		/**
		 * Download passed textures
		 * Runs each day at 12:15 AM
		 */
		new CronJob("15 0 * * *", async () => {
			for (const pack of Object.values(packs))
				await downloadResults(client, pack.submission.channels.results);
		}).start();

		/**
		 * Push downloaded textures to GitHub, and back up database files
		 * Runs each day at 12:30 AM
		 */
		new CronJob("30 0 * * *", async () => {
			for (const pack of Object.keys(packs)) await pushTextures("./downloadedTextures", pack);

			await saveDB(client);
		}).start();

		/**
		 * LOOP EVENTS
		 */
		setInterval(() => {
			fetchSettings();
			// optionally post to a status page
			if (process.env.STATUS_URL) fetch(process.env.STATUS_URL + client.ws.ping);
		}, 900000); // 15 minutes
	},
} as Event;
