/**
 * Get pack id (e.g. faithful_32x, classic_faithful_64x) by a given submission channel id
 * @author Evorp
 * @param {string} channelID channel id to test
 * @param {"any" | "submit" | "council" | "results"} channelType optionally specify type of channel to search
 * @returns {string | undefined} key of pack
 */
module.exports = function getPackByChannel(channelID, channelType = "any") {
	const packs = require("@resources/packs.json");
	for (const [packKey, packValue] of Object.entries(packs)) {
		if (packValue.submission.channels?.[channelType] == channelID) return packKey;
		if (Object.values(packValue.submission.channels).includes(channelID) && channelType == "any")
			return packKey;
	}
};
