import { createCanvas, loadImage, ImageData } from "@napi-rs/canvas";
import { AttachmentBuilder } from "discord.js";

import { magnify } from "@images/magnify";

import settings from "@resources/settings.json";

// set to 1 to disable
export const TRANSPARENCY_FACTOR = 1 / 2;

export const CHANGED_PIXEL_COLOR = settings.colors.blue;
export const REMOVED_PIXEL_COLOR = settings.colors.red;
export const ADDED_PIXEL_COLOR = settings.colors.green;

interface MappedURL {
	pixels: Uint8ClampedArray;
	width: number;
	height: number;
}

export enum DiffType {
	Unchanged,
	Removed,
	Added,
	Changed,
}

/**
 * Shows the per-pixel difference between two images:
 * - blue is changed
 * - red is removed
 * - green is added
 * @author EwanHowell
 * @param firstUrl first url to compare
 * @param secondUrl second url to compare
 * @param tolerance difference between colors considered acceptable
 * @returns compared image
 */
export async function difference(
	firstUrl: string,
	secondUrl: string,
	tolerance = 0,
): Promise<AttachmentBuilder> {
	const first = await mapURL(firstUrl);
	const second = await mapURL(secondUrl);
	const images = [first, second];

	// could not be loaded
	if (images.some((i) => !i)) return null;

	// take biggest dimensions regardless of final image size
	const finalWidth = Math.max(...images.map((i) => i.width));
	const finalHeight = Math.max(...images.map((i) => i.height));

	// multiply by [r, g, b, a] array length
	const bufferLength = finalWidth * finalHeight * 4;

	const data = new Uint8ClampedArray(bufferLength);
	for (let i = 0; i < bufferLength; i += 4) {
		const x = (i / 4) % finalWidth;
		const y = Math.floor(i / 4 / finalWidth);
		const type = diffPixel(first, second, x, y, tolerance);

		// out of bounds, skip
		if (!type) continue;

		switch (type) {
			case DiffType.Added:
				data.set(hexToRGBA(ADDED_PIXEL_COLOR), i);
				continue;
			case DiffType.Removed:
				data.set(hexToRGBA(REMOVED_PIXEL_COLOR), i);
				continue;
			case DiffType.Changed:
				data.set(hexToRGBA(CHANGED_PIXEL_COLOR), i);
			default:
				// set to original pixel
				data.set(first.pixels.slice(i, i + 3), i);
				data[i + 3] = first.pixels[i + 3] * TRANSPARENCY_FACTOR;
				continue;
		}
	}

	// convert the edited buffer back to a canvas
	const out = createCanvas(finalWidth, finalHeight);
	// for some reason the DOM and @napi-rs/canvas types differ
	out.getContext("2d").putImageData(new ImageData(data, finalWidth, finalHeight) as any, 0, 0);
	const finalBuffer = out.toBuffer("image/png");
	return new AttachmentBuilder(finalBuffer, { name: "diff.png" });
}

/**
 * Find the difference for a single pixel between two image datas
 * @author EwanHowell
 * @param first image data
 * @param second image data
 * @param x coordinate
 * @param y coordinate
 * @param tolerance difference between colors considered acceptable
 * @returns diff type
 */
function diffPixel(
	first: MappedURL,
	second: MappedURL,
	x: number,
	y: number,
	tolerance: number,
): DiffType {
	// boundary and size checks
	if ((x >= first.width && y >= second.height) || (x >= second.width && y >= first.height)) return;

	if ((x >= second.width && x <= first.width) || (y >= second.height && y <= first.height))
		return DiffType.Removed;

	if ((y >= first.height && y <= second.height) || (x >= first.width && x <= second.width))
		return DiffType.Added;

	const i1 = (x + y * first.width) * 4;
	const i2 = (x + y * second.width) * 4;

	// find channel with max (or any) difference between the two images
	if (
		Math.max(
			Math.abs(first.pixels[i1] - second.pixels[i2]),
			Math.abs(first.pixels[i1 + 1] - second.pixels[i2 + 1]),
			Math.abs(first.pixels[i1 + 2] - second.pixels[i2 + 2]),
			Math.abs(first.pixels[i1 + 3] - second.pixels[i2 + 3]),
		) < tolerance
	)
		return DiffType.Unchanged;

	// first pixel is transparent and second one isn't
	if (first.pixels[i1 + 3] === 0 && second.pixels[i2 + 3] !== 0) return DiffType.Added;

	// first pixel isn't transparent and second one is
	if (first.pixels[i1 + 3] !== 0 && second.pixels[i2 + 3] === 0) return DiffType.Removed;

	if (
		first.pixels[i1] === second.pixels[i2] &&
		first.pixels[i1 + 1] === second.pixels[i2 + 1] &&
		first.pixels[i1 + 2] === second.pixels[i2 + 2] &&
		first.pixels[i1 + 3] === second.pixels[i2 + 3]
	)
		return DiffType.Unchanged;

	// pixels aren't transparent and are different
	return DiffType.Changed;
}

/**
 * Map and magnify a URL to a diff-able format
 * @author Evorp
 * @param url URL to map
 * @returns Mapped URL
 */
async function mapURL(url: string): Promise<MappedURL> {
	const res = await magnify(url).catch(() => null);

	// null values are handled outside
	if (!res) return null;

	// we can only destructure after null check
	const { magnified, width, height } = res;

	// convert image to canvas
	const img = await loadImage(magnified);
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0);

	const pixels = ctx.getImageData(0, 0, width, height).data;
	return { pixels, width, height };
}

/**
 * Converts from hex string to array of rgba numbers
 * @author Evorp
 * @param hex e.g. #a1b2c3
 * @returns [r, g, b, a] array
 */
function hexToRGBA(hex: string): number[] {
	// hack I found on stackoverflow to split into groups of two
	const splitHex = hex.replace("#", "").match(/.{1,2}/g);
	const finalArr = splitHex.map((i) => parseInt(`0x${i}`));
	// add alpha
	finalArr.push(255);
	return finalArr;
}
