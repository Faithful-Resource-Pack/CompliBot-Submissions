const { default: axios } = require("axios");
const sizeOf = require("image-size");

/**
 * Get dimensions of an image and validate url
 * @author Juknum
 * @param {String} imageURL
 * @returns {Promise<import("image-size/dist/types/interface").ISizeCalculationResult>}
 */
module.exports = async function getDimensions(imageURL) {
	/** @type {Buffer} */
	const buf = (await axios.get(imageURL, { responseType: "arraybuffer" })).data;

	// fixes bug where buf was undefined
	if (!buf) throw new Error(`Buffer for getDimensions invalid: ${buf}`);

	return sizeOf(buf);
};
