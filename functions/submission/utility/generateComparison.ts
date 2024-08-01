import { magnifyToAttachment, magnify } from "@images/magnify";
import animate from "@images/animate";
import stitch from "@images/stitch";

import { Image, loadImage } from "@napi-rs/canvas";
import { Attachment, AttachmentBuilder } from "discord.js";
import type { MCMETA, Texture } from "@interfaces/database";

interface ComparisonResults {
	comparisonImage: AttachmentBuilder;
	hasReference: boolean;
	mcmeta?: MCMETA;
}

/**
 * Generate a submission comparison for a given texture, pack, and image
 * @author Evorp
 * @param pack base pack ID
 * @param attachment raw texture being submitted
 * @param texture texture data
 * @returns compared texture and info
 */
export default async function generateComparison(
	pack: string,
	attachment: Attachment,
	texture: Texture,
): Promise<ComparisonResults> {
	const reference: string =
		require("@resources/packs.json")[pack].submission.reference ?? "default";
	const baseURL = `${process.env.API_URL}textures/${texture.id}/url/`;

	const newImage = await loadImage(attachment.url);

	/**
	 * IMAGE LOADING
	 * - tries to go from left to right: Reference | New | Current
	 */

	const images: Image[] = [];

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

	if (!texture.paths.some((p) => p.mcmeta === true))
		return {
			comparisonImage: await magnifyToAttachment(stitched, "compared.png"),
			hasReference: images.length == 3,
		};

	const { mcmeta } = texture;

	// otherwise ugly width and height properties are always shown
	const displayedMcmeta = structuredClone(mcmeta);

	const { magnified, width, factor } = await magnify(stitched, true);

	if (!mcmeta.animation) mcmeta.animation = {};

	// scale mcmeta info for new resolution
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
}
