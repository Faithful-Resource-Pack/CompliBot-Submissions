const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");
const DEBUG = process.env.DEBUG.toLowerCase() == "true";

const minecraftSorter = require("@helpers/minecraftSorter");
const getPackByChannel = require("@submission/utility/getPackByChannel");
const getDimensions = require("@images/getDimensions");
const getImages = require("@helpers/getImages");
const generateComparison = require("@submission/utility/generateComparison");
const { imageButtons, submissionButtons } = require("@helpers/interactions");

const { MessageEmbed, AttachmentBuilder } = require("discord.js");
const { submissionReactions } = require("@helpers/interactions");

/**
 * Make a submission embed for a given texture and image
 * @author Juknum, Evorp
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").Message} message used for channel and author information
 * @param {import("@helpers/jsdoc").Texture} texture texture information
 * @param {import("discord.js").AttachmentBuilder} attachment raw texture to embed
 * @param {{ description?: String, authors: String[] }} params additional info (e.g. description, coauthors)
 */
module.exports = async function makeEmbed(client, message, texture, attachment, params = {}) {
	const packName = getPackByChannel(message.channel.id, "submit");
	let imgButtons;

	// load previous contributions if applicable
	if (params.description.startsWith("+")) {
		const allContributions = texture.contributions.filter(
			(contribution) => contribution.pack == packName,
		);
		if (allContributions.length) {
			const lastContribution = allContributions.sort((a, b) => (a.date > b.date ? -1 : 1))[0];
			for (const author of lastContribution.authors)
				if (!params.authors.includes(author)) params.authors.push(author);
		}
	}

	// create base embed
	const embed = new MessageEmbed()
		.setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
		.setColor(settings.colors.blue)
		.setTitle(`[#${texture.id}] ${texture.name}`)
		.setURL(`https://webapp.faithfulpack.net/#/gallery/java/32x/latest/all/?show=${texture.id}`)
		.addFields([
			{ name: "Author", value: `<@!${params.authors.join(">\n<@!").toString()}>`, inline: true },
			{ name: "Status", value: `<:pending:${settings.emojis.pending}> Pending...`, inline: true },
			...addPathsToEmbed(texture),
		]);

	// load raw image to pull from
	const rawImage = new AttachmentBuilder(attachment.url, `${texture.name}.png`);
	const dimension = await getDimensions(attachment.url);

	// generate comparison image if possible
	if (dimension.width * dimension.height <= 262144) {
		if (DEBUG) console.log(`Generating comparison image for texture: ${texture.name}`);

		const isAnimated = texture.paths.filter((p) => p.mcmeta === true).length !== 0;

		const { comparisonImage, hasReference, mcmeta } = await generateComparison(
			packName,
			attachment,
			{
				path: texture.paths[0].name,
				version: texture.paths[0].versions.sort(minecraftSorter).reverse()[0],
				edition: texture.uses[0].edition.toLowerCase(),
				animation: isAnimated ? texture.paths.filter((p) => p.mcmeta === true)[0] : null,
			},
		);

		// send to #submission-spam for permanent urls
		const [thumbnailUrl, comparedUrl] = await getImages(client, rawImage, comparisonImage);

		embed.setImage(comparedUrl);
		embed.setThumbnail(thumbnailUrl);
		embed.setFooter({ text: hasReference ? "Reference | New | Current" : "Reference | New" });

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
		const [imageUrl] = await getImages(client, attachment);
		embed
			.setImage(imageUrl)
			.setThumbnail(imageUrl)
			.setFooter({ text: strings.submission.cant_compare });

		imgButtons = [imageButtons];
	}

	if (params.description) embed.setDescription(params.description);
	if (params.authors.length > 1) embed.fields[0].name = "Authors";

	const msg = await message.channel.send({
		embeds: [embed],
		components: imgButtons,
	});

	for (const emoji of submissionReactions) await msg.react(emoji);

	if (DEBUG) console.log(`Finished submission embed for texture: ${texture.name}`);
};

/**
 * Return organized path data for a given texture
 * @param {import("@helpers/jsdoc").Texture} texture
 * @returns {import("discord.js").EmbedFieldData[]}
 */
function addPathsToEmbed(texture) {
	const tmp = {};
	texture.uses.forEach((use) => {
		texture.paths
			.filter((el) => el.use === use.id)
			.forEach((p) => {
				const versions = p.versions.sort(minecraftSorter);
				const versionRange = `\`[${
					versions.length > 1 ? `${versions[0]} — ${versions[versions.length - 1]}` : versions[0]
				}]\``;
				const formatted = `${versionRange} ${p.name}`;
				if (tmp[use.edition]) tmp[use.edition].push(formatted);
				else tmp[use.edition] = [formatted];
			});
	});

	return Object.keys(tmp).map((edition) => {
		if (tmp[edition].length) {
			return {
				name: edition.charAt(0).toLocaleUpperCase() + edition.slice(1),
				value: tmp[edition].join("\n"),
			};
		}
	});
}
