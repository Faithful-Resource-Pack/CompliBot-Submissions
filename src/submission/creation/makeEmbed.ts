import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import type { MinecraftEdition, Pack, Texture } from "@interfaces/database";

import generateComparison from "@submission/creation/generateComparison";
import getPackByChannel from "@submission/discord/getPackByChannel";

import { submissionButtons, diffableButtons } from "@helpers/interactions";
import getImages from "@helpers/getImages";
import versionRange from "@helpers/versionRange";

import {
	EmbedBuilder,
	AttachmentBuilder,
	Message,
	APIEmbedField,
	ActionRowBuilder,
	ButtonBuilder,
	Attachment,
	MessageCreateOptions,
	Client,
} from "discord.js";
import { loadImage } from "@napi-rs/canvas";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

export interface EmbedCreationParams {
	attachment: Attachment;
	description: string;
	authors: Set<string>;
}

export interface EmbedImageParams {
	image: string;
	thumbnail: string;
	footer: string;
	buttons: ActionRowBuilder<ButtonBuilder>;
}

/**
 * Generate a submission embed for a given texture and image
 * @author Juknum, Evorp
 * @param message message to reference
 * @param texture texture information
 * @param params embed-specific data (e.g. attachment, description, coauthors)
 * @returns embed and components to send
 */
export default async function makeEmbed(
	message: Message<true>,
	texture: Texture,
	{ attachment, description, authors }: EmbedCreationParams,
): Promise<MessageCreateOptions> {
	const pack = getPackByChannel(message.channel.id);

	// load previous contributions if applicable
	if (description.startsWith("+") || description.startsWith("*+")) {
		const lastContribution = texture.contributions
			.filter((contribution) => contribution.pack === pack.id)
			.sort((a, b) => (a.date > b.date ? -1 : 1))?.[0];

		if (lastContribution) {
			for (const author of lastContribution.authors) authors.add(author);
		}
	}

	const embed = new EmbedBuilder()
		.setAuthor({
			name: message.author.username,
			iconURL: message.author.displayAvatarURL(),
			url: `https://faithfulpack.net/user/${message.author.id}`,
		})
		.setTitle(`[#${texture.id}] ${texture.name}`)
		.setColor(settings.colors.blue)
		.setURL(
			`https://webapp.faithfulpack.net/gallery/${texture.uses[0].edition}/${pack.id}/latest/all/?show=${texture.id}`,
		)
		.addFields(
			{
				name: "Author",
				value: Array.from(authors)
					.map((id) => `<@${id}>`)
					.join("\n"),
				inline: true,
			},
			{ name: "Status", value: `<:pending:${settings.emojis.pending}> Pending…`, inline: true },
			...addPathsToEmbed(texture),
		);

	if (description) embed.setDescription(description);
	if (authors.size > 1) embed.data.fields[0].name += "s";

	// if it's a blank mcmeta there's no point adding a whole field for it
	if (Object.keys(texture.mcmeta?.animation ?? {}).length)
		embed.addFields({
			name: "MCMETA",
			value: `\`\`\`json\n${JSON.stringify(texture.mcmeta.animation)}\`\`\``,
		});

	const { image, thumbnail, footer, buttons } = await createEmbedImages(
		message.client,
		attachment,
		texture,
		pack,
	);

	embed.setImage(image).setThumbnail(thumbnail).setFooter({ text: footer });

	if (DEBUG) console.log(`Finished formatting submission embed for texture: ${texture.name}`);
	return { embeds: [embed], components: [buttons] };
}

/**
 * Create image links for a given submission and return relevant metadata
 * @author Evorp
 * @param client discord client
 * @param attachment attachment to load
 * @param texture texture to compare against
 * @param pack pack to compare images against
 * @returns image urls and relevant embed data
 */
export async function createEmbedImages(
	client: Client,
	attachment: Attachment,
	texture: Texture,
	pack: Pack,
): Promise<EmbedImageParams> {
	// load raw image to pull from
	const rawImage = new AttachmentBuilder(attachment.url, { name: `${texture.name}.png` });
	const image = await loadImage(attachment.url);

	// image is too big, don't even bother magnifying since it's already big enough
	if (image.width * image.height > 262144) {
		if (DEBUG)
			console.log(
				`Texture is too big to generate comparison, loading directly instead: ${texture.name}`,
			);

		// image is too big so we just add it directly to the embed without comparison
		const [imageUrl] = await getImages(client, attachment);
		return {
			image: imageUrl,
			thumbnail: imageUrl,
			footer: strings.submission.cant_compare,
			buttons: submissionButtons,
		};
	}

	if (DEBUG) console.log(`Generating comparison image for texture: ${texture.name}`);

	const { comparisonImage, hasReference } = await generateComparison(attachment, texture, pack);

	// send to #submission-spam for permanent urls
	const [thumbnailUrl, comparedUrl] = await getImages(client, rawImage, comparisonImage);

	return {
		image: comparedUrl,
		thumbnail: thumbnailUrl,
		footer: hasReference ? "Reference | Proposed | Current" : "Reference | Proposed",
		buttons: hasReference ? diffableButtons : submissionButtons,
	};
}

/**
 * Generate embed fields for a given texture's paths
 * @author Juknum
 * @param texture texture to get paths and uses from
 * @returns usable embed field data
 */
export function addPathsToEmbed(texture: Texture): APIEmbedField[] {
	const groupedPaths = texture.uses.reduce<Partial<Record<MinecraftEdition, string[]>>>(
		(acc, use) => {
			const paths = texture.paths
				.filter((el) => el.use === use.id)
				.map((p) => `\`[${versionRange(p.versions)}]\` ${p.name}`);
			acc[use.edition] ||= [];
			acc[use.edition].push(...paths);
			return acc;
		},
		{},
	);

	// convert from use object to embed-compatible data
	return Object.entries(groupedPaths).map(([edition, paths]) => ({
		name: edition[0].toUpperCase() + edition.slice(1),
		value: paths.join("\n"),
	}));
}
