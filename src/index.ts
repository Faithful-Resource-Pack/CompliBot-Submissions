import "dotenv/config";
import "@interfaces/environment";

import { readdirSync } from "fs";
import { join } from "path";

import type { Event } from "@interfaces/discord";

import { fetchSettings } from "@functions/fetchSettings";
import handleError from "@functions/handleError";
import { Client, GatewayIntentBits, Partials } from "discord.js";

export default function startClient() {
	const client = new Client({
		// remove this line to die instantly ~sharkaccino, 2021
		allowedMentions: { parse: ["users", "roles"], repliedUser: false },
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
	const eventsFiles = readdirSync(join(__dirname, "events")).filter((f) => f.endsWith(".ts"));
	for (const file of eventsFiles) {
		const event: Event = require(join(__dirname, "events", file)).default;

		// catch invalid events
		if (typeof event !== "object") continue;

		if (event.once) client.once(event.name, event.execute);
		else client.on(event.name, event.execute);
	}

	/**
	 * ERROR HANDLER
	 */
	process.on("unhandledRejection", (reason: any) =>
		handleError(client, reason, "Unhandled Rejection"),
	);
	process.on("uncaughtException", (error) => handleError(client, error, "Uncaught Exception"));

	return client.login(process.env.CLIENT_TOKEN).catch(console.error);
}

// IMPORTANT: you always need to fetch settings BEFORE you start the bot
fetchSettings()
	.then(startClient)
	.catch((err) => {
		console.error("An error occurred starting the bot!");
		console.error(err.response?.data ?? err);
	});
