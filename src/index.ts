import "dotenv/config";
import "@interfaces/environment";

import loadEvents from "@functions/loadEvents";
import loadCommands from "@functions/loadCommands";

import { fetchSettings } from "@functions/fetchSettings";
import handleError from "@functions/handleError";
import { Client, GatewayIntentBits, Partials } from "discord.js";

export default async function startClient() {
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
			GatewayIntentBits.GuildMessageReactions,
			GatewayIntentBits.GuildMessageTyping,
			GatewayIntentBits.DirectMessages,
			GatewayIntentBits.DirectMessageReactions,
			GatewayIntentBits.DirectMessageTyping,
			GatewayIntentBits.MessageContent,
		],
	});

	// set up error handlers before doing anything in case login fails
	process.on("unhandledRejection", (reason: any) =>
		handleError(client, reason, "Unhandled Rejection"),
	);
	process.on("uncaughtException", (error) => handleError(client, error, "Uncaught Exception"));

	try {
		await client.login(process.env.CLIENT_TOKEN);
		await Promise.all([loadEvents(client), loadCommands(client)]);
	} catch (data) {
		return console.error(data);
	}
}

// IMPORTANT: you always need to fetch settings BEFORE you start the bot
fetchSettings()
	.then(startClient)
	.catch((err) => {
		console.error("An error occurred starting the bot!");
		console.error(err.response?.data ?? err);
	});
