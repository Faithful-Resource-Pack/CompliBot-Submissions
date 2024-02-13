/**
 * COMPLIBOT SUBMISSIONS INDEX FILE:
 * - Developed by and for the Faithful Community.
 * - Please read our license first.
 * - If you find any bugs, please use our GitHub issue tracker
 */

// used for @ paths
require("module-alias/register");
require("dotenv").config();

const { readdirSync } = require("fs");

const { fetchSettings } = require("@functions/fetchSettings");
const handleError = require("@functions/handleError");
const { Client, GatewayIntentBits, Partials } = require("discord.js");

function startBot() {
	const client = new Client({
		// remove this line to die instantly ~JackDotJS 2021
		allowedMentions: { parse: ["users", "roles"], repliedUser: false },
		restTimeOffset: 0,
		partials: [
			Partials.Channel,
			Partials.GuildMember,
			Partials.GuildScheduledEvent,
			Partials.Message,
			Partials.Reaction,
			Partials.ThreadMember,
			Partials.User,
		],
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.GuildModeration,
			GatewayIntentBits.GuildIntegrations,
			GatewayIntentBits.GuildPresences,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.MessageContent,
			GatewayIntentBits.GuildMessageReactions,
			GatewayIntentBits.GuildMessageTyping,
			GatewayIntentBits.DirectMessages,
			GatewayIntentBits.DirectMessageReactions,
			GatewayIntentBits.DirectMessageTyping,
		],
	});

	/**
	 * EVENT HANDLER
	 * - see the ./events folder
	 */
	const eventsFiles = readdirSync("./events").filter((f) => f.endsWith(".js"));
	for (const file of eventsFiles) {
		/** @type {import("@helpers/jsdoc").Event} */
		const event = require(`./events/${file}`);

		// catch invalid events
		if (typeof event != "object") continue;

		if (event.once) client.once(event.name, event.execute);
		else client.on(event.name, event.execute);
	}

	/**
	 * ERROR HANDLER
	 */
	process.on("unhandledRejection", (reason) => handleError(client, reason, "Unhandled Rejection"));
	process.on("uncaughtException", (error) => handleError(client, error, "Uncaught Exception"));

	client.login(process.env.CLIENT_TOKEN).catch(console.error);
}

// IMPORTANT: you always need to fetch settings BEFORE you start the bot
fetchSettings()
	.then(startBot)
	.catch((err) => {
		console.error("An error occurred starting the bot!");
		console.error(err.response?.data ?? err);
	});

module.exports = startBot;
