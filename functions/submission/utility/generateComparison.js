const settings = require("@resources/settings.json");
const stitch = require("@functions/images/stitch");
const { magnifyAttachment, magnifyBuffer } = require("@functions/images/magnify");
const { loadImage } = require("@napi-rs/canvas");
const { default: axios } = require("axios");
const minecraftSorter = require("@helpers/minecraftSorter");
const animate = require("@functions/images/animate");
const { MessageAttachment } = require("discord.js");

/**
 * @author Evorp
 * @param {String} pack pack to compare against (e.g. faithful_32x, classic_faithful_64x)
 * @param {import("discord.js").MessageAttachment} attachment raw texture being submitted
 * @param {{ path: String, version: String, edition: String, animation: String }} info used for searching for references/current
 * @returns {Promise<{comparisonImage: MessageAttachment, hasReference: Boolean | String}>} compared texture and info
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
	let images = [];

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
		let mcmeta = {};
		try {
			mcmeta = (
				await axios.get(
					`${settings.repositories.raw.default.java}${
						info.animation.versions.sort(minecraftSorter).reverse()[0]
					}/${info.animation.name}.mcmeta`,
				)
			).data;
		} catch {
			// no mcmeta found so we just assume default settings
		}

		const { magnified, width, height, factor } = await magnifyBuffer(stitched, true);
		const allGaps = totalGaps * factor;

		const animated = await animate(await loadImage(magnified), mcmeta, {
			width,
			height: (width - allGaps) / images.length,
		});

		return {
			comparisonImage: new MessageAttachment(animated, "compared.gif"),
			hasReference: images.length == 3,
			mcmeta,
		};
	}

	return {
		comparisonImage: await magnifyAttachment(stitched, "compared.png"),
		hasReference: images.length == 3,
	};
};
