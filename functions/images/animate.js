const { createCanvas } = require("@napi-rs/canvas");
const GIFEncoder = require("./GIFEncoder");

/**
 * @typedef MCMETA
 * @property {Animation} animation
 * @typedef Animation
 * @property {Number?} frametime
 * @property {Boolean?} interpolate
 * @property {(Number | { index?: Number, time?: Number })[]?} frames thank you mojang very cool
 * @property {Number?} height
 * @property {Number?} width
 */

/**
 * @typedef MappedFrame
 * @property {Number} index
 * @property {Number} duration
 */

/**
 * Animate a given image with a given mcmeta
 * @author superboxer4, Evorp, Juknum
 * @param {import("@napi-rs/canvas").Canvas} baseCanvas tilesheet to animate
 * @param {MCMETA} mcmeta how you want it animated
 * @returns {Promise<Buffer>} animated GIF as buffer
 */
module.exports = async function animate(baseCanvas, mcmeta) {
	if (!mcmeta.animation) mcmeta.animation = {};

	if (!mcmeta.animation?.width) mcmeta.animation.width = baseCanvas.width;
	// assume square image if not declared explicitly (baseCanvas.height is full spritesheet)
	if (!mcmeta.animation?.height) mcmeta.animation.height = baseCanvas.width;

	// cap frametime at 15 to not crash the bot from rendering 6000 frames of prismarine
	let frametime = mcmeta.animation?.frametime || 1;
	if (frametime > 15) frametime = 15;

	/** @type {MappedFrame[]} */
	const frames = [];
	if (mcmeta.animation.frames?.length) {
		// add frames in specified order if possible
		for (let i = 0; i < mcmeta.animation.frames.length; ++i) {
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
		for (let i = 0; i < baseCanvas.height / mcmeta.animation.height; ++i) {
			frames.push({ index: i, duration: frametime });
		}
	}

	// initialize gif encoder and final canvas
	const canvas = createCanvas(mcmeta.animation.width, mcmeta.animation.height);
	const context = canvas.getContext("2d");
	context.imageSmoothingEnabled = false;
	const encoder = new GIFEncoder(mcmeta.animation.width, mcmeta.animation.height);
	encoder.start();
	encoder.setTransparent(true);
	context.globalCompositeOperation = "copy";

	if (mcmeta.animation.interpolate) {
		let limit = frametime;
		for (let i = 0; i < frames.length; ++i) {
			for (let y = 1; y <= limit; ++y) {
				context.clearRect(0, 0, mcmeta.animation.width, mcmeta.animation.height);
				context.globalAlpha = 1;
				context.globalCompositeOperation = "copy";

				// frame i (always 100% opacity)
				context.drawImage(
					baseCanvas, // image
					0,
					mcmeta.animation.height * frames[i].index, // sx, sy
					mcmeta.animation.width,
					mcmeta.animation.height, // sWidth, sHeight
					0,
					0, // dx, dy
					mcmeta.animation.width,
					mcmeta.animation.height, // dWidth, dHeight
				);

				context.globalAlpha = ((100 / frametime) * y) / 100;
				context.globalCompositeOperation = "source-atop";

				// frame i + 1 (transition)
				context.drawImage(
					baseCanvas, // image
					0,
					mcmeta.animation.height * frames[(i + 1) % frames.length].index, // sx, sy
					mcmeta.animation.width,
					mcmeta.animation.height, // sWidth, sHeight
					0,
					0, // dx, dy
					mcmeta.animation.width,
					mcmeta.animation.height, // dWidth, dHeight
				);
				encoder.addFrame(context);
			}
		}
	} else {
		for (let i = 0; i < frames.length; ++i) {
			context.clearRect(0, 0, mcmeta.animation.width, mcmeta.animation.height);
			context.globalAlpha = 1;

			// see: https://mdn.dev/archives/media/attachments/2012/07/09/225/46ffb06174df7c077c89ff3055e6e524/Canvas_drawimage.jpg
			context.drawImage(
				baseCanvas, // image
				0,
				mcmeta.animation.height * frames[i].index, // sx, sy
				mcmeta.animation.width,
				mcmeta.animation.height, // sWidth, sHeight
				0,
				0, // dx, dy
				mcmeta.animation.width,
				mcmeta.animation.height, // dWidth, dHeight
			);

			encoder.setDelay(50 * frames[i].duration);
			encoder.addFrame(context);
		}
	}

	encoder.finish();
	return encoder.out.getData();
};
