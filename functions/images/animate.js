const { createCanvas } = require("@napi-rs/canvas");
const GIFEncoder = require("./GIFEncoder");

/**
 * Animate a given image with a given mcmeta to a given size
 * @author superboxer4, Evorp, Juknum
 * @param {import("@napi-rs/canvas").Canvas} baseCanvas what you want animated
 * @param {Object} mcmeta how you want it animated (too lazy to make types for it lol)
 * @param {{width: Number, height: Number}} dimension texture information
 * @returns
 */
module.exports = async function animate(baseCanvas, mcmeta, dimension) {
	const canvas = createCanvas(dimension.width, dimension.height);
	const context = canvas.getContext("2d");
	context.imageSmoothingEnabled = false;

	mcmeta = typeof mcmeta === "object" ? mcmeta : { animation: {} };
	if (!mcmeta.animation) mcmeta.animation = {};

	// cap frametime at 15 to not crash the bot from rendering 6000 frames of prismarine
	let frametime = mcmeta.animation.frametime || 1;
	if (frametime > 15) frametime = 15;

	const frames = [];
	if (mcmeta.animation.frames?.length) {
		// add frames in specified order if possible
		for (let i = 0; i < mcmeta.animation.frames.length; i++) {
			const frame = mcmeta.animation.frames[i];
			switch (typeof frame) {
				case "number":
					frames.push({ index: frame, duration: frametime });
					break;
				case "object":
					frames.push({ index: frame.index || i, duration: frame.time || frametime });
					break;
				// If wrong frames support is given
				default:
					frames.push({ index: i, duration: frametime });
					break;
			}
		}
	} else {
		// just animate directly downwards if nothing specified
		for (let i = 0; i < baseCanvas.height / dimension.height; i++) {
			frames.push({ index: i, duration: frametime });
		}
	}

	// Draw frames:
	const encoder = new GIFEncoder(dimension.width, dimension.height);
	encoder.start();
	encoder.setTransparent(true);

	context.globalCompositeOperation = "copy";

	if (mcmeta.animation.interpolate) {
		let limit = frametime;
		for (let i = 0; i < frames.length; i++) {
			for (let y = 1; y <= limit; y++) {
				context.clearRect(0, 0, canvas.width, canvas.height);
				context.globalAlpha = 1;
				context.globalCompositeOperation = "copy";

				// frame i (always 100% opacity)
				context.drawImage(
					baseCanvas, // image
					0,
					dimension.height * frames[i].index, // sx, sy
					dimension.width,
					dimension.height, // sWidth, sHeight
					0,
					0, // dx, dy
					canvas.width,
					canvas.height, // dWidth, dHeight
				);

				context.globalAlpha = ((100 / frametime) * y) / 100;
				context.globalCompositeOperation = "source-atop";

				// frame i + 1 (transition)
				context.drawImage(
					baseCanvas, // image
					0,
					dimension.height * frames[(i + 1) % frames.length].index, // sx, sy
					dimension.width,
					dimension.height, // sWidth, sHeight
					0,
					0, // dx, dy
					canvas.width,
					canvas.height, // dWidth, dHeight
				);
				encoder.addFrame(context);
			}
		}
	} else {
		for (let i = 0; i < frames.length; i++) {
			context.clearRect(0, 0, dimension.width, dimension.height);
			context.globalAlpha = 1;

			// see: https://mdn.dev/archives/media/attachments/2012/07/09/225/46ffb06174df7c077c89ff3055e6e524/Canvas_drawimage.jpg
			context.drawImage(
				baseCanvas, // image
				0,
				dimension.height * frames[i].index, // sx, sy
				dimension.width,
				dimension.height, // sWidth, sHeight
				0,
				0, // dx, dy
				canvas.width,
				canvas.height, // dWidth, dHeight
			);

			encoder.setDelay(50 * frames[i].duration);
			encoder.addFrame(context);
		}
	}

	encoder.finish();
	return encoder.out.getData();
};
