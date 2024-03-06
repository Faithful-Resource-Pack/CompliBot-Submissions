const { createCanvas, loadImage, ImageData } = require("@napi-rs/canvas");
const { AttachmentBuilder } = require("discord.js");

const { magnify } = require("@images/magnify");

const settings = require("@resources/settings.json");

// set to 1 to disable
const TRANSPARENCY_FACTOR = 1 / 2;

const CHANGED_PIXEL_COLOR = settings.colors.blue;
const REMOVED_PIXEL_COLOR = settings.colors.red;
const ADDED_PIXEL_COLOR = settings.colors.green;
// value unused
const UNCHANGED_PIXEL_COLOR = settings.colors.black;

/**
 * @typedef MappedURL Used for getting relevant data
 * @property {UInt8ClampedArray} pixels Raw image data
 * @property {number} width width of image
 * @property {number} height height of image
 */

/**
 * Shows the per-pixel difference between two images:
 * - blue is changed
 * - red is removed
 * - green is added
 * @author EwanHowell
 * @param {string} firstUrl first url to compare
 * @param {string} secondUrl second url to compare
 * @param {number} tolerance difference between colors considered acceptable
 * @returns {Promise<import("discord.js").AttachmentBuilder>} compared image
 */
async function difference(firstUrl, secondUrl, tolerance = 0) {
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
		const color = diffPixel(first, second, x, y, tolerance);

		// out of bounds, skip
		if (!color) continue;

		// set to original pixel
		if (color === UNCHANGED_PIXEL_COLOR) {
			data.set(first.pixels.slice(i, i + 3), i);
			data[i + 3] = first.pixels[i + 3] * TRANSPARENCY_FACTOR;
			continue;
		}

		data.set(hexToRGBA(color), i);
	}

	// convert the edited buffer back to a canvas
	const out = createCanvas(finalWidth, finalHeight);
	out.getContext("2d").putImageData(new ImageData(data, finalWidth, finalHeight), 0, 0);
	const finalBuffer = out.toBuffer("image/png");
	return new AttachmentBuilder(finalBuffer, { name: "diff.png" });
}

function diffPixel(first, second, x, y, tolerance) {
	// boundary and size checks
	if ((x >= first.width && y >= second.height) || (x >= second.width && y >= first.height)) return;

	if ((x >= second.width && x <= first.width) || (y >= second.height && y <= first.height))
		return REMOVED_PIXEL_COLOR;

	if ((y >= first.height && y <= second.height) || (x >= first.width && x <= second.width))
		return ADDED_PIXEL_COLOR;

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
		return UNCHANGED_PIXEL_COLOR;

	// first pixel is transparent and second one isn't
	if (first.pixels[i1 + 3] === 0 && second.pixels[i2 + 3] !== 0) return ADDED_PIXEL_COLOR;

	// first pixel isn't transparent and second one is
	if (first.pixels[i1 + 3] !== 0 && second.pixels[i2 + 3] === 0) return REMOVED_PIXEL_COLOR;

	if (
		first.pixels[i1] === second.pixels[i2] &&
		first.pixels[i1 + 1] === second.pixels[i2 + 1] &&
		first.pixels[i1 + 2] === second.pixels[i2 + 2] &&
		first.pixels[i1 + 3] === second.pixels[i2 + 3]
	)
		return UNCHANGED_PIXEL_COLOR;

	// only set to blue if the pixels aren't transparent and are different
	return CHANGED_PIXEL_COLOR;
}

/**
 * Map and magnify a URL to a diff-able format
 * @author Evorp
 * @param {string} url URL to map
 * @returns {Promise<MappedURL>} Mapped URL
 */
async function mapURL(url) {
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
 * @param {string} hex e.g. #a1b2c3
 * @returns {number[]} [r, g, b, a] array
 */
function hexToRGBA(hex) {
	// hack I found on stackoverflow to split into groups of two
	const splitHex = hex.replace("#", "").match(/.{1,2}/g);
	const finalArr = splitHex.map((i) => parseInt(`0x${i}`));
	// add alpha
	finalArr.push(255);
	return finalArr;
}

module.exports = {
	difference,
	CHANGED_PIXEL_COLOR,
	ADDED_PIXEL_COLOR,
	REMOVED_PIXEL_COLOR,
	UNCHANGED_PIXEL_COLOR,
};
