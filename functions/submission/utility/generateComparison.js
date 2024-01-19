const { magnifyToAttachment, magnify } = require("@images/magnify");
const animate = require("@images/animate");
const stitch = require("@images/stitch");

const { loadImage } = require("@napi-rs/canvas");
const { AttachmentBuilder } = require("discord.js");

/**
 * @typedef ReturnParams
 * @property {AttachmentBuilder} comparisonImage image for embed
 * @property {boolean} hasReference what to display in the footer
 * @property {import("@images/animate").MCMETA} [mcmeta] display mcmeta if applicable
 */

/**
 * Generate a submission comparison for a given texture, pack, and image
 * @author Evorp
 * @param {string} pack base pack ID
 * @param {import("discord.js").Attachment} attachment raw texture being submitted
 * @param {import("@helpers/jsdoc").Texture} texture texture data
 * @returns {Promise<ReturnParams>} compared texture and info
 */
module.exports = async function generateComparison(pack, attachment, texture) {
	const reference = require("@resources/packs.json")[pack].submission.reference ?? "default";
	const baseURL = `${process.env.API_URL}textures/${texture.id}/url/`;

	const newImage = await loadImage(attachment.url);

	/**
	 * IMAGE LOADING
	 * - tries to go from left to right: Reference | New | Current
	 */

	/** @type {import("@napi-rs/canvas").Image[]} */
	const images = [];

	try {
		images.push(await loadImage(`${baseURL}${reference}/latest`));
	} catch {
		// reference texture doesn't exist so we use the default repo
		try {
			images.push(await loadImage(`${baseURL}default/latest`));
		} catch {
			// default texture doesn't exist either
		}
	}

	// pushing after the reference texture for better ordering
	images.push(newImage);

	try {
		images.push(await loadImage(`${baseURL}${pack}/latest`));
	} catch {
		// texture being submitted is a new texture, so there's nothing to compare against
	}

	// return early if the reference texture couldn't be fetched
	if (images.length == 1) {
		return {
			comparisonImage: await magnifyToAttachment(images[0], "magnified.png"),
			hasReference: false,
		};
	}

	const [stitched, totalGaps] = await stitch(images);

	if (!Object.keys(texture.mcmeta).length)
		return {
			comparisonImage: await magnifyToAttachment(stitched, "compared.png"),
			hasReference: images.length == 3,
		};

	const { mcmeta } = texture;

	// otherwise ugly width and height properties are always shown
	const displayedMcmeta = structuredClone(mcmeta);

	const { magnified, width, factor } = await magnify(stitched, true);

	mcmeta.animation.width = mcmeta.animation.width
		? (mcmeta.animation.width * images.length + totalGaps) * factor
		: width;
	mcmeta.animation.height = mcmeta.animation.height
		? mcmeta.animation.height * factor
		: (width - totalGaps * factor) / images.length; // get height of a single frame

	const animated = await animate(magnified, mcmeta);

	return {
		comparisonImage: new AttachmentBuilder(animated, { name: "compared.gif" }),
		hasReference: images.length == 3,
		mcmeta: displayedMcmeta,
	};
};
