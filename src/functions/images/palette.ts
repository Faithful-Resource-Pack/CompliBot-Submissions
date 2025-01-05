import type { AnyInteraction } from "@interfaces/discord";
import type { ImageSource } from "@interfaces/images";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import { EmbedBuilder, AttachmentBuilder } from "discord.js";

const COOLORS_URL = "https://coolors.co/";

const COLORS_PER_PALETTE = 9;
const COLORS_PER_PALETTE_LINE = 3;
const COLORS_TOP = COLORS_PER_PALETTE * 6;

const GRADIENT_TOP = 250;
const GRADIENT_SAT_THRESHOLD = 15 / 100;
const GRADIENT_HUE_DIFF = 13 / 100;
const GRADIENT_WIDTH = 700;
const GRADIENT_BAND_WIDTH = 3;
const GRADIENT_HEIGHT = 50;

export interface ColorStorage {
	hex: string;
	opacity: number[];
	// https://devblogs.microsoft.com/typescript/announcing-typescript-4-0/#labeled-tuple-elements
	rgb: [r: number, g: number, b: number];
	count: number;
}

type AllColors = Record<string, ColorStorage>;

/**
 * Sends an ephemeral message with the palette of a given image url
 * @author Juknum, Evorp
 * @param interaction discord interaction to respond to
 * @param origin Image URL
 */
