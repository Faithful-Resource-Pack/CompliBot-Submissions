const { Routes, REST, Collection } = require("discord.js");
const { join } = require("path");

const walkSync = require("@helpers/walkSync");

/**
 * Load slash commands and add them to the client
 * @author RobertR11, Evorp
 * @param {import("discord.js").Client} client
 */
async function loadCommands(client) {
	client.commands = new Collection();
	const commandPaths = walkSync(join(__dirname, "..", "commands")).filter((f) => f.endsWith(".js"));

	// add to collection in bot so they can be fetched
	for (const path of commandPaths) {
		/** @type {import("@helpers/jsdoc").Command} */
		const command = require(path);
		client.commands.set(command.data.name, command);
	}

	const rest = new REST({ version: "10" }).setToken(process.env.CLIENT_TOKEN);

	// add to discord so they can be used in the slash command menu
	rest.put(Routes.applicationCommands(client.user.id), {
		body: commandPaths.map((path) => require(path).data.toJSON()),
	});
}

/**
 * Delete all slash commands from either a guild or globally
 * @author Evorp
 * @param {string | "global"} guildID
 */
async function deleteCommands(client, guildID) {
	const rest = new REST({ version: "10" }).setToken(process.env.CLIENT_TOKEN);

	const data =
		guildID == "global"
			? await rest.get(Routes.applicationCommands(client.user.id))
			: // get all command ids
				await rest.get(Routes.applicationGuildCommands(client.user.id, guildID));

	await Promise.all(
		data.map((command) =>
			rest.delete(
				guildID == "global"
					? `${Routes.applicationCommand(client.user.id, command.id)}`
					: `${Routes.applicationGuildCommands(client.user.id, guildID)}/${command.id}`,
			),
		),
	);
}

module.exports = {
	loadCommands,
	deleteCommands,
};
