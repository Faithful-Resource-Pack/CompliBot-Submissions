const { Routes } = require("discord.js");
const { REST } = require("@discordjs/rest");
const walkSync = require("@helpers/walkSync");
const { join } = require("path");
const devLogger = require("@helpers/devLogger");
const { Collection } = require("discord.js");

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

	try {
		// add to discord so they can be used in the slash command menu
		rest.put(Routes.applicationCommands(client.user.id), {
			body: commandPaths.map((path) => require(path).data.toJSON()),
		});
	} catch (err) {
		devLogger(client, err, { title: "Slash Command Error" });
		console.error(err);
	}
}

/**
 * Delete all slash commands from either a guild or globally
 * @author Evorp
 * @param {REST} rest
 * @param {String | "global"} guildID
 */
async function deleteCommands(client, rest, guildID) {
	const data =
		guildID == "global"
			? await rest.get(Routes.applicationCommands(client.user.id))
			: // get all command ids
			  await rest.get(Routes.applicationGuildCommands(client.user.id, guildID));
	for (const command of data) {
		const deleteUrl =
			guildID == "global"
				? `${Routes.applicationCommand(client.user.id, command.id)}`
				: `${Routes.applicationGuildCommands(client.user.id, guildID)}/${command.id}`;
		await rest.delete(deleteUrl);
	}
}

module.exports = {
	loadCommands,
	deleteCommands,
};
