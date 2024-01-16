const { writeFile } = require("fs/promises");
const { join } = require("path");
const FETCH_SETTINGS = process.env.FETCH_SETTINGS.toLowerCase() == "true";
const axios = require("axios").default;

/**
 * Download JSON files for local usage
 * @author Juknum, Evorp
 * @param {string} url url to download
 * @param {boolean} [format] whether to format the setting file being downloaded
 */
async function fetchFile(url, path, format = false) {
	const { data: settings } = await axios.get(url);
	const OUT_PATH = join(process.cwd(), path);
	return writeFile(OUT_PATH, JSON.stringify(settings, null, format ? 4 : 0), {
		flag: "w",
		encoding: "utf-8",
	});
}

/**
 * Fetch required files for bot usage
 * @author Evorp
 * @param {boolean} [format] whether to format the downloaded file
 */
async function fetchSettings() {
	await fetchFile(
		`${process.env.API_URL}settings/raw`,
		"resources/settings.json",
		process.env.DEV,
	);

	// you can run an instance of packs.json locally for hosting your own packs
	if (!FETCH_SETTINGS) return;
	await fetchFile(
		`${process.env.API_URL}submissions/all`,
		"resources/packs.json",
		process.env.DEV,
	);
}

module.exports = {
	fetchFile,
	fetchSettings,
};
