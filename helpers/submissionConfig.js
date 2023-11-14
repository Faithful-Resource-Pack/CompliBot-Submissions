const { writeFileSync } = require("fs");
const { join } = require("path");

const axios = require("axios").default;

const DEV = process.env.DEV == "true";

/**
 * Convert a display name into a pack ID
 * @author Evorp
 * @param {string} pack display name
 * @returns {string} pack as id
 */
const createPackID = (pack) =>
	pack
		.toLowerCase()
		.trim()
		.replace(/jappa/g, "")
		.replace(/programmer art/g, "progart")
		.replace(/ /g, "_");

/**
 * Write submission changes either locally or to the API
 * @author Evorp
 * @param {import("discord.js").Client} client
 * @param {import("@helpers/jsdoc").SubmissionPack[]} packs
 * @param {boolean} [noWrite] don't write to the API
 */
async function writeSubmissionChanges(client, packs, noWrite = false) {
	// fetch absolutely most recent version
	const settings = (await axios.get(`${process.env.API_URL}settings/raw`)).data;
	settings.submission.packs = packs;

	// write prettified file when in dev and don't push
	if (DEV || noWrite) {
		const OUT_PATH = join(process.cwd(), "resources", "settings.json");
		writeFileSync(OUT_PATH, JSON.stringify(settings, null, 4), {
			flag: "w",
			encoding: "utf-8",
		});
	} else {
		await axios.post(`${process.env.API_URL}settings/raw`, settings, {
			headers: {
				bot: process.env.API_TOKEN,
			},
		});
	}

	client.destroy();
	// delete bot cache
	Object.keys(require.cache).forEach((key) => delete require.cache[key]);
	// restart bot by launching index file
	require("@index");
}

module.exports = {
	createPackID,
	writeSubmissionChanges,
};
