import type { Pack, Texture } from "@interfaces/database";

import { magnifyToAttachment, magnify } from "@images/magnify";
import animate from "@images/animate";
import stitch from "@images/stitch";

import { Image, loadImage } from "@napi-rs/canvas";
import { AttachmentBuilder } from "discord.js";

interface ComparisonResults {
	/** Stitched comparison image */
	comparisonImage: AttachmentBuilder;
	/** Whether the image was previously present in the pack or not */
	isEdit: boolean;
}

/**
 * Generate a submission comparison for a given texture, pack, and image
 * @author Evorp
 * @param image loaded submitted attachment
 * @param texture texture to compare against
 * @param pack pack to compare images against
 * @returns compared texture and info
 */
export default async function generateComparison(
	image: Image,
	texture: Texture,
	pack: Pack,
): Promise<ComparisonResults> {
	const reference = pack.submission.reference || "default";
	const baseURL = `${process.env.API_URL}textures/${texture.id}/url/`;

	/**
	 * [Reference, New, Current?]
	 */
	const images = (
		await Promise.all<Image>([
			loadImage(`${baseURL}${reference}/latest`)
				// fall back to default if reference doesn't exist
				.catch(() => loadImage(`${baseURL}default/latest`))
				// default doesn't exist either
				.catch(() => null),
			image,
			// may not be present and that's fine
			loadImage(`${baseURL}${pack.id}/latest`).catch(() => null),
		])
	).filter((img) => img !== null);

	// return early if the reference texture couldn't be fetched
	if (images.length === 1) {
		return {
			comparisonImage: await magnifyToAttachment(images[0], "magnified.png"),
			isEdit: false,
		};
	}

	const [stitched, totalGaps] = await stitch(images);

	if (!texture.paths.some((p) => p.mcmeta === true))
		return {
			comparisonImage: await magnifyToAttachment(stitched, "compared.png"),
			isEdit: images.length === 3,
		};

	// prevents random internal properties possibly being added in the embed
	const mcmeta = structuredClone(texture.mcmeta);

	const { magnified, width, factor } = await magnify(stitched, true);

	mcmeta.animation ||= {};

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
		isEdit: images.length === 3,
	};
}
