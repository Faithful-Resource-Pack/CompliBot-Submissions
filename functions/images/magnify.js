const { createCanvas, loadImage, Image } = require("@napi-rs/canvas");

const { AttachmentBuilder } = require("discord.js");
const addDeleteButton = require("@helpers/addDeleteButton");

/**
 * The actual magnification function
 * @author Juknum, Evorp
 * @param {string | URL | Buffer | ArrayBufferLike | Uint8Array | Image | import("stream").Readable} origin any loadable image
 * @param {Boolean} isAnimation whether to magnify the image as a tilesheet
 * @returns {Promise<{ magnified: Buffer, width: Number, height: Number, factor: Number }>} buffer for magnified image
 */
async function magnifyBuffer(origin, isAnimation = false) {
	const input = await loadImage(origin).catch((err) => Promise.reject(err));

	// ignore height if tilesheet, otherwise it's not scaled as much
	const surface = isAnimation ? input.width * 16 : input.width * input.height;

	let factor = 64;
	if (surface == 256) factor = 32;
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
 * @param {string | URL | Buffer | ArrayBufferLike | Uint8Array | Image | import("stream").Readable} origin any loadable image
 * @param {String} name name, defaults to "magnified.png"
 * @returns {Promise<AttachmentBuilder>} magnified file
 */
async function magnifyAttachment(origin, name = "magnified.png") {
	const { magnified } = await magnifyBuffer(origin);
	return new AttachmentBuilder(magnified, { name });
}

/**
 * Sends message with magnified image
 * @author Juknum
 * @param {import("discord.js").Message} message message to reply to
 * @param {String} url
 * @returns {Promise<AttachmentBuilder>} the attachment that was sent
 */
async function magnify(message, url) {
	const attachment = await magnifyAttachment(url);

	await message.reply({ files: [attachment] }).then(addDeleteButton);
	return attachment;
}

module.exports = {
	magnify,
	magnifyAttachment,
	magnifyBuffer,
};
