import { createCanvas, loadImage } from "@napi-rs/canvas";
import { EmbedBuilder, MessageFlags } from "discord.js";
import settings from "@resources/settings.json";
import strings from "@resources/strings.json";
import type { ImageSource } from "@interfaces/images";
import type { AnyInteraction } from "@interfaces/discord";

/**
 * Tile an image
 * @author Juknum
 * @param interaction discord interaction to respond to
 * @param image url
 * @returns tiled image as a buffer
 */
export default async function tile(interaction: AnyInteraction, origin: ImageSource) {
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
			flags: MessageFlags.Ephemeral,
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
}
