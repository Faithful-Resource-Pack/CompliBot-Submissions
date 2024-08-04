import { createCanvas, Image } from "@napi-rs/canvas";

/**
 * stitches together an arbitrary number of images
 * @author EwanHowell, Evorp
 * @param images images to stitch
 * @param gap optionally force gap size
 * @returns stitched texture and the gap length added
 */
export default async function stitch(images: Image[], gap?: number): Promise<[Buffer, number]> {
	const biggestImage = images.reduce((a, e) => (a.width > e.width ? a : e), {
		width: 0,
		height: 0,
	});

	if (gap == null || gap == undefined) {
		// the gap should be the size of one 16x "pixel"
		gap = 1;
		if (biggestImage.width > 16) gap = 2;
		if (biggestImage.width > 32) gap = 4;
		if (biggestImage.width > 64) gap = 8;
		if (biggestImage.width > 128) gap = 16;
	}

	const allGapsLength = (images.length - 1) * gap;
	const canvas = createCanvas(
		images.length * biggestImage.width + allGapsLength,
		biggestImage.height,
	);
	const ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;
	for (let x = 0; x < images.length; ++x)
		ctx.drawImage(
			images[x],
			x * (biggestImage.width + gap),
			0,
			biggestImage.width,
			biggestImage.height,
		);

	return [canvas.toBuffer("image/png"), allGapsLength];
}
