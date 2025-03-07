import type { ImageSource } from "@interfaces/images";
import { createCanvas, loadImage } from "@napi-rs/canvas";

import { AttachmentBuilder } from "discord.js";

/**
 * The actual magnification function
 * @author Juknum, Evorp
 * @param origin any loadable image
 * @param isAnimation whether to magnify the image as a tilesheet
 * @returns buffer for magnified image
 */
export async function magnify(origin: ImageSource, isAnimation = false) {
	const input = await loadImage(origin);

	// ignore height if tilesheet, otherwise it's not scaled as much
	const surface = isAnimation ? input.width * 16 : input.width * input.height;

	let factor = 64;
	if (surface === 256) factor = 32;
	if (surface > 256) factor = 16;
	if (surface > 1024) factor = 8;
	if (surface > 4096) factor = 4;
	if (surface > 65536) factor = 2;
	if (surface > 262144) factor = 1;

	const width = input.width * factor;
	const height = input.height * factor;
	const output = createCanvas(width, height);
	const ctx = output.getContext("2d");

	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(input, 0, 0, width, height);
	return { magnified: output.toBuffer("image/png"), width, height, factor };
}

/**
 * Returns discord attachment
 * @author Juknum
 * @param origin any loadable image
 * @param name name, defaults to "magnified.png"
 * @returns magnified file
 */
export async function magnifyToAttachment(origin: ImageSource, name = "magnified.png") {
	const { magnified } = await magnify(origin);
	return new AttachmentBuilder(magnified, { name });
}
