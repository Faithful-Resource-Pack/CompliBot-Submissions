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

const fetchSettings = require("@functions/fetchSettings");
const unhandledRejection = require("@events/unhandledRejection");
const { Client, GatewayIntentBits, Partials } = require("discord.js");

function startBot() {
	const client = new Client({
		allowedMentions: { parse: ["users", "roles"], repliedUser: false }, // remove this line to die instantly ~JackDotJS 2021
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
		if (event.once) client.once(event.name, (...args) => event.execute(client, ...args));
		else client.on(event.name, (...args) => event.execute(client, ...args));
	}

	/**
	 * ERROR HANDLER
	 */
	process.on("unhandledRejection", (reason, promise) =>
		unhandledRejection(client, reason, promise),
	);

	client.login(process.env.CLIENT_TOKEN).catch(console.error);
}

// IMPORTANT: you always need to fetch settings BEFORE you start the bot
fetchSettings()
	.then(() => startBot())
	.catch((err) => {
		console.error("An error occurred starting the bot!");
		console.error(err.response?.data ?? err);
	});

exports.startBot = startBot;
