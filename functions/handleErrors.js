const devLogger = require("@helpers/devLogger");
const { DiscordAPIError } = require("discord.js");

const DEV = process.env.DEV.toLowerCase() == "true";

/**
 * Handle errors and log them as necessary
 * @author TheRolf, Evorp
 * @param {import("discord.js").Client} client Discord client treating the information
 * @param {Error} error the error itself
 * @param {"Unhandled Rejection" | "Uncaught Exception"} type type of error
 */
module.exports = function handleErrors(client, error, type) {
	if (DEV) return console.error(error?.stack ?? error);

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
		return console.error(error, description);

	// silence EPROTO errors
	if (eprotoError) return console.error(error, description);

	console.error(error?.stack ?? error);

	// DO NOT DELETE THIS CATCH, IT AVOIDS INFINITE LOOP IF THIS PROMISE REJECTS
	devLogger(client, description, { codeBlocks, title: type }).catch(console.error);
};
