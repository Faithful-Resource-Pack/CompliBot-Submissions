const client = require("@index").Client;
const { CronJob } = require("cron");

const DEV = process.env.DEV.toLowerCase() == "true";
const MAINTENANCE = process.env.MAINTENANCE.toLowerCase() == "true";
const fetchSettings = require("@functions/fetchSettings");

const settings = require("@resources/settings.json");

const { sendToCouncil, sendToResults } = require("@submission/sendToChannel");
const downloadResults = require("@submission/downloadResults");
const pushTextures = require("@submission/pushTextures");
const saveDB = require("@functions/saveDB");

/**
 * Send submission messages to their respective channels
 * Runs each day at midnight CE(S)T
 * @author Evorp
 */
const submissionProcess = new CronJob("0 0 * * *", async () => {
	for (const pack of Object.values(settings.submission.packs)) {
		await sendToResults(client, pack);
		if (pack.council_enabled) await sendToCouncil(client, pack);
	}
});

/**
 * Download passed textures
 * Runs each day at 12:15 AM CE(S)T
 * @author Evorp
 */
const downloadToBot = new CronJob("15 0 * * *", async () => {
	for (const pack of Object.values(settings.submission.packs)) {
		await downloadResults(client, pack.channels.results);
	}
});

/**
 * Push downloaded textures to GitHub, and back up database files
 * Runs each day at 12:30 AM CE(S)T
 * @author Evorp, Juknum
 */
const pushToGithub = new CronJob("30 0 * * *", async () => {
	await pushTextures();
	await saveDB(client);
});

/** @type {import("@helpers/jsdoc").Event} */
module.exports = {
	name: "ready",
	once: true,
	async execute() {
		console.log(`┌─────────────────────────────────────────────────────────────┐`);
		console.log(`│                                                             │`);
		console.log(`│  ─=≡Σ((( つ◕ل͜◕)つ                                           │`);
		console.log(`│ JavaScript is a pain, but I'm fine, I hope...               │`);
		console.log(`│                                                             │`);
		console.log(`└─────────────────────────────────────────────────────────────┘\n\n`);

		if (MAINTENANCE)
			client.user.setPresence({ activities: [{ name: "maintenance" }], status: "dnd" });
		else client.user.setActivity("for submissions", { type: "WATCHING" });

		if (DEV) {
			setInterval(() => {
				// format the settings for easier viewing
				fetchSettings(true);
			}, 20000); // 20 seconds
		}

		if (DEV) return;

		/**
		 * START TEXTURE SUBMISSION PROCESS
		 */
		submissionProcess.start();
		downloadToBot.start();
		pushToGithub.start();
	},
};
