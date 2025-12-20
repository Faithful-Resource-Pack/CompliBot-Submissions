import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import type { MinecraftEdition, Texture } from "@interfaces/database";

import generateComparison from "@submission/creation/generateComparison";
import instapass from "@submission/actions/instapass";
import getPackByChannel from "@submission/discord/getPackByChannel";

import { submissionButtons, diffableButtons, submissionReactions } from "@helpers/interactions";
import { hasPermission, PermissionType } from "@helpers/permissions";
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
} from "discord.js";
import { loadImage } from "@napi-rs/canvas";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

export interface EmbedCreationParams {
	attachment: Attachment;
	description?: string;
	authors: Set<string>;
}

/**
 * Make a submission embed for a given texture and image
 * @author Juknum, Evorp
 * @param message used for channel and author information
 * @param texture texture information
 * @param params embed-specific data (e.g. attachment, description, coauthors)
 */
export default async function makeEmbed(
	message: Message<true>,
	texture: Texture,
	{ attachment, description, authors }: EmbedCreationParams,
) {
	// so the user doesn't think the bot is dead when it's loading a huge comparison
	message.channel.sendTyping();
	const packName = getPackByChannel(message.channel.id, "submit");
	let imgButtons: ActionRowBuilder<ButtonBuilder>[];

	// one star only (prevents italicized contributions getting instapassed)
	const doInstapass = description.startsWith("*") && description.match(/\*/g).length === 1;
	const member = message.guild.members.cache.get(Array.from(authors)[0]);
	const canInstapass = hasPermission(member, PermissionType.Submission);

	// load previous contributions if applicable
	if (description.startsWith("+") || (doInstapass && canInstapass)) {
		const lastContribution = texture.contributions
			.filter((contribution) => contribution.pack === packName)
			.sort((a, b) => (a.date > b.date ? -1 : 1))?.[0];

		if (lastContribution) {
			for (const author of lastContribution.authors) authors.add(author);
		}
	}

	// create base embed
	const embed = new EmbedBuilder()
		.setTitle(`[#${texture.id}] ${texture.name}`)
		.setColor(settings.colors.blue)
		.setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
		.setURL(
			`https://webapp.faithfulpack.net/gallery/${texture.uses[0].edition}/${packName}/latest/all/?show=${texture.id}`,
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

	// load raw image to pull from
	const rawImage = new AttachmentBuilder(attachment.url, { name: `${texture.name}.png` });
	const image = await loadImage(attachment.url);

	// generate comparison image if possible
	if (image.width * image.height <= 262144) {
		if (DEBUG) console.log(`Generating comparison image for texture: ${texture.name}`);

		const { comparisonImage, hasReference, mcmeta } = await generateComparison(
			packName,
			attachment,
			texture,
		);

		// send to #submission-spam for permanent urls
		const [thumbnailUrl, comparedUrl] = await getImages(message.client, rawImage, comparisonImage);

		embed
			.setImage(comparedUrl)
			.setThumbnail(thumbnailUrl)
			.setFooter({
				text: hasReference ? "Reference | Proposed | Current" : "Reference | Proposed",
			});

		// if it's a blank mcmeta there's no point adding a whole field for it
		if (Object.keys(mcmeta?.animation ?? {}).length)
			embed.addFields({
				name: "MCMETA",
				value: `\`\`\`json\n${JSON.stringify(mcmeta.animation)}\`\`\``,
			});

		imgButtons = hasReference ? [diffableButtons] : [submissionButtons];
	} else {
		if (DEBUG)
			console.log(
				`Texture is too big to generate comparison, loading directly instead: ${texture.name}`,
			);

		// image is too big so we just add it directly to the embed without comparison
		const [imageUrl] = await getImages(message.client, attachment);
		embed
			.setImage(imageUrl)
			.setThumbnail(imageUrl)
			.setFooter({ text: strings.submission.cant_compare });

		imgButtons = [submissionButtons];
	}

	if (description) embed.setDescription(description);
	if (authors.size > 1) embed.data.fields[0].name += "s";

	const embedMessage = await message.channel.send({
		embeds: [embed],
		components: imgButtons,
	});

	if (DEBUG) console.log(`Finished submission embed for texture: ${texture.name}`);

	if (doInstapass && canInstapass) {
		await instapass(embedMessage, member);
		await embedMessage.delete();
		return;
	}

	// don't bother adding reactions if the message is instapassed and deleted anyways
	for (const emoji of submissionReactions) await embedMessage.react(emoji);
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
