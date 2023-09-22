const devLogger = require("@helpers/devLogger");
const { DiscordAPIError } = require("discord.js");

const DEV = process.env.DEV.toLowerCase() == "true";

/**
 * @param {import("discord.js").Client} client Discord client treating the information
 * @param {Error} error The object with which the promise was rejected
 * @param {Promise} promise The rejected promise
 * @param {import("discord.js").Message?} originMessage Origin user message
 */
module.exports = function unhandledRejection(client, error, promise, originMessage) {
	if (DEV) return console.trace(error?.stack ?? error);

	let eprotoError = false;
	let description = error.stack;
	let codeBlocks = "";

	if (error.isAxiosError) {
		// axios errors are JSON
		description = JSON.stringify(error.toJSON());
		eprotoError = error.code === "EPROTO";
		codeBlocks = "json";
	} else if (!description) {
		// no stack trace so it's JSON
		description = JSON.stringify(error);
		codeBlocks = "json";
	} else if (error instanceof DiscordAPIError)
		// not on our end, just clutters logs
		return console.error(error, promise, description);

	// silence EPROTO errors
	if (eprotoError) return console.error(error, promise, description);

	if (originMessage?.url !== undefined)
		description = `Coming from [this message](${originMessage.url})\n${description}`;

	console.error(error, promise);

	// DO NOT DELETE THIS CATCH, IT AVOIDS INFINITE LOOP IF THIS PROMISE REJECTS
	devLogger(client, description, { codeBlocks }).catch(console.error);
};
