import type { Pack, PackFile } from "@interfaces/database";

/**
 * Get the corresponding pack data for a given submission channel ID
 * @author Evorp
 * @param channelID channel id to test
 * @returns pack object
 */
export default function getPackByChannel(channelID: string): Pack {
	const packs: PackFile = require("@resources/packs.json");

	// even though the code is really simple it's used literally everywhere
	return Object.values(packs).find((pack) =>
		Object.values(pack.submission.channels).includes(channelID),
	);
}
