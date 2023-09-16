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
module.exports = async function loadCommands(client) {
	client.commands = new Collection();
	const commandPaths = walkSync(join(__dirname, "..", "commands")).filter((f) => f.endsWith(".js"));
	for (const path of commandPaths) {
		const command = require(path);
		client.commands.set(command.data.name, command);
	}

	const rest = new REST({ version: "10" }).setToken(process.env.CLIENT_TOKEN);

	try {
		rest.put(
			Routes.applicationCommands(client.user.id),
			{ body: commandPaths.map((path) => require(path).data.toJSON()) }
		)
	} catch (err) {
		devLogger(client, err, { title: "Slash Command Error" });
		console.error(err);
	}
}