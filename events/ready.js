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
 * @see retrieveSubmission
 */
const submissionProcess = new CronJob("0 0 * * *", async () => {
	for (const [pack, info] of Object.entries(settings.submission.packs)) {
		await sendToResults(client, pack, info.time_to_results, info.council_enabled);
		if (info.council_enabled) await sendToCouncil(client, pack, info.time_to_council);
	}
});
/**
 * Download passed textures
 * Runs each day at 00:15 CE(S)T
 * @author Evorp
 * @see downloadResults
 */
const downloadToBot = new CronJob("15 0 * * *", async () => {
	for (const pack of Object.values(settings.submission.packs)) {
		await downloadResults(client, pack.channels.results);
	}
});

/**
 * Push downloaded textures to GitHub, and back up DB
 * Runs each day at 00:30 CE(S)T
 * @author Evorp, Juknum
 * @see pushTextures
 * @see saveDB
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

		/**
		 * LOOP EVENTS
		 */
		setInterval(() => {
			fetchSettings();
		}, 60000); // each minute
	},
};
