const { createCanvas, loadImage, Image } = require("@napi-rs/canvas");

const { AttachmentBuilder } = require("discord.js");
const getDimensions = require("@images/getDimensions");
const addDeleteButton = require("@helpers/addDeleteButton");

/**
 * The actual magnification function
 * @author Juknum, Evorp
 * @param {String | Image | Buffer} origin url, image, or buffer to magnify
 * @param {Boolean} isAnimation whether to magnify the image as a tilesheet
 * @returns {Promise<{ magnified: Buffer, width: Number, height: Number, factor: Number }>} buffer for magnified image
 */
async function magnifyBuffer(origin, isAnimation = false) {
	const tmp = await loadImage(origin).catch((err) => Promise.reject(err));

	const dimension =
		typeof origin == "string"
			? await getDimensions(origin)
			: { width: tmp.width, height: tmp.height };

	// ignore height if tilesheet, otherwise it's not scaled as much
	const surface = isAnimation ? dimension.width * 16 : dimension.width * dimension.height;

	let factor = 64;
	if (surface == 256) factor = 32;
	if (surface > 256) factor = 16;
	if (surface > 1024) factor = 8;
	if (surface > 4096) factor = 4;
	if (surface > 65536) factor = 2;
	if (surface > 262144) factor = 1;

	const width = dimension.width * factor;
	const height = dimension.height * factor;
	const canvasResult = createCanvas(width, height);
	const canvasResultCTX = canvasResult.getContext("2d");

	canvasResultCTX.imageSmoothingEnabled = false;
	canvasResultCTX.drawImage(tmp, 0, 0, width, height);
	return { magnified: canvasResult.toBuffer("image/png"), width, height, factor };
}

/**
 * Returns discord attachment
 * @author Juknum
 * @param {String | Image | Buffer} origin url to magnify
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
