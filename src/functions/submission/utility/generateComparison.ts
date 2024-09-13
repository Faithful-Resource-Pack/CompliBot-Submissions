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

	/**
	 * [Reference, New, Current?]
	 */
	const images: Image[] = (
		await Promise.all([
			loadImage(`${baseURL}${reference}/latest`)
				// fall back to default if reference doesn't exist
				.catch(() => loadImage(`${baseURL}default/latest`))
				// default doesn't exist either
				.catch(() => null),
			loadImage(attachment.url),
			// may not be present and that's fine
			loadImage(`${baseURL}${pack}/latest`).catch(() => null),
		])
	).filter((v) => v !== null);

	// return early if the reference texture couldn't be fetched
	if (images.length === 1) {
		return {
			comparisonImage: await magnifyToAttachment(images[0], "magnified.png"),
			hasReference: false,
		};
	}

	const [stitched, totalGaps] = await stitch(images);

	if (!texture.paths.some((p) => p.mcmeta === true))
		return {
			comparisonImage: await magnifyToAttachment(stitched, "compared.png"),
			hasReference: images.length === 3,
		};

	const { mcmeta } = texture;

	// otherwise ugly width and height properties are always shown
	const displayedMcmeta = structuredClone(mcmeta);

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
		hasReference: images.length == 3,
		mcmeta: displayedMcmeta,
	};
}
