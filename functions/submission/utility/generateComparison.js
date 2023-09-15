const settings = require("@resources/settings.json");
const stitch = require("@images/stitch");
const { magnifyAttachment, magnifyBuffer } = require("@images/magnify");
const { loadImage } = require("@napi-rs/canvas");
const { default: axios } = require("axios");
const minecraftSorter = require("@helpers/minecraftSorter");
const animate = require("@images/animate");
const { AttachmentBuilder } = require("discord.js");

/**
 * @typedef TextureInfo
 * @property {String} path
 * @property {String} version
 * @property {String} edition
 * @property {import("@helpers/jsdoc").Path?} animation
 */

/**
 * @typedef ReturnParams
 * @property {AttachmentBuilder} comparisonImage
 * @property {Boolean} hasReference
 * @property {import("@images/animate").MCMETA?} mcmeta
 */

/**
 * Generate a submission comparison for a given texture, pack, and image
 * @author Evorp
 * @param {String} pack pack to compare against (e.g. faithful_32x, classic_faithful_64x)
 * @param {AttachmentBuilder} attachment raw texture being submitted
 * @param {TextureInfo} info used for searching for references/current
 * @returns {Promise<ReturnParams>} compared texture and info
 */
module.exports = async function generateComparison(pack, attachment, info) {
	let referenceRepo;
	switch (pack) {
		case "faithful_64x":
			referenceRepo = settings.repositories.raw.faithful_32x;
			break;
		case "classic_faithful_64x":
			referenceRepo = settings.repositories.raw.classic_faithful_32x;
			break;
		case "classic_faithful_32x_progart":
			referenceRepo = settings.repositories.raw.progart;
			break;
		default:
			referenceRepo = settings.repositories.raw.default;
			break;
	}

	const newImage = await loadImage(attachment.url);

	/**
	 * IMAGE LOADING
	 * - tries to go from left to right: Reference | New | Current
	 */

	/** @type {import("@napi-rs/canvas").Image[]} */
	const images = [];

	try {
		images.push(
			await loadImage(`${referenceRepo[info.edition.toLowerCase()]}${info.version}/${info.path}`),
		);
	} catch {
		// reference texture doesn't exist so we use the default repo
		try {
			images.push(
				await loadImage(
					`${settings.repositories.raw.default[info.edition.toLowerCase()]}${info.version}/${
						info.path
					}`,
				),
			);
		} catch {
			// default texture doesn't exist either
		}
	}

	// pushing after the reference texture for better ordering
	images.push(newImage);

	try {
		images.push(
			await loadImage(
				`${settings.repositories.raw[pack][info.edition.toLowerCase()]}${info.version}/${
					info.path
				}`,
			),
		);
	} catch {
		// texture being submitted is a new texture, so there's nothing to compare against
	}

	// return early if the reference texture couldn't be fetched
	if (images.length == 1) {
		const img = await loadImage(images[0]);
		return {
			comparisonImage: await magnifyAttachment(img, "magnified.png"),
			hasReference: false,
		};
	}

	const [stitched, totalGaps] = await stitch(images);

	if (info.animation) {
		/** @type {import("@images/animate").MCMETA} */
		let mcmeta = { animation: {} };
		const path = `${info.animation.versions.sort(minecraftSorter).reverse()[0]}/${
			info.animation.name
		}.mcmeta`;
		try {
			// try to get mcmeta from repo (can be different for height/width properties)
			mcmeta = (await axios.get(`${settings.repositories.raw[pack].java}${path}`)).data;
		} catch {
			// try getting it from the default repo (not in pack yet)
			try {
				mcmeta = (await axios.get(`${settings.repositories.raw.default.java}${path}`)).data;
			} catch {
				// mcmeta doesn't exist so we assume default settings
			}
		}

		// otherwise ugly width and height properties are always shown
		const displayedMcmeta = structuredClone(mcmeta);

		const { magnified, width, factor } = await magnifyBuffer(stitched, true);

		mcmeta.animation.width = mcmeta.animation.width
			? (mcmeta.animation.width * images.length + totalGaps) * factor
			: width;
		mcmeta.animation.height = mcmeta.animation.height
			? mcmeta.animation.height * factor
			: (width - totalGaps * factor) / images.length; // get height of a single frame
		const animated = await animate(await loadImage(magnified), mcmeta);

		return {
			comparisonImage: new AttachmentBuilder(animated, { name: "compared.gif" }),
			hasReference: images.length == 3,
			mcmeta: displayedMcmeta,
		};
	}

	return {
		comparisonImage: await magnifyAttachment(stitched, "compared.png"),
		hasReference: images.length == 3,
	};
};
