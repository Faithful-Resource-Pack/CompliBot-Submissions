import type { PackFile } from "@interfaces/database";

export type ChannelType = "any" | "submit" | "council" | "results";

/**
 * Get pack id (e.g. faithful_32x, classic_faithful_64x) by a given submission channel id
 * @author Evorp
 * @param channelID channel id to test
 * @param channelType optionally specify type of channel to search
 * @returns key of pack
 */
export default function getPackByChannel(
	channelID: string,
	channelType: ChannelType = "any",
): string {
	const packs: PackFile = require("@resources/packs.json");

	// more annoying to use .find since we're only returning the key
	for (const [packKey, packValue] of Object.entries(packs)) {
		if (packValue.submission.channels?.[channelType] == channelID) return packKey;
		if (Object.values(packValue.submission.channels).includes(channelID) && channelType == "any")
			return packKey;
	}
}
