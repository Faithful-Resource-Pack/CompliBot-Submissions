import { Routes, REST, Collection, Client } from "discord.js";
import { join } from "path";

import type { Command } from "@interfaces/discord";
import { readdir } from "fs/promises";

export const COMMAND_PATH = join(__dirname, "..", "commands");

/**
 * Load slash commands and add them to the client
 * @author RobertR11, Evorp
 * @param client client to load commands to
 */
export async function loadCommands(client: Client) {
	const commandPaths = await readdir(COMMAND_PATH, { recursive: true });
	const commands = await Promise.all<Command>(
		commandPaths
			.filter((f) => f.endsWith(".ts"))
			.map(async (f) => (await import(join(COMMAND_PATH, f))).default),
	);

	client.commands = new Collection(commands.map((c) => [c.data.name, c]));

	const rest = new REST({ version: "10" }).setToken(process.env.CLIENT_TOKEN);

	// add to discord so they can be used in the slash command menu
	return rest
		.put(Routes.applicationCommands(client.user.id), {
			body: Array.from(client.commands.values()).map((command) => command.data.toJSON()),
		})
		.then(() => console.log("Slash commands loaded"));
}

/**
 * Delete all slash commands from either a guild or globally
 * @author Evorp
 * @param client client to delete commands from
 * @param guildID guild to delete or all
 */
export async function deleteCommands(client: Client, guildID: string | "global") {
	const rest = new REST({ version: "10" }).setToken(process.env.CLIENT_TOKEN);

	const data: any =
		guildID === "global"
			? await rest.get(Routes.applicationCommands(client.user.id))
			: // get all command ids
				await rest.get(Routes.applicationGuildCommands(client.user.id, guildID));

	await Promise.all(
		data.map((command: any) =>
			rest.delete(
				guildID === "global"
					? `${Routes.applicationCommand(client.user.id, command.id)}`
					: `${Routes.applicationGuildCommands(client.user.id, guildID)}/${command.id}`,
			),
		),
	);
}
