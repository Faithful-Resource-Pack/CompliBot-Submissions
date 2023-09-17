const settings = require("@resources/settings.json");
const DEV = process.env.DEV.toLowerCase() == "true";
const MAINTENANCE = process.env.MAINTENANCE.toLowerCase() == "true";

const { loadCommands, deleteCommands } = require("@functions/commandHandler");
const fetchSettings = require("@functions/fetchSettings");

const { sendToCouncil, sendToResults } = require("@submission/sendToChannel");
const { downloadResults } = require("@submission/downloadResults");
const pushTextures = require("@submission/pushTextures");
const saveDB = require("@functions/saveDB");

const { ActivityType } = require("discord.js");
const { CronJob } = require("cron");

/** @type {import("@helpers/jsdoc").Event} */
module.exports = {
	name: "ready",
	once: true,
	/** @param {import("discord.js").Client} client */
	async execute(client) {
		console.log(`┌─────────────────────────────────────────────────────────────┐`);
		console.log(`│                                                             │`);
		console.log(`│  ─=≡Σ((( つ◕ل͜◕)つ                                           │`);
		console.log(`│ JavaScript is a pain, but I'm fine, I hope...               │`);
		console.log(`│                                                             │`);
		console.log(`└─────────────────────────────────────────────────────────────┘\n\n`);

		/** @see commands */
		await loadCommands(client);

		if (MAINTENANCE)
			client.user.setPresence({ activities: [{ name: "maintenance" }], status: "dnd" });
		else client.user.setActivity({ name: "for submissions", type: ActivityType.Watching });

		if (DEV) {
			setInterval(() => {
				// format the settings for easier viewing
				fetchSettings(true);
			}, 20000); // 20 seconds
			return;
		}

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
			for (const pack of Object.keys(settings.submission.packs))
				await pushTextures("./downloadedTextures", pack);
			await saveDB(client);
		});

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
		}, 900000); // 15 minutes
	},
};
