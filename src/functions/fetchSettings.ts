import { writeFile } from "fs/promises";
import { join } from "path";
import axios from "axios";

const FETCH_SETTINGS = process.env.FETCH_SETTINGS.toLowerCase() === "true";
const DEV = process.env.DEV.toLowerCase() === "true";

/**
 * Download JSON files for local usage
 * @author Juknum, Evorp
 * @param url url to download
 * @param path path to download to
 * @param format whether to format the setting file being downloaded
 */
export async function fetchFile(url: string, path: string, format = false) {
	const { data: settings } = await axios.get<unknown>(url);
	const OUT_PATH = join(process.cwd(), path);
	return writeFile(OUT_PATH, JSON.stringify(settings, null, format ? 4 : 0), {
		flag: "w",
		encoding: "utf-8",
	});
}

/**
 * Fetch required files for bot usage
 * @author Evorp
 */
export async function fetchSettings() {
	// you can run an instance of packs.json and settings.json locally for hosting your own packs
	if (!FETCH_SETTINGS) return;
	return Promise.all([
		fetchFile(`${process.env.API_URL}settings/raw`, "resources/settings.json", DEV),
		fetchFile(`${process.env.API_URL}submissions/all`, "resources/packs.json", DEV),
	]);
}
