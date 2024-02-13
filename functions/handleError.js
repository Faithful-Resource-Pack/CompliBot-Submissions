const devLogger = require("@helpers/devLogger");
const { DiscordAPIError } = require("discord.js");

const DEV = process.env.DEV.toLowerCase() == "true";

/**
 * Handle and log errors
 * @author TheRolf, Evorp
 * @param {import("discord.js").Client} client discord client
 * @param {Error} error error description
 * @param {string} type error title
 */
module.exports = function handleError(client, error, type) {
	if (DEV) return console.error(error?.stack ?? error);

	const description = error.stack || JSON.stringify(error);
	// if there's no stack, interpret the error as json
	const codeBlocks = error.stack ? "" : "json";

	if (error instanceof DiscordAPIError)
		// discord's problem (usually), not ours
		return console.error(error, type, description);

	// silence EPROTO errors
	if (error.code == "EPROTO") return console.error(error, type, description);

	// DO NOT DELETE THIS CATCH, IT AVOIDS INFINITE LOOP IF THIS PROMISE REJECTS
	devLogger(client, description, { title: type, codeBlocks }).catch(console.error);
};
