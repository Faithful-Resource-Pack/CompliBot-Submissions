const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { EmbedBuilder } = require("discord.js");
const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

/**
 * Tile an image
 * @author Juknum
 * @param {import("discord.js").MessageComponentInteraction} interaction
 * @param {import("@helpers/jsdoc").ImageSource} origin image url
 * @param {string} type tiling type
 * @returns {Promise<Buffer>} tiled image as a buffer
 */
module.exports = async function tile(interaction, origin) {
	const input = await loadImage(origin);

	if (input.width * input.height * 3 > 262144) {
		interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle(strings.command.image.output_too_big)
					.setDescription(
						`Maximum output allowed: 512x512px²\nYours is: ${input.width * 3}x${
							input.height * 3
						}px²`,
					)
					.setColor(settings.colors.red),
			],
			ephemeral: true,
		});
		return null;
	}

	const canvas = createCanvas(input.width * 3, input.height * 3);
	const ctx = canvas.getContext("2d");

	ctx.imageSmoothingEnabled = false;

	for (let i = 0; i < 3; ++i) {
		for (let j = 0; j < 3; ++j) {
			ctx.drawImage(input, i * input.width, j * input.height);
		}
	}

	return canvas.toBuffer("image/png");
};
