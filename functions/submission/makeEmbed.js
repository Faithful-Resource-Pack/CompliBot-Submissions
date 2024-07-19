const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");
const DEBUG = process.env.DEBUG.toLowerCase() == "true";

const minecraftSorter = require("@helpers/minecraftSorter");
const getPackByChannel = require("@submission/utility/getPackByChannel");
const getImages = require("@helpers/getImages");
const generateComparison = require("@submission/utility/generateComparison");
const { imageButtons, submissionButtons, submissionReactions } = require("@helpers/interactions");

const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { loadImage } = require("@napi-rs/canvas");

/**
 * Make a submission embed for a given texture and image
 * @author Juknum, Evorp
 * @param {import("discord.js").Message} message used for channel and author information
 * @param {import("@helpers/jsdoc").Texture} texture texture information
 * @param {import("discord.js").Attachment} attachment raw texture to embed
 * @param {{ description?: string, authors: string[] }} params additional info (e.g. description, coauthors)
 */
module.exports = async function makeEmbed(
	message,
	texture,
	attachment,
	{ description, authors } = {},
) {
	// so the user doesn't think the bot is dead when it's loading a huge comparison
	message.channel.sendTyping();
	const packName = getPackByChannel(message.channel.id, "submit");
	let imgButtons;

	// load previous contributions if applicable
	if (description.startsWith("+")) {
		const lastContribution = texture.contributions
			.filter((contribution) => contribution.pack === packName)
			.sort((a, b) => (a.date > b.date ? -1 : 1))?.[0];

		if (lastContribution) {
			for (const author of lastContribution.authors)
				if (!authors.includes(author)) authors.push(author);
		}
	}

	// create base embed
	const embed = new EmbedBuilder()
		.setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
		.setColor(settings.colors.blue)
		.setTitle(`[#${texture.id}] ${texture.name}`)
		.setURL(
			`https://webapp.faithfulpack.net/gallery/${texture.uses[0].edition}/${packName}/latest/all/?show=${texture.id}`,
		)
		.addFields(
			{
				name: "Author",
				value: `<@${authors.join(">\n<@")}>`,
				inline: true,
			},
			{ name: "Status", value: `<:pending:${settings.emojis.pending}> Pending...`, inline: true },
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
			.setFooter({ text: hasReference ? "Reference | New | Current" : "Reference | New" });

		// if it's a blank mcmeta there's no point adding a whole field for it
		if (Object.keys(mcmeta?.animation ?? {}).length)
			embed.addFields({
				name: "MCMETA",
				value: `\`\`\`json\n${JSON.stringify(mcmeta.animation)}\`\`\``,
			});

		imgButtons = hasReference ? [submissionButtons] : [imageButtons];
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

		imgButtons = [imageButtons];
	}

	if (description) embed.setDescription(description);
	if (authors.length > 1) embed.data.fields[0].name += "s";

	const msg = await message.channel.send({
		embeds: [embed],
		components: imgButtons,
	});

	for (const emoji of submissionReactions) await msg.react(emoji);

	if (DEBUG) console.log(`Finished submission embed for texture: ${texture.name}`);
};

/**
 * Generate embed fields for a given texture's paths
 * @author Juknum
 * @param {import("@helpers/jsdoc").Texture} texture texture to get paths and uses from
 * @returns {import("discord.js").APIEmbedField[]} usable embed field data
 */
function addPathsToEmbed(texture) {
	/** @type {Record<import("@helpers/jsdoc").MinecraftEdition, string[]>} */
	const groupedPaths = texture.uses.reduce((acc, use) => {
		const paths = texture.paths
			.filter((el) => el.use === use.id)
			.map((p) => {
				const versions = p.versions.sort(minecraftSorter);
				const versionRange = `\`[${
					versions.length > 1 ? `${versions[0]} – ${versions[versions.length - 1]}` : versions[0]
				}]\``;
				return `${versionRange} ${p.name}`;
			});
		if (!acc[use.edition]) acc[use.edition] = [];
		acc[use.edition].push(...paths);
		return acc;
	}, {});

	// convert from use object to embed-compatible data
	return Object.entries(groupedPaths).map(([edition, paths]) => ({
		name: edition[0].toUpperCase() + edition.slice(1),
		value: paths.join("\n"),
	}));
}
