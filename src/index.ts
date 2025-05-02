/**
 * COMPLIBOT SUBMISSIONS INDEX FILE:
 * - Developed by and for the Faithful Community.
 * - Please read our license first.
 * - If you find any bugs, please use our GitHub issue tracker
 */

import "dotenv/config";

import { fetchSettings } from "@functions/fetchSettings";
import handleError from "@functions/handleError";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import type { Event } from "@interfaces/discord";

import { readdir } from "fs/promises";
import { join } from "path";

export const EVENT_PATH = join(__dirname, "events");

export default async function startBot() {
	const client = new Client({
		// remove this line to die instantly ~JackDotJS 2021
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
	const eventPaths = await readdir(EVENT_PATH);
	const events = await Promise.all<Event>(
		eventPaths
			.filter((f) => f.endsWith(".ts"))
			.map(async (f) => (await import(join(EVENT_PATH, f))).default),
	);

	for (const event of events) {
		// catch invalid events
		if (typeof event !== "object") return;

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