export default async function palette(interaction: AnyInteraction, origin: ImageSource) {
	const input = await loadImage(origin);

	if (input.width * input.height > 262144)
		return interaction.reply({
			content: strings.command.image.input_too_big,
			ephemeral: true,
		});

	const ctx = createCanvas(input.width, input.height).getContext("2d");
	ctx.drawImage(input, 0, 0);

	const allColors: AllColors = {};

	const imageData = ctx.getImageData(0, 0, input.width, input.height).data;

	for (let x = 0; x < input.width; ++x) {
		for (let y = 0; y < input.height; ++y) {
			const index = (y * input.width + x) * 4;
			const r = imageData[index];
			const g = imageData[index + 1];
			const b = imageData[index + 2];
			const a = imageData[index + 3] / 255;

			// avoid transparent colors
			if (!a) continue;
			const hex = rgbToHex(r, g, b);
			if (!(hex in allColors)) allColors[hex] = { hex, opacity: [], rgb: [r, g, b], count: 0 };

			++allColors[hex].count;
			allColors[hex].opacity.push(a);
		}
	}

	// convert back to array
	const colors = Object.values(allColors)
		.sort((a, b) => b.count - a.count)
		.slice(0, COLORS_TOP)
		.map((el) => el.hex);

	const embed = new EmbedBuilder()
		.setTitle("Palette results")
		.setDescription(`Total: ${Object.keys(allColors).length}`)
		.setColor(settings.colors.blue);

	const fieldGroups: string[][][] = [];
	let group: number;
	for (let i = 0; i < colors.length; ++i) {
		// create 9 groups
		if (i % COLORS_PER_PALETTE === 0) {
			fieldGroups.push([]);
			group = 0;
		}

		// each groups has 3 lines
		if (group % COLORS_PER_PALETTE_LINE === 0) fieldGroups.at(-1).push([]);

		// add color to latest group latest line
		fieldGroups.at(-1)[fieldGroups[fieldGroups.length - 1].length - 1].push(colors[i]);
		++group;
	}

	fieldGroups.forEach((group, index) => {
		const groupValue = group
			.map((line) =>
				line.map((color) => `[\`${color}\`](${COOLORS_URL}${color.replace("#", "")})`).join(" "),
			)
			.join(" ");

		embed.addFields({
			name: "Hex" + (fieldGroups.length > 1 ? ` part ${index + 1}` : "") + ": ",
			value: groupValue,
			inline: true,
		});
	});

	// create palette links, 9 max per link
	// make arrays of hex arrays
	const paletteGroups: string[][] = [];
	for (let i = 0; i < colors.length; ++i) {
		if (i % COLORS_PER_PALETTE === 0) paletteGroups.push([]);
		paletteGroups.at(-1).push(colors[i].replace("#", ""));
	}

	// create urls
	const paletteUrls: string[] = [];
	let groupLength = 0;

	for (let i = 0; i < paletteGroups.length; ++i) {
		const link = `**[Palette${
			paletteGroups.length > 1 ? " part " + (i + 1) : ""
		}](${COOLORS_URL}${paletteGroups[i].join("-")})** `;

		// too long
		if (groupLength + link.length + 3 > 1024) break;

		paletteUrls.push(link);
		groupLength += link.length;
	}

	// add field at top
	embed.spliceFields(0, 0, {
		name: "List of colors:",
		value: paletteUrls.join(" - "),
		inline: false,
	});

	// create gradient canvas for top GRADIENT_TOP colors
	const bandWidth =
		Object.values(allColors).length > GRADIENT_TOP
			? GRADIENT_BAND_WIDTH
			: Math.floor(GRADIENT_WIDTH / Object.values(allColors).length);

	// compute width
	const allColorsSorted = Object.values(allColors)
		.sort((a, b) => b.count - a.count)
		.slice(0, GRADIENT_TOP)
		.sort((a, b) => {
			const [ha, sa, la] = rgbToHSL(a.rgb[0], a.rgb[1], a.rgb[2]);
			const [hb, sb, lb] = rgbToHSL(b.rgb[0], b.rgb[1], b.rgb[2]);

			if (sa <= GRADIENT_SAT_THRESHOLD && sb > GRADIENT_SAT_THRESHOLD) return -1;
			else if (sa > GRADIENT_SAT_THRESHOLD && sb <= GRADIENT_SAT_THRESHOLD) return 1;
			else if (sa <= GRADIENT_SAT_THRESHOLD && sb <= GRADIENT_SAT_THRESHOLD) {
				return la > lb ? 1 : -(la < lb);
			} else if (Math.abs(ha - hb) > GRADIENT_HUE_DIFF) return ha > hb ? 1 : -(ha < hb);

			return la > lb ? 1 : -(la < lb);
		});

	const output = createCanvas(bandWidth * allColorsSorted.length, GRADIENT_HEIGHT);
	const outCtx = output.getContext("2d");

	allColorsSorted.forEach((color, index) => {
		outCtx.fillStyle = color.hex;
		outCtx.globalAlpha = color.opacity.reduce((a, v, i) => (a * i + v) / (i + 1)); // average alpha
		outCtx.fillRect(bandWidth * index, 0, bandWidth, GRADIENT_HEIGHT);
	});

	// create the attachement
	const colorImageAttachment = new AttachmentBuilder(output.toBuffer("image/png"), {
		name: "colors.png",
	});

	return interaction.reply({
		embeds: [embed],
		files: [colorImageAttachment],
		ephemeral: true,
	});
}

function rgbToHex(r: number, g: number, b: number) {
	return (
		"#" +
		((r | (1 << 8)).toString(16).slice(1) +
			(g | (1 << 8)).toString(16).slice(1) +
			(b | (1 << 8)).toString(16).slice(1))
	);
}

/**
 * Converts an RGB color value to HSV. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and v in the set [0, 1].
 *
 * @param r The red color value
 * @param g The green color value
 * @param b The blue color value
 * @returns The HSL representation
 */
function rgbToHSL(r: number, g: number, b: number): number[] {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const diff = max - min;

	let h: number;
	let s: number;
	let l = (max + min) / 2;

	// all color channels are equal so it's grayscale
	if (!diff) h = s = 0;
	else {
		s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

		switch (max) {
			case r:
				h = (g - b) / diff + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / diff + 2;
				break;
			case b:
				h = (r - g) / diff + 4;
				break;
		}

		h /= 6;
	}

	return [h, s, l];
}
