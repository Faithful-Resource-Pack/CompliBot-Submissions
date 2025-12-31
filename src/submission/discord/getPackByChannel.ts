import type { PackFile } from "@interfaces/database";

/**
 * Get pack id (e.g. faithful_32x, classic_faithful_64x) by a given channel id
 * @author Evorp
 * @param channelID channel id to test
 * @returns key of pack
 */
export default function getPackByChannel(channelID: string): string | undefined {
	const packs: PackFile = require("@resources/packs.json");

	// even though the code is really simple it's used literally everywhere
	return Object.keys(packs).find((key) =>
		Object.values(packs[key].submission.channels).includes(channelID),
	);
}
